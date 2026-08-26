import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsArray,
  ValidateNested,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ConfirmBookingDto {
  @IsString()
  @IsNotEmpty()
  bookingId!: string;
}

export class RejectBookingDto {
  @IsString()
  @IsNotEmpty()
  bookingId!: string;

  @IsString()
  @IsOptional()
  reason?: string;
}

export class CompleteSessionDto {
  @IsString()
  @IsNotEmpty()
  bookingId!: string;

  @IsString()
  @IsOptional()
  sessionNote?: string;
}

export class CreateWorkoutLogDto {
  @IsString()
  @IsNotEmpty()
  customerPtPackageId!: string;

  @IsString()
  @IsOptional()
  bookingId?: string;

  @IsNumber()
  @IsOptional()
  sessionNumber?: number;

  @IsString()
  @IsNotEmpty()
  workoutContent!: string;

  @IsString()
  @IsOptional()
  mainExercises?: string;

  @IsString()
  @IsOptional()
  progressAssessment?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class CreatePtPackagePlanDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @Min(1)
  sessionCount!: number;

  @IsNumber()
  @Min(0)
  price!: number;

  @IsNumber()
  @IsOptional()
  validityDays?: number;

  @IsNumber()
  @IsOptional()
  sessionDurationMinutes?: number;
}

export class UpdatePtProfileDto {
  @IsString()
  @IsOptional()
  bio?: string;

  @IsArray()
  @IsOptional()
  specialties?: string[];

  @IsNumber()
  @IsOptional()
  experienceYears?: number;

  @IsString()
  @IsOptional()
  trainingStyle?: string;
}

export class WorkingHourItemDto {
  @IsNumber()
  weekday!: number; // 1 (Mon) - 7 (Sun)

  @IsString()
  startTime!: string; // e.g. "08:00"

  @IsString()
  endTime!: string; // e.g. "12:00"
}

export class UpdateWorkingHoursDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkingHourItemDto)
  hours!: WorkingHourItemDto[];
}
