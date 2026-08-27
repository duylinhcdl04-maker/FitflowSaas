import { useEffect, useRef, useState } from 'react';
import QrScanner from 'qr-scanner';
import { Camera, CameraSlash } from '@phosphor-icons/react';
import Button from '../../owner/components/Button';

// Ignore repeat decodes of the same physical scan while the customer still holds
// their phone up to the camera (qr-scanner decodes several times a second) — without
// this a single "quét" would fire the check-in/out mutation many times in a row.
const DECODE_COOLDOWN_MS = 3000;

/**
 * Live camera-based QR reader — opens the device camera (webcam or phone) right in
 * the browser and auto-decodes the customer's dynamic QR from the video feed, no
 * physical USB/Bluetooth scanner needed. `onDecode` fires at most once per
 * DECODE_COOLDOWN_MS so the same held-up code isn't submitted repeatedly.
 */
export default function QrCameraScanner({ onDecode }: { onDecode: (text: string) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const onDecodeRef = useRef(onDecode);
  const lastDecodeAtRef = useRef(0);
  const [cameraOn, setCameraOn] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Keep the latest onDecode available to the scanner callback without having to
  // recreate the QrScanner (and thus restart the camera) every render.
  useEffect(() => {
    onDecodeRef.current = onDecode;
  }, [onDecode]);

  useEffect(() => {
    if (!cameraOn || !videoRef.current) return;

    const scanner = new QrScanner(
      videoRef.current,
      (result) => {
        const now = Date.now();
        if (now - lastDecodeAtRef.current < DECODE_COOLDOWN_MS) return;
        lastDecodeAtRef.current = now;
        onDecodeRef.current(result.data);
      },
      {
        returnDetailedScanResult: true,
        highlightScanRegion: true,
        highlightCodeOutline: true,
        maxScansPerSecond: 5,
      },
    );

    scanner.start().catch(() => {
      setCameraError('Không thể truy cập camera. Vui lòng cấp quyền camera cho trình duyệt.');
      setCameraOn(false);
    });

    return () => scanner.destroy();
  }, [cameraOn]);

  return (
    <div className="flex flex-col gap-3">
      <Button
        type="button"
        variant={cameraOn ? 'secondary' : 'primary'}
        size="sm"
        onClick={() => {
          setCameraError(null);
          setCameraOn((v) => !v);
        }}
        className="w-fit gap-1.5"
      >
        {cameraOn ? <CameraSlash size={16} /> : <Camera size={16} />}
        {cameraOn ? 'Tắt Camera' : 'Bật Camera Quét'}
      </Button>

      {cameraError && <p className="text-xs font-semibold text-red-600 dark:text-red-400">{cameraError}</p>}

      {cameraOn && (
        <div className="relative aspect-video w-full max-w-sm overflow-hidden rounded-2xl border border-emerald-300 bg-zinc-950 dark:border-emerald-800">
          <video ref={videoRef} className="h-full w-full object-cover" muted playsInline />
        </div>
      )}
    </div>
  );
}
