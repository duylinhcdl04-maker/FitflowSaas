import { Module } from '@nestjs/common';
import { OwnerCatalogController } from './owner-catalog.controller';
import { OwnerCatalogService } from './owner-catalog.service';

@Module({
  controllers: [OwnerCatalogController],
  providers: [OwnerCatalogService],
})
export class OwnerCatalogModule {}
