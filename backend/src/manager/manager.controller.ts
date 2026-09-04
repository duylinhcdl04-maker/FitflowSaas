import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Patch,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { ManagerService } from './manager.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { RequestUser } from '../common/types/jwt-payload';
import { ROLE } from '../common/types/role';
import {
  ManualCheckinDto,
  UndoCheckinDto,
  QrScanCheckinDto,
  FreezeMembershipDto,
  AddFreeDaysDto,
  PtBookingDto,
  CancelBookingDto,
  ManagerChangePasswordDto,
  QuickRegisterCustomerDto,
  QuickCreatePaymentDto,
  CreateBranchStaffDto,
  RegisterCustomerWithAccountDto,
  SellMembershipDto,
  UpdateCustomerStatusDto,
  CreateGuestVisitDto,
  ToggleGuestHoldDto,
  RejectPtPackagePlanDto,
  SellPtPackageDto,
  EnrollFaceProfileDto,
  FaceCheckinDto,
} from './dto/manager.dto';

@Controller('manager')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(ROLE.PT, ROLE.STAFF, ROLE.BRANCH_MANAGER, ROLE.OWNER)
export class ManagerController {
  constructor(private readonly managerService: ManagerService) {}

  @Get('checkin-config')
  getCheckinConfig(@CurrentUser() user: RequestUser) {
    return this.managerService.getCheckinConfig(user);
  }

  @Get('context')
  getContext(
    @CurrentUser() user: RequestUser,
    @Query('branchId') branchId?: string,
  ) {
    return this.managerService.getContext(user, branchId);
  }

  @Get('available-branches')
  getAvailableBranches(@CurrentUser() user: RequestUser) {
    return this.managerService.getAvailableBranches(user);
  }

  @Get('dashboard/overview')
  @Roles(ROLE.STAFF, ROLE.BRANCH_MANAGER, ROLE.OWNER)
  getDashboardOverview(
    @CurrentUser() user: RequestUser,
    @Query('branchId') branchId?: string,
  ) {
    return this.managerService.getDashboardOverview(user, branchId);
  }

  @Get('dashboard/performance')
  @Roles(ROLE.STAFF, ROLE.BRANCH_MANAGER, ROLE.OWNER)
  getDashboardPerformance(
    @CurrentUser() user: RequestUser,
    @Query('branchId') branchId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('groupBy') groupBy?: 'day' | 'week' | 'month',
  ) {
    return this.managerService.getDashboardPerformance(user, branchId, { from, to, groupBy });
  }

  @Get('checkin/currently-in-gym')
  getCurrentlyInGym(
    @CurrentUser() user: RequestUser,
    @Query('branchId') branchId?: string,
  ) {
    return this.managerService.getCurrentlyInGym(user, branchId);
  }

  @Post('checkin/manual')
  @HttpCode(HttpStatus.OK)
  manualCheckin(
    @CurrentUser() user: RequestUser,
    @Body() dto: ManualCheckinDto,
  ) {
    return this.managerService.manualCheckin(user, dto);
  }

  @Post('checkin/checkout/:id')
  @HttpCode(HttpStatus.OK)
  manualCheckout(
    @CurrentUser() user: RequestUser,
    @Param('id') attendanceId: string,
  ) {
    return this.managerService.manualCheckout(user, attendanceId);
  }

  @Post('checkin/qr-scan')
  @HttpCode(HttpStatus.OK)
  checkInOrOutViaQr(
    @CurrentUser() user: RequestUser,
    @Body() dto: QrScanCheckinDto,
  ) {
    return this.managerService.checkInOrOutViaQr(user, dto);
  }

  @Post('checkin/undo')
  @HttpCode(HttpStatus.OK)
  undoCheckin(
    @CurrentUser() user: RequestUser,
    @Body() dto: UndoCheckinDto,
  ) {
    return this.managerService.undoCheckin(user, dto);
  }

  // backend/docs/face-checkin.md §3 — kiosk tự nhận diện + so khớp trên trình duyệt, chỉ gửi
  // customerId + điểm khớp lên đây.
  @Get('checkin/face-descriptors')
  getFaceDescriptors(
    @CurrentUser() user: RequestUser,
    @Query('branchId') branchId?: string,
  ) {
    return this.managerService.getFaceDescriptors(user, branchId);
  }

  @Post('checkin/face')
  @HttpCode(HttpStatus.OK)
  checkInOrOutViaFace(
    @CurrentUser() user: RequestUser,
    @Body() dto: FaceCheckinDto,
  ) {
    return this.managerService.checkInOrOutViaFace(user, dto);
  }

  @Get('customers')
  getCustomers(
    @CurrentUser() user: RequestUser,
    @Query('search') search?: string,
    @Query('packageId') packageId?: string,
    @Query('status') status?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.managerService.getCustomers(user, search, packageId, status, page, limit);
  }

