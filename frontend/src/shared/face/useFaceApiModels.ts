import { useEffect, useState } from 'react';
import * as faceapi from '@vladmandic/face-api';

// Model weights copy trực tiếp từ node_modules/@vladmandic/face-api/model vào
// frontend/public/models/ — tự host, không dùng CDN (backend/docs/face-checkin.md §4.1).
const MODEL_URL = '/models';

// Module-level singleton: model chỉ tải 1 lần cho toàn bộ app dù bao nhiêu component gọi
// hook này (mở/đóng modal enroll nhiều lần, hoặc kiosk mount lại) — tránh tải lại ~6.8MB
// model mỗi lần mount.
let loadPromise: Promise<void> | null = null;

function loadModels(): Promise<void> {
  if (!loadPromise) {
    loadPromise = Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
      faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
    ]).then(() => undefined);
  }
  return loadPromise;
}

/** Trạng thái tải model nhận diện khuôn mặt — dùng chung cho cả luồng enroll và check-in kiosk. */
export function useFaceApiModels() {
  const [ready, setReady] = useState(
    () => faceapi.nets.tinyFaceDetector.isLoaded && faceapi.nets.faceRecognitionNet.isLoaded,
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (ready) return;
    let cancelled = false;
    loadModels()
      .then(() => {
        if (!cancelled) setReady(true);
      })
      .catch(() => {
        if (!cancelled) {
          setError('Không thể tải model nhận diện khuôn mặt. Vui lòng tải lại trang.');
          loadPromise = null; // cho phép thử lại ở lần mount kế tiếp
        }
      });
    return () => {
      cancelled = true;
    };
  }, [ready]);

  return { ready, error };
}

const DETECTOR_OPTIONS = new faceapi.TinyFaceDetectorOptions();

/** Detect 1 khuôn mặt (điểm tin cậy cao nhất nếu có nhiều mặt trong khung hình) + tính descriptor 128 số. */
export async function detectFaceDescriptor(input: HTMLVideoElement | HTMLCanvasElement | HTMLImageElement) {
  const result = await faceapi
    .detectSingleFace(input, DETECTOR_OPTIONS)
    .withFaceLandmarks()
    .withFaceDescriptor();
  if (!result) return null;
  return {
    descriptor: Array.from(result.descriptor) as number[],
    qualityScore: result.detection.score,
  };
}
