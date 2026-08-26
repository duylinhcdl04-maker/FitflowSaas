import { Module } from '@nestjs/common';
import { OwnerCustomersController } from './owner-customers.controller';
import { OwnerCustomersService } from './owner-customers.service';

@Module({
  controllers: [OwnerCustomersController],
  providers: [OwnerCustomersService],
})
export class OwnerCustomersModule {}
