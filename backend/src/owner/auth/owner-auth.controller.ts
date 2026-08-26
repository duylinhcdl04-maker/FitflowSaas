import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { OwnerAuthService } from './owner-auth.service';
import { RegisterDto } from './dto/register.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { ResendOtpDto } from './dto/resend-otp.dto';
import { ResendOtpByEmailDto } from './dto/resend-otp-by-email.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { RequestUser } from '../../common/types/jwt-payload';
import { ROLE } from '../../common/types/role';

@Controller('owner/auth')
export class OwnerAuthController {
  constructor(private readonly ownerAuthService: OwnerAuthService) {}

  // Bước 1 của đăng nhập kiểu KiotViet: "nhập tên cửa hàng" trước khi vào
  // form mật khẩu — mô phỏng bằng route nội bộ vì chưa có subdomain thật
  // (xem UI_Owner.md, ghi chú "mô hình sau này khi thêm domain cụ thể").
  @Get('tenants/:slug')
  lookupTenant(@Param('slug') slug: string) {
    return this.ownerAuthService.lookupTenant(slug);
  }

  @Post('register')
  @HttpCode(HttpStatus.OK)
  register(@Body() dto: RegisterDto) {
    return this.ownerAuthService.register(dto);
  }

  @Post('resend-otp')
  @HttpCode(HttpStatus.OK)
  resend(@Body() dto: ResendOtpDto) {
    return this.ownerAuthService.resend(dto);
  }

  // OW-01b. Khôi phục tài khoản PENDING đã mất userId (đóng tab giữa chừng
  // đăng ký, không xác thực OTP) — tra theo email thay vì userId.
  @Post('resend-otp-by-email')
  @HttpCode(HttpStatus.OK)
  resendByEmail(@Body() dto: ResendOtpByEmailDto) {
    return this.ownerAuthService.resendByEmail(dto);
  }

  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  verify(@Body() dto: VerifyOtpDto) {
    return this.ownerAuthService.verify(dto);
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.ownerAuthService.forgotPassword(dto);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.ownerAuthService.resetPassword(dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ROLE.OWNER)
  @Post('change-password/request-otp')
  @HttpCode(HttpStatus.OK)
  requestChangePasswordOtp(@CurrentUser() user: RequestUser) {
    return this.ownerAuthService.requestChangePasswordOtp(user.id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ROLE.OWNER)
  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  changePasswordWithOtp(
    @CurrentUser() user: RequestUser,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.ownerAuthService.changePasswordWithOtp(user.id, dto);
  }
}
