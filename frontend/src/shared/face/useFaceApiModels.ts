import { useEffect, useState } from 'react';
import * as faceapi from '@vladmandic/face-api';

const LOCAL_MODEL_URL = '/models';
const CDN_MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model';

// Module-level singleton: model chỉ tải 1 lần cho toàn bộ app dù bao nhiêu component gọi
// hook này (mở/đóng modal enroll nhiều lần, hoặc kiosk mount lại) — tránh tải lại ~6.8MB
// model mỗi lần mount.
let loadPromise: Promise<void> | null = null;

async function fetchAndLoad(url: string): Promise<void> {
  await Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri(url),
    faceapi.nets.faceLandmark68Net.loadFromUri(url),
    faceapi.nets.faceRecognitionNet.loadFromUri(url),
  ]);
}

function loadModels(): Promise<void> {
  if (!loadPromise) {
    loadPromise = (async () => {
      try {
        await fetchAndLoad(LOCAL_MODEL_URL);
      } catch (err) {
        console.warn('FitFlow Face-API: Không tải được model cục bộ, đang tự động fallback sang CDN...', err);
        await fetchAndLoad(CDN_MODEL_URL);
      }
    })();
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