  @Get('packages')
  getBranchPackages(@CurrentUser() user: RequestUser) {
    return this.managerService.listBranchPackages(user);
  }

  @Post('memberships/freeze')
  @Roles(ROLE.BRANCH_MANAGER, ROLE.OWNER)
  @HttpCode(HttpStatus.OK)
  freezeMembership(
    @CurrentUser() user: RequestUser,
    @Body() dto: FreezeMembershipDto,
  ) {
    return this.managerService.freezeMembership(user, dto);
  }

  @Post('memberships/add-days')
  @Roles(ROLE.BRANCH_MANAGER, ROLE.OWNER)
  @HttpCode(HttpStatus.OK)
  addFreeDays(
    @CurrentUser() user: RequestUser,
    @Body() dto: AddFreeDaysDto,
  ) {
    return this.managerService.addFreeDays(user, dto);
  }

  @Get('pt/bookings')
  getPtBookings(@CurrentUser() user: RequestUser) {
    return this.managerService.getPtBookings(user);
  }

  @Post('pt/bookings')
  @HttpCode(HttpStatus.OK)
  createPtBooking(
    @CurrentUser() user: RequestUser,
    @Body() dto: PtBookingDto,
  ) {
    return this.managerService.createPtBooking(user, dto);
  }

  @Post('pt/cancel-booking')
  @HttpCode(HttpStatus.OK)
  cancelPtBooking(
    @CurrentUser() user: RequestUser,
    @Body() dto: CancelBookingDto,
  ) {
    return this.managerService.cancelPtBooking(user, dto);
  }

  @Get('staff')
  @Roles(ROLE.BRANCH_MANAGER, ROLE.OWNER)
  getBranchStaff(@CurrentUser() user: RequestUser) {
    return this.managerService.getBranchStaff(user);
  }

  @Get('audit-logs')
  @Roles(ROLE.BRANCH_MANAGER, ROLE.OWNER)
  getBranchAuditLogs(@CurrentUser() user: RequestUser) {
    return this.managerService.getBranchAuditLogs(user);
  }

  @Post('change-password')
  @Roles(ROLE.PT, ROLE.STAFF, ROLE.BRANCH_MANAGER, ROLE.OWNER)
  @HttpCode(HttpStatus.OK)
  changePassword(
    @CurrentUser() user: RequestUser,
    @Body() dto: ManagerChangePasswordDto,
  ) {
    return this.managerService.changePassword(user, dto);
  }

  @Post('customers/quick-register')
  @HttpCode(HttpStatus.OK)
  quickRegisterCustomer(
    @CurrentUser() user: RequestUser,
    @Body() dto: QuickRegisterCustomerDto,
  ) {
    return this.managerService.quickRegisterCustomer(user, dto);
  }

  @Post('payments/quick-create')
  @HttpCode(HttpStatus.OK)
  quickCreatePayment(
    @CurrentUser() user: RequestUser,
    @Body() dto: QuickCreatePaymentDto,
  ) {
    return this.managerService.quickCreatePayment(user, dto);
  }

  @Post('staff')
  @Roles(ROLE.BRANCH_MANAGER, ROLE.OWNER)
  @HttpCode(HttpStatus.OK)
  createBranchStaff(
    @CurrentUser() user: RequestUser,
    @Body() dto: CreateBranchStaffDto,
  ) {
    return this.managerService.createBranchStaff(user, dto);
  }

  @Post('customers/register-with-account')
  @HttpCode(HttpStatus.OK)
  registerCustomerWithAccount(
    @CurrentUser() user: RequestUser,
    @Body() dto: RegisterCustomerWithAccountDto,
  ) {
    return this.managerService.registerCustomerWithAccount(user, dto);
  }

  @Post('customers/assign-package')
  @HttpCode(HttpStatus.OK)
  assignMembershipPackage(
    @CurrentUser() user: RequestUser,
    @Body() dto: SellMembershipDto,
  ) {
    return this.managerService.assignMembershipPackage(user, dto);
  }

  @Patch('customers/:id/status')
  @Roles(ROLE.STAFF, ROLE.BRANCH_MANAGER, ROLE.OWNER)
  @HttpCode(HttpStatus.OK)
  toggleCustomerStatus(
    @CurrentUser() user: RequestUser,
    @Param('id') customerId: string,
    @Body() dto: UpdateCustomerStatusDto,
  ) {
    return this.managerService.toggleCustomerStatus(user, customerId, dto);
  }

