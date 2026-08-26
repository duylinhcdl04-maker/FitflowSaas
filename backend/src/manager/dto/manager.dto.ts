import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class ManualCheckinDto {
  @IsString({ message: 'Customer ID không hợp lệ' })
  @IsNotEmpty({ message: 'Vui lòng chọn khách hàng' })
  customerId!: string;

  @IsOptional()
  @IsString()
  membershipId?: string;

  @IsOptional()
  @IsString()
  note?: string;
}

export class UndoCheckinDto {
  @IsString({ message: 'Attendance ID không hợp lệ' })
  @IsNotEmpty({ message: 'Vui lòng chọn lượt check-in' })
  attendanceId!: string;

  @IsString({ message: 'Lý do không hợp lệ' })
  @IsNotEmpty({ message: 'Vui lòng nhập lý do hoàn tác' })
  reason!: string;
}

export class SellMembershipDto {
  @IsString({ message: 'Customer ID không hợp lệ' })
  @IsNotEmpty({ message: 'Vui lòng chọn khách hàng' })
  customerId!: string;

  @IsString({ message: 'Package ID không hợp lệ' })
  @IsNotEmpty({ message: 'Vui lòng chọn gói tập' })
  packageId!: string;

  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  paymentMethod?: string;
}

export class ConfirmPaymentDto {
  @IsString({ message: 'Payment ID không hợp lệ' })
  @IsNotEmpty({ message: 'Mã thanh toán không được để trống' })
  paymentId!: string;
}

export class FreezeMembershipDto {
  @IsString({ message: 'Membership ID không hợp lệ' })
  @IsNotEmpty({ message: 'Mã gói tập không được để trống' })
  membershipId!: string;

  @IsString({ message: 'Ngày bắt đầu không hợp lệ' })
  @IsNotEmpty({ message: 'Vui lòng chọn ngày bắt đầu tạm ngưng' })
  startDate!: string;

  @IsString({ message: 'Ngày kết thúc không hợp lệ' })
  @IsNotEmpty({ message: 'Vui lòng chọn ngày kết thúc tạm ngưng' })
  endDate!: string;

  @IsOptional()
  @IsString()
  reason?: string;
}

export class AddFreeDaysDto {
  @IsString({ message: 'Membership ID không hợp lệ' })
  @IsNotEmpty({ message: 'Mã gói tập không được để trống' })
  membershipId!: string;

  @IsNotEmpty({ message: 'Vui lòng nhập số ngày cộng thêm' })
  days!: number;

  @IsString({ message: 'Lý do không hợp lệ' })
  @IsNotEmpty({ message: 'Vui lòng nhập lý do cộng ngày tập' })
  reason!: string;
}

export class CancelMembershipDto {
  @IsString({ message: 'Membership ID không hợp lệ' })
  @IsNotEmpty({ message: 'Mã gói tập không được để trống' })
  membershipId!: string;

  @IsString({ message: 'Lý do không hợp lệ' })
  @IsNotEmpty({ message: 'Vui lòng nhập lý do hủy' })
  reason!: string;
}

export class PtBookingDto {
  @IsString({ message: 'PT User ID không hợp lệ' })
  @IsNotEmpty({ message: 'Vui lòng chọn PT' })
  ptUserId!: string;

  @IsString({ message: 'Customer ID không hợp lệ' })
  @IsNotEmpty({ message: 'Vui lòng chọn khách hàng' })
  customerId!: string;

  @IsString({ message: 'Customer PT Package ID không hợp lệ' })
  @IsNotEmpty({ message: 'Vui lòng chọn gói PT của khách hàng' })
  customerPtPackageId!: string;

  @IsString({ message: 'Thời gian bắt đầu không hợp lệ' })
  @IsNotEmpty({ message: 'Vui lòng chọn thời gian bắt đầu' })
  scheduledStart!: string;

  @IsString({ message: 'Thời gian kết thúc không hợp lệ' })
  @IsNotEmpty({ message: 'Vui lòng chọn thời gian kết thúc' })
  scheduledEnd!: string;

  @IsOptional()
  @IsString()
  sessionNote?: string;
}

export class CancelBookingDto {
  @IsString({ message: 'Booking ID không hợp lệ' })
  @IsNotEmpty({ message: 'Mã lịch đặt không được để trống' })
  bookingId!: string;

  @IsString({ message: 'Lý do không hợp lệ' })
  @IsNotEmpty({ message: 'Vui lòng nhập lý do hủy lịch' })
  reason!: string;
}

