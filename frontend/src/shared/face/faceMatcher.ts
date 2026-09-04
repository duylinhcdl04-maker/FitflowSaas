import * as faceapi from '@vladmandic/face-api';

// Ngưỡng chặt hơn mặc định của thư viện (0.6) — đây là kiểm soát ra/vào, ưu tiên giảm
// false-accept hơn false-reject (backend/docs/face-checkin.md §3.2).
const MATCH_THRESHOLD = 0.5;
const UNKNOWN_LABEL = 'unknown';

export interface LabeledFaceInput {
  customerId: string;
  fullName: string;
  descriptors: number[][];
}

export interface FaceMatchResult {
  customerId: string;
  fullName: string;
  distance: number;
}

/** Rebuild mỗi khi danh sách descriptor của chi nhánh thay đổi (enroll mới / socket `face:updated`). */
export function buildFaceMatcher(customers: LabeledFaceInput[]) {
  const nameById = new Map(customers.map((c) => [c.customerId, c.fullName]));
  const labeledDescriptors = customers
    .filter((c) => c.descriptors.length > 0)
    .map(
      (c) =>
        new faceapi.LabeledFaceDescriptors(
          c.customerId,
          c.descriptors.map((d) => new Float32Array(d)),
        ),
    );

  if (labeledDescriptors.length === 0) return null;

  const matcher = new faceapi.FaceMatcher(labeledDescriptors, MATCH_THRESHOLD);

  return {
    findBestMatch(descriptor: number[]): FaceMatchResult | null {
      const best = matcher.findBestMatch(new Float32Array(descriptor));
      if (best.label === UNKNOWN_LABEL) return null;
      return {
        customerId: best.label,
        fullName: nameById.get(best.label) ?? best.label,
        distance: best.distance,
      };
    },
  };
}
