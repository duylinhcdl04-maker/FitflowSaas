import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Query,
  Param,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ROLE } from '../common/types/role';
import { PtService } from './pt.service';
import {
  ConfirmBookingDto,
  RejectBookingDto,
  CompleteSessionDto,
  CreateWorkoutLogDto,
  CreatePtPackagePlanDto,
  UpdatePtProfileDto,
  UpdateWorkingHoursDto,
  CreatePtBookingByPtDto,
  MarkNoShowDto,
} from './dto/pt.dto';

@Controller('pt')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(ROLE.PT, ROLE.BRANCH_MANAGER, ROLE.OWNER)
export class PtController {
  constructor(private readonly ptService: PtService) {}

  @Get('dashboard/overview')
  getDashboardOverview(@CurrentUser() user: any) {
    return this.ptService.getDashboardOverview(user);
  }

  @Get('schedule')
  getSchedule(
    @CurrentUser() user: any,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.ptService.getSchedule(user, startDate, endDate);
  }

  @Post('bookings')
  createBookingForCustomer(
    @CurrentUser() user: any,
    @Body() dto: CreatePtBookingByPtDto,
  ) {
    return this.ptService.createBookingForCustomer(user, dto);
  }

  @Post('bookings/confirm')
  confirmBooking(@CurrentUser() user: any, @Body() dto: ConfirmBookingDto) {
    return this.ptService.confirmBooking(user, dto);
  }

  @Post('bookings/reject')
  rejectBooking(@CurrentUser() user: any, @Body() dto: RejectBookingDto) {
    return this.ptService.rejectBooking(user, dto);
  }

  @Post('bookings/no-show')
  markNoShow(@CurrentUser() user: any, @Body() dto: MarkNoShowDto) {
    return this.ptService.markNoShow(user, dto);
  }

  @Post('sessions/complete')
  completeSession(@CurrentUser() user: any, @Body() dto: CompleteSessionDto) {
    return this.ptService.completeSession(user, dto);
  }

  @Get('clients')
  getMyClients(@CurrentUser() user: any, @Query('search') search?: string) {
    return this.ptService.getMyClients(user, search);
  }

  @Get('clients/:id')
  getClientDetail(@CurrentUser() user: any, @Param('id') customerId: string) {
    return this.ptService.getClientDetail(user, customerId);
  }

  @Post('workout-logs')
  createWorkoutLog(@CurrentUser() user: any, @Body() dto: CreateWorkoutLogDto) {
    return this.ptService.createWorkoutLog(user, dto);
  }

  @Get('packages')
  getMyPtPackages(@CurrentUser() user: any) {
    return this.ptService.getMyPtPackages(user);
  }

  @Post('packages')
  createPtPackagePlan(@CurrentUser() user: any, @Body() dto: CreatePtPackagePlanDto) {
    return this.ptService.createPtPackagePlan(user, dto);
  }

  @Get('availability')
  getWorkingHours(@CurrentUser() user: any) {
    return this.ptService.getWorkingHours(user);
  }

  @Post('availability')
  updateWorkingHours(@CurrentUser() user: any, @Body() dto: UpdateWorkingHoursDto) {
    return this.ptService.updateWorkingHours(user, dto);
  }

  @Get('profile')
  getProfile(@CurrentUser() user: any) {
    return this.ptService.getProfile(user);
  }

  @Patch('profile')
  updateProfile(@CurrentUser() user: any, @Body() dto: UpdatePtProfileDto) {
    return this.ptService.updateProfile(user, dto);
  }
}
