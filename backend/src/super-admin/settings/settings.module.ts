import { Module } from '@nestjs/common';
import { SettingsController } from './settings.controller';
import { SettingsService } from './settings.service';
import { CloudinaryModule } from '../../common/cloudinary/cloudinary.module';

@Module({
  imports: [CloudinaryModule],
  controllers: [SettingsController],
  providers: [SettingsService],
})
export class SettingsModule {}