export class ManagerChangePasswordDto {
  @IsString({ message: 'Mật khẩu hiện tại không hợp lệ' })
  @IsNotEmpty({ message: 'Vui lòng nhập mật khẩu hiện tại' })
  currentPassword!: string;

  @IsString({ message: 'Mật khẩu mới không hợp lệ' })
  @IsNotEmpty({ message: 'Vui lòng nhập mật khẩu mới' })
  newPassword!: string;
}

export class QuickRegisterCustomerDto {
  @IsString({ message: 'Họ tên không hợp lệ' })
  @IsNotEmpty({ message: 'Vui lòng nhập họ và tên' })
  fullName!: string;

  @IsString({ message: 'Số điện thoại không hợp lệ' })
  @IsNotEmpty({ message: 'Vui lòng nhập số điện thoại' })
  phone!: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  gender?: string;
}

export class QuickCreatePaymentDto {
  @IsString({ message: 'Customer ID không hợp lệ' })
  @IsNotEmpty({ message: 'Vui lòng chọn khách hàng' })
  customerId!: string;

  @IsString({ message: 'Nội dung thanh toán không hợp lệ' })
  @IsNotEmpty({ message: 'Vui lòng nhập nội dung thanh toán' })
  title!: string;

  @IsNotEmpty({ message: 'Vui lòng nhập số tiền' })
  amount!: number;

  @IsOptional()
  @IsString()
  paymentMethod?: string;
}

export class CreateBranchStaffDto {
  @IsString({ message: 'Họ tên không hợp lệ' })
  @IsNotEmpty({ message: 'Vui lòng nhập họ và tên' })
  fullName!: string;

  @IsString({ message: 'Email không hợp lệ' })
  @IsNotEmpty({ message: 'Vui lòng nhập email làm tên đăng nhập cho nhân viên' })
  email!: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  gender?: string;

  @IsString({ message: 'Vai trò không hợp lệ' })
  @IsNotEmpty({ message: 'Vui lòng chọn vai trò' })
  role!: 'RECEPTIONIST' | 'STAFF' | 'PT';
}

export class RegisterCustomerWithAccountDto {
  @IsString({ message: 'Họ tên không hợp lệ' })
  @IsNotEmpty({ message: 'Vui lòng nhập họ và tên' })
  fullName!: string;

  @IsString({ message: 'Email không hợp lệ' })
  @IsNotEmpty({ message: 'Vui lòng nhập email làm tên đăng nhập cho khách hàng' })
  email!: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  gender?: string;

  @IsString({ message: 'Mật khẩu mặc định không hợp lệ' })
  @IsNotEmpty({ message: 'Vui lòng cung cấp mật khẩu mặc định' })
  defaultPassword!: string;
}

export class UpdateCustomerStatusDto {
  @IsString({ message: 'Trạng thái không hợp lệ' })
  @IsNotEmpty({ message: 'Trạng thái không được để trống' })
  status!: 'ACTIVE' | 'INACTIVE';
}

export class CreateGuestVisitDto {
  @IsString({ message: 'Họ tên không hợp lệ' })
  @IsNotEmpty({ message: 'Vui lòng nhập họ và tên khách vãng lai' })
  fullName!: string;

  @IsString({ message: 'Số điện thoại không hợp lệ' })
  @IsNotEmpty({ message: 'Vui lòng nhập số điện thoại' })
  phone!: string;

  @IsString({ message: 'Package ID không hợp lệ' })
  @IsNotEmpty({ message: 'Vui lòng chọn gói vé lượt' })
  packageId!: string;

  @IsOptional()
  @IsString()
  paymentMethod?: string;
}

export class ToggleGuestHoldDto {
  @IsString({ message: 'Guest Visit ID không hợp lệ' })
  @IsNotEmpty({ message: 'Vui lòng chọn vé lượt' })
  guestVisitId!: string;

  @IsOptional()
  @IsString()
  reason?: string;
}

export class RejectPtPackagePlanDto {
  @IsOptional()
  @IsString()
  reason?: string;
}

export class SellPtPackageDto {
  @IsString({ message: 'Hội viên không hợp lệ' })
  @IsNotEmpty({ message: 'Vui lòng chọn hội viên' })
  customerId!: string;

  @IsString({ message: 'Gói PT không hợp lệ' })
  @IsNotEmpty({ message: 'Vui lòng chọn gói PT' })
  planId!: string;

  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  paymentMethod?: string;
}

