import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ScanSmiley, SignIn, SignOut, WarningCircle, Scan } from '@phosphor-icons/react';
import { getFaceDescriptors, faceCheckin, getManagerCheckinConfig, type FaceCheckinResult } from '../../manager/api/manager';
import { apiErrorMessage } from '../../owner/api/client';
import Callout from '../../owner/components/Callout';
import FaceCameraCapture from '../../shared/face/FaceCameraCapture';
import type { FaceDetectResult } from '../../shared/face/FaceCameraCapture';
import { buildFaceMatcher } from '../../shared/face/faceMatcher';
import QrCameraScanner from '../components/QrCameraScanner';
import { qrScanCheckin } from '../../manager/api/manager';
import { useRealtimeInvalidate } from '../../lib/useRealtimeInvalidate';

// Cần khớp liên tiếp bao nhiêu khung hình cùng 1 người trước khi gọi API check-in — chống
// 1 khung hình mờ ăn may khớp nhầm (backend/docs/face-checkin.md §3.2).
const CONSECUTIVE_MATCHES_REQUIRED = 2;
// Sau khi check-in/out thành công, tạm khoá vòng lặp để khách còn đứng trước camera không
// bị gọi API lặp lại nhiều lần (giống DECODE_COOLDOWN_MS của QrCameraScanner.tsx).
const RESULT_COOLDOWN_MS = 5000;

