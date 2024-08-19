import { Module } from '@nestjs/common';
import { DeliveryController } from './delivery.controller';
import { SupabaseModule } from 'src/supabase/supabase.module';

@Module({
  controllers: [DeliveryController],
  providers: [],
  exports: [],
  imports: [SupabaseModule],
})
export class DeliveryModule {}
