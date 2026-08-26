import { apiClient } from './client';

export const DURATION_UNITS = [
  { code: 'DAY', label: 'Ngày' },
  { code: 'WEEK', label: 'Tuần' },
  { code: 'MONTH', label: 'Tháng' },
  { code: 'QUARTER', label: 'Quý' },
  { code: 'YEAR', label: 'Năm' },
] as const;

export const PACKAGE_STATUSES = ['ACTIVE', 'INACTIVE'] as const;

export interface ServiceSummary {
  id: string;
  code: string;
  name: string;
  description: string | null;
  status: string;
}

export interface PackageSummary {
  id: string;
  code: string;
  name: string;
  description: string | null;
  duration_value: number;
  duration_unit: string;
  branch_access_scope: string;
  base_price: number;
  status: string;
  _count?: { memberships: number };
  // Phạm vi BÁN gói (package_branches) — khác branch_access_scope (phạm vi
  // SỬ DỤNG sau khi mua). appliesToAllBranches=true nghĩa là chưa gán riêng
  // chi nhánh nào → mặc định bán ở mọi chi nhánh.
  appliesToAllBranches: boolean;
  branches: { id: string; name: string }[];
}

export interface CreateServiceInput {
  name: string;
  description?: string;
}

export interface CreatePackageInput {
  name: string;
  description?: string;
  durationValue: number;
  durationUnit: (typeof DURATION_UNITS)[number]['code'];
  basePrice: number;
  freezeAllowedDays?: number;
  maxCheckinsPerDay?: number;
  branchIds?: string[];
}

export interface UpdatePackageInput {
  name?: string;
  description?: string;
  durationValue?: number;
  durationUnit?: (typeof DURATION_UNITS)[number]['code'];
  basePrice?: number;
  status?: (typeof PACKAGE_STATUSES)[number];
  branchIds?: string[];
}

export function listServices() {
  return apiClient.get<ServiceSummary[]>('/owner/catalog/services').then((res) => res.data);
}

export function createService(input: CreateServiceInput) {
  return apiClient.post<ServiceSummary>('/owner/catalog/services', input).then((res) => res.data);
}

export function listPackages() {
  return apiClient.get<PackageSummary[]>('/owner/catalog/packages').then((res) => res.data);
}

export function createPackage(input: CreatePackageInput) {
  return apiClient.post<PackageSummary>('/owner/catalog/packages', input).then((res) => res.data);
}

export function updatePackage(id: string, input: UpdatePackageInput) {
  return apiClient.patch<PackageSummary>(`/owner/catalog/packages/${id}`, input).then((res) => res.data);
}