export default function FaceCheckinKioskPage() {
  const queryClient = useQueryClient();
  const [toast, setToast] = useState<(FaceCheckinResult & { at: number }) | null>(null);
  const [errorToast, setErrorToast] = useState<string | null>(null);
  const [useQrFallback, setUseQrFallback] = useState(false);

  const streakRef = useRef<{ customerId: string; count: number } | null>(null);
  const lockedRef = useRef(false);

  const { data: checkinConfig } = useQuery({
    queryKey: ['manager-checkin-config'],
    queryFn: getManagerCheckinConfig,
    staleTime: 60_000,
  });

  const { data: descriptorData } = useQuery({
    queryKey: ['face-descriptors'],
    queryFn: () => getFaceDescriptors(),
    enabled: checkinConfig?.face !== false,
    refetchInterval: 5 * 60_000, // safety-net chậm — event `face:updated` mới là đường cập nhật chính
  });
  useRealtimeInvalidate('face:updated', [['face-descriptors']]);

  const matcher = useMemo(
    () => (descriptorData ? buildFaceMatcher(descriptorData.customers) : null),
    [descriptorData],
  );

  const faceCheckinMutation = useMutation({
    mutationFn: (params: { customerId: string; matchScore: number }) =>
      faceCheckin(params.customerId, params.matchScore),
    onSuccess: (data) => {
      setToast({ ...data, at: Date.now() });
      setErrorToast(null);
      queryClient.invalidateQueries({ queryKey: ['staff-currently-in-gym'] });
      queryClient.invalidateQueries({ queryKey: ['staff-dashboard-overview'] });
    },
    onError: (err) => {
      setErrorToast(apiErrorMessage(err, 'Không thể check-in bằng khuôn mặt'));
      setToast(null);
    },
  });

  const qrScanMutation = useMutation({
    mutationFn: (token: string) => qrScanCheckin(token),
    onSuccess: (data) => {
      setToast({ action: data.action, customerName: data.customer.full_name, at: Date.now() });
      setErrorToast(null);
      queryClient.invalidateQueries({ queryKey: ['staff-currently-in-gym'] });
    },
    onError: (err) => setErrorToast(apiErrorMessage(err, 'Mã QR không hợp lệ hoặc đã hết hạn')),
  });

  // Toast tự tắt sau vài giây, giống popup quét QR ở StaffCheckinPage.tsx.
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), RESULT_COOLDOWN_MS);
    return () => clearTimeout(timer);
  }, [toast]);
  useEffect(() => {
    if (!errorToast) return;
    const timer = setTimeout(() => setErrorToast(null), RESULT_COOLDOWN_MS);
    return () => clearTimeout(timer);
  }, [errorToast]);

  function handleFrame(result: FaceDetectResult | null) {
    if (lockedRef.current || !matcher) return;

    if (!result) {
      streakRef.current = null;
      return;
    }

    const match = matcher.findBestMatch(result.descriptor);
    if (!match) {
      streakRef.current = null;
      return;
    }

    if (streakRef.current?.customerId === match.customerId) {
      streakRef.current.count += 1;
    } else {
      streakRef.current = { customerId: match.customerId, count: 1 };
    }

    if (streakRef.current.count >= CONSECUTIVE_MATCHES_REQUIRED) {
      streakRef.current = null;
      lockedRef.current = true;
      setTimeout(() => {
        lockedRef.current = false;
      }, RESULT_COOLDOWN_MS);
      // distance nhỏ = khớp tốt hơn — quy đổi sang điểm dễ đọc (1 - distance) cho backend lưu.
      faceCheckinMutation.mutate({ customerId: match.customerId, matchScore: Math.max(0, 1 - match.distance) });
    }
  }

  if (checkinConfig && checkinConfig.face === false) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-24">
        <WarningCircle size={40} className="text-amber-500" />
        <p className="text-sm font-semibold text-slate-600 dark:text-zinc-300">
          Check-in bằng khuôn mặt hiện đang bị tắt bởi Chủ phòng tập. Vui lòng dùng Cổng Quét QR hoặc Check-in thủ công.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <ScanSmiley className="text-emerald-600 dark:text-emerald-400" size={28} />
          Kiosk Check-in Khuôn Mặt
        </h1>
        <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
          Khách tự đứng trước camera để Check-in / Check-out. Hệ thống tự nhận diện ngay trên trình duyệt, không tải ảnh lên server.
        </p>
      </div>

      <div className="mx-auto w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        {useQrFallback ? (
          <>
            <QrCameraScanner onDecode={(text) => qrScanMutation.mutate(text)} />
            <button
              type="button"
              onClick={() => setUseQrFallback(false)}
              className="mt-3 text-xs font-semibold text-emerald-600 hover:underline"
            >
              Quay lại nhận diện khuôn mặt
            </button>
          </>
        ) : (
          <>
            <FaceCameraCapture autoStart onFrame={handleFrame} />
            <button
              type="button"
              onClick={() => setUseQrFallback(true)}
              className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-emerald-600 dark:text-zinc-400"
            >
              <Scan size={14} /> Không nhận diện được? Dùng QR thay thế
            </button>
          </>
        )}

        {!descriptorData?.customers.length && (
          <div className="mt-4">
            <Callout tone="warning">
              <span className="text-xs">Chưa có hội viên nào đăng ký Face ID tại chi nhánh này.</span>
            </Callout>
          </div>
        )}
      </div>

      {toast && (
        <div className="fixed right-4 top-20 z-[9998] w-80 rounded-2xl border border-emerald-200 bg-white p-4 shadow-2xl shadow-emerald-950/10 dark:border-emerald-900/50 dark:bg-zinc-900">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white ${
                toast.action === 'CHECKED_IN' ? 'bg-emerald-600' : 'bg-slate-500'
              }`}
            >
              {toast.action === 'CHECKED_IN' ? <SignIn size={18} weight="bold" /> : <SignOut size={18} weight="bold" />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-slate-900 dark:text-white">{toast.customerName}</p>
              <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                {toast.action === 'CHECKED_IN' ? 'Đã Check-in bằng khuôn mặt' : 'Đã Check-out bằng khuôn mặt'}
              </p>
            </div>
          </div>
        </div>
      )}

      {errorToast && (
        <div className="fixed right-4 top-20 z-[9998] w-80">
          <Callout tone="danger">
            <div className="flex items-center gap-2 text-xs">
              <WarningCircle size={16} className="shrink-0" />
              <span>{errorToast}</span>
            </div>
          </Callout>
        </div>
      )}
    </div>
  );
}
