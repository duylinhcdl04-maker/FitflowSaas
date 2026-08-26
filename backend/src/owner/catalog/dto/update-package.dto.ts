import { PartialType } from '@nestjs/mapped-types';
import { IsIn, IsOptional } from 'class-validator';
import { CreatePackageDto } from './create-package.dto';

export const PACKAGE_STATUSES = ['ACTIVE', 'INACTIVE'] as const;

// BR-OWN-002: Package đã có Membership đang ACTIVE là bất biến — chỉ được
// chuyển INACTIVE để ngừng bán mới, không được sửa quyền lợi/giá/thời hạn.
// OwnerCatalogService.updatePackage() tự kiểm tra và chặn khi cần.
export class UpdatePackageDto extends PartialType(CreatePackageDto) {
  @IsOptional()
  @IsIn(PACKAGE_STATUSES)
  status?: (typeof PACKAGE_STATUSES)[number];
}
