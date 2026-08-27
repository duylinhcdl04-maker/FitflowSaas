import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { RequestUser } from '../common/types/jwt-payload';
import { ROLE } from '../common/types/role';
import { CustomerService } from './customer.service';
import {
  CancelPtBookingDto,
  CreatePtBookingDto,
  CustomerChangePasswordDto,
  FaceConsentDto,
  QueryAttendanceDto,
  QueryPaymentsDto,
  UpdateCustomerProfileDto,
} from './dto/customer.dto';

// Every route here reads/writes only the caller's own Customer record — see
// doc §1 "Ranh giới": no :id params, no cross-customer access.
@Controller('customer')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(ROLE.CUSTOMER)
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  changePassword(
    @CurrentUser() user: RequestUser,
    @Body() dto: CustomerChangePasswordDto,
  ) {
    return this.customerService.changePassword(user, dto);
  }

  @Get('me/profile')
  getProfile(@CurrentUser() user: RequestUser) {
    return this.customerService.getProfile(user);
  }

  @Patch('me/profile')
  updateProfile(
    @CurrentUser() user: RequestUser,
    @Body() dto: UpdateCustomerProfileDto,
  ) {
    return this.customerService.updateProfile(user, dto);
  }

  @Post('me/face-consent')
  @HttpCode(HttpStatus.OK)
  submitFaceConsent(
    @CurrentUser() user: RequestUser,
    @Body() dto: FaceConsentDto,
    @Req() req: Request,
  ) {
    return this.customerService.submitFaceConsent(user, dto, req.ip);
  }

  @Get('me/qr-token')
  getQrToken(@CurrentUser() user: RequestUser) {
    return this.customerService.getQrToken(user);
  }

  @Get('me/membership')
  getCurrentMembership(@CurrentUser() user: RequestUser) {
    return this.customerService.getCurrentMembership(user);
  }

  @Get('me/membership/history')
  getMembershipHistory(@CurrentUser() user: RequestUser) {
    return this.customerService.getMembershipHistory(user);
  }

  @Get('me/pt-package')
  getMyPtPackage(@CurrentUser() user: RequestUser) {
    return this.customerService.getMyPtPackage(user);
  }

  @Get('me/pt/availability')
  getPtAvailability(
    @CurrentUser() user: RequestUser,
    @Query('date') date?: string,
  ) {
    return this.customerService.getPtAvailability(user, date);
  }

  @Get('me/pt/bookings')
  getMyPtBookings(@CurrentUser() user: RequestUser) {
    return this.customerService.getMyPtBookings(user);
  }

  @Post('me/pt/bookings')
  @HttpCode(HttpStatus.OK)
  createPtBooking(
    @CurrentUser() user: RequestUser,
    @Body() dto: CreatePtBookingDto,
  ) {
    return this.customerService.createPtBooking(user, dto);
  }

  @Post('me/pt/bookings/:id/cancel')
  @HttpCode(HttpStatus.OK)
  cancelPtBooking(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: CancelPtBookingDto,
  ) {
    return this.customerService.cancelPtBooking(user, id, dto);
  }

  @Get('me/attendance/calendar')
  getAttendanceCalendar(
    @CurrentUser() user: RequestUser,
    @Query('weekStart') weekStart?: string,
  ) {
    return this.customerService.getAttendanceCalendar(user, weekStart);
  }

  @Get('me/attendance/calendar/month')
  getAttendanceMonthSummary(
    @CurrentUser() user: RequestUser,
    @Query('month') month?: string,
  ) {
    return this.customerService.getAttendanceMonthSummary(user, month);
  }

  @Get('me/attendance')
  getAttendanceHistory(
    @CurrentUser() user: RequestUser,
    @Query() query: QueryAttendanceDto,
  ) {
    return this.customerService.getAttendanceHistory(user, query);
  }

  @Get('me/payments')
  getPayments(
    @CurrentUser() user: RequestUser,
    @Query() query: QueryPaymentsDto,
  ) {
    return this.customerService.getPayments(user, query);
  }

  @Get('me/payments/:id')
  getPaymentDetail(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.customerService.getPaymentDetail(user, id);
  }
}
