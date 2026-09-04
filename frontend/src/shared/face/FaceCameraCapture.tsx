import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Camera, CameraSlash } from '@phosphor-icons/react';
import { useFaceApiModels, detectFaceDescriptor } from './useFaceApiModels';

const DETECT_INTERVAL_MS = 400;

export interface FaceDetectResult {
  descriptor: number[];
  qualityScore: number;
}

export interface FaceCameraCaptureHandle {
  /** Trả về descriptor của khung hình gần nhất có phát hiện khuôn mặt, null nếu chưa có mặt nào trong khung hình. */
  capture: () => FaceDetectResult | null;
}

/**
 * Camera nhận diện khuôn mặt dùng chung cho cả luồng enroll (staff bấm nút "Chụp" — xem
 * FaceCameraCaptureHandle.capture) và kiosk check-in (`onFrame` bắn liên tục mỗi
 * DETECT_INTERVAL_MS để tự so khớp). Cấu trúc bật/tắt camera + cleanup mô phỏng theo
 * `frontend/src/staff/components/QrCameraScanner.tsx` đã có sẵn trong repo.
 */
const FaceCameraCapture = forwardRef<FaceCameraCaptureHandle, {
  /** true = camera luôn bật khi mount (kiosk); false = có nút bật/tắt thủ công (enroll). */
  autoStart?: boolean;
  /** Gọi liên tục mỗi lần detect xong 1 khung hình (kiosk dùng để tự so khớp). */
  onFrame?: (result: FaceDetectResult | null) => void;
}>(function FaceCameraCapture({ autoStart = false, onFrame }, ref) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const latestRef = useRef<FaceDetectResult | null>(null);
  const onFrameRef = useRef(onFrame);
  const [cameraOn, setCameraOn] = useState(autoStart);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [liveResult, setLiveResult] = useState<FaceDetectResult | null>(null);
  const { ready: modelsReady, error: modelsError } = useFaceApiModels();

  useEffect(() => {
    onFrameRef.current = onFrame;
  }, [onFrame]);

  useImperativeHandle(ref, () => ({
    capture: () => latestRef.current,
  }));

  useEffect(() => {
    if (!cameraOn || !videoRef.current) return;

    let cancelled = false;
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'user' } })
      .then((stream) => {
        if (cancelled || !videoRef.current) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        videoRef.current.srcObject = stream;
      })
      .catch(() => {
        setCameraError('Không thể truy cập camera. Vui lòng cấp quyền camera cho trình duyệt.');
        setCameraOn(false);
      });

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [cameraOn]);

  // Vòng lặp detect — chỉ chạy khi camera bật VÀ model đã tải xong.
  useEffect(() => {
    if (!cameraOn || !modelsReady || !videoRef.current) return;

    const video = videoRef.current;
    let cancelled = false;
    let running = false;

    const tick = async () => {
      if (running || cancelled || video.readyState < 2) return;
      running = true;
      try {
        const result = await detectFaceDescriptor(video);
        if (!cancelled) {
          latestRef.current = result;
          setLiveResult(result);
          onFrameRef.current?.(result);
        }
      } catch {
        // Bỏ qua lỗi 1 khung hình lẻ (vd. video chưa sẵn sàng) — vòng lặp tự thử lại ở tick sau.
      } finally {
        running = false;
      }
    };

    const interval = setInterval(tick, DETECT_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [cameraOn, modelsReady]);

  return (
    <div className="flex flex-col gap-3">
      {!autoStart && (
        <button
          type="button"
          onClick={() => {
            setCameraError(null);
            setCameraOn((v) => !v);
          }}
          className="inline-flex w-fit items-center gap-1.5 rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-bold text-white hover:bg-slate-900 dark:bg-zinc-700 dark:hover:bg-zinc-600"
        >
          {cameraOn ? <CameraSlash size={16} /> : <Camera size={16} />}
          {cameraOn ? 'Tắt Camera' : 'Bật Camera'}
        </button>
      )}

      {(cameraError || modelsError) && (
        <p className="text-xs font-semibold text-red-600 dark:text-red-400">{cameraError || modelsError}</p>
      )}

      {cameraOn && (
        <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950">
          <video ref={videoRef} autoPlay muted playsInline className="h-full w-full object-cover" />

          <div className="pointer-events-none absolute inset-8 flex items-center justify-center rounded-full border-2 border-dashed border-emerald-500/70">
            <span className="rounded bg-zinc-950/80 px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-emerald-400">
              {!modelsReady
                ? 'Đang tải model...'
                : liveResult
                  ? `Đã nhận diện (${Math.round(liveResult.qualityScore * 100)}%)`
                  : 'Chưa thấy khuôn mặt'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
});

export default FaceCameraCapture;
