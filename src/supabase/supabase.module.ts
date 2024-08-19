import { Module } from '@nestjs/common';
import { DeliveryService } from './delivery.service';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [ConfigModule],
  providers: [DeliveryService, ConfigService],
  exports: [DeliveryService],
})
export class SupabaseModule {}
