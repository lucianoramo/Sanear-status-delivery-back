import { Module } from '@nestjs/common';
import { SupabaseModule } from './supabase/supabase.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DeliveryController } from './route/api/delivery/delivery.controller';

@Module({
  imports: [SupabaseModule, ConfigModule.forRoot()],
  controllers: [DeliveryController],
  providers: [ConfigService],
})
export class AppModule {}