  @Post('customers/:id/cancel-membership')
  @Roles(ROLE.BRANCH_MANAGER, ROLE.OWNER)
  @HttpCode(HttpStatus.OK)
  cancelCustomerMembership(
    @CurrentUser() user: RequestUser,
    @Param('id') customerId: string,
    @Body() dto: { membershipId?: string; reason?: string },
  ) {
    return this.managerService.cancelCustomerMembership(user, customerId, dto);
  }

  // backend/docs/face-checkin.md §2.2 — staff chụp ảnh tại quầy, descriptor tính sẵn trên
  // trình duyệt bằng @vladmandic/face-api, backend chỉ lưu (không nhận/lưu ảnh gốc).
  @Post('customers/:id/face-profile')
  @Roles(ROLE.STAFF, ROLE.BRANCH_MANAGER, ROLE.OWNER)
  @HttpCode(HttpStatus.OK)
  enrollFaceProfile(
    @CurrentUser() user: RequestUser,
    @Param('id') customerId: string,
    @Body() dto: EnrollFaceProfileDto,
    @Req() req: Request,
  ) {
    return this.managerService.enrollFaceProfile(user, customerId, dto, req.ip);
  }

  @Get('customers/:id/face-profile')
  @Roles(ROLE.STAFF, ROLE.BRANCH_MANAGER, ROLE.OWNER)
  getFaceProfileStatus(
    @CurrentUser() user: RequestUser,
    @Param('id') customerId: string,
  ) {
    return this.managerService.getFaceProfileStatus(user, customerId);
  }

  @Delete('customers/:id/face-profile')
  @Roles(ROLE.STAFF, ROLE.BRANCH_MANAGER, ROLE.OWNER)
  @HttpCode(HttpStatus.OK)
  revokeFaceProfile(
    @CurrentUser() user: RequestUser,
    @Param('id') customerId: string,
  ) {
    return this.managerService.revokeFaceProfile(user, customerId);
  }

  @Post('customers/:id/reset-password')
  @Roles(ROLE.STAFF, ROLE.BRANCH_MANAGER, ROLE.OWNER)
  @HttpCode(HttpStatus.OK)
  resetCustomerPassword(
    @CurrentUser() user: RequestUser,
    @Param('id') customerId: string,
  ) {
    return this.managerService.resetCustomerPassword(user, customerId);
  }

  @Get('guest-visits')
  getGuestVisits(
    @CurrentUser() user: RequestUser,
    @Query('status') status?: string,
  ) {
    return this.managerService.getGuestVisits(user, status);
  }

  @Post('guest-visits')
  @HttpCode(HttpStatus.OK)
  createGuestVisit(
    @CurrentUser() user: RequestUser,
    @Body() dto: CreateGuestVisitDto,
  ) {
    return this.managerService.createGuestVisit(user, dto);
  }

  @Post('guest-visits/toggle-hold')
  @HttpCode(HttpStatus.OK)
  toggleGuestHold(
    @CurrentUser() user: RequestUser,
    @Body() dto: ToggleGuestHoldDto,
  ) {
    return this.managerService.toggleGuestHold(user, dto);
  }

  @Get('pt-package-plans')
  getPtPackagePlans(
    @CurrentUser() user: RequestUser,
    @Query('status') status?: string,
  ) {
    return this.managerService.getPtPackagePlans(user, status);
  }

  @Post('pt-package-plans/:id/approve')
  @Roles(ROLE.BRANCH_MANAGER, ROLE.OWNER)
  @HttpCode(HttpStatus.OK)
  approvePtPackagePlan(
    @CurrentUser() user: RequestUser,
    @Param('id') planId: string,
  ) {
    return this.managerService.approvePtPackagePlan(user, planId);
  }

  @Post('pt-package-plans/:id/reject')
  @Roles(ROLE.BRANCH_MANAGER, ROLE.OWNER)
  @HttpCode(HttpStatus.OK)
  rejectPtPackagePlan(
    @CurrentUser() user: RequestUser,
    @Param('id') planId: string,
    @Body() dto: RejectPtPackagePlanDto,
  ) {
    return this.managerService.rejectPtPackagePlan(user, planId, dto.reason);
  }

  @Post('customers/assign-pt-package')
  @HttpCode(HttpStatus.OK)
  assignPtPackage(
    @CurrentUser() user: RequestUser,
    @Body() dto: SellPtPackageDto,
  ) {
    return this.managerService.assignPtPackage(user, dto);
  }

  @Get('payments/:id/status')
  getPaymentStatus(
    @CurrentUser() user: RequestUser,
    @Param('id') paymentId: string,
  ) {
    return this.managerService.getPaymentStatus(user, paymentId);
  }

  @Post('payments/:id/cancel')
  @HttpCode(HttpStatus.OK)
  cancelPendingPayment(
    @CurrentUser() user: RequestUser,
    @Param('id') paymentId: string,
  ) {
    return this.managerService.cancelPendingPayment(user, paymentId);
  }
}
