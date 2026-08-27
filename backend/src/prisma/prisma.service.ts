import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../generated/prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    const adapter = new PrismaPg({
      connectionString: process.env.DATABASE_URL,
    });
    super({ adapter });
  }

  async onModuleInit() {
    await this.$connect();
    try {
      await this.$executeRawUnsafe(`
        ALTER TABLE pt_bookings DROP CONSTRAINT IF EXISTS pt_bookings_status_check;
        ALTER TABLE pt_bookings ADD CONSTRAINT pt_bookings_status_check CHECK (status IN ('PENDING', 'SCHEDULED', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'REJECTED', 'NO_SHOW'));
      `);
    } catch (err) {
      console.error('Error updating pt_bookings_status_check constraint:', err);
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
