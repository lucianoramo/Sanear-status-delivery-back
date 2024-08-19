import {
  Controller,
  Get,
  NotFoundException,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { DeliveryService } from 'src/supabase/delivery.service';
@Controller()
export class DeliveryController {
  private deliveryService: DeliveryService;

  constructor() {
    this.deliveryService = new DeliveryService();
  }

  @Post('upload-file')
  @UseInterceptors(FileInterceptor('deliveryFile'))
  async uploadFile(
    @UploadedFile()
    deliveryFile,
  ): Promise<any> {
    const fileBuffer = deliveryFile.buffer;
    const { newItems, updatedItems } =
      await this.deliveryService.processDeliveryFile(fileBuffer);

    // Salvar novos itens e atualizar itens existentes
    await this.deliveryService.saveNewItems(newItems);
    await this.deliveryService.updateItems(updatedItems);

    return { newItems, updatedItems };
  }

  @Get()
  async getDelivery(@Query('id') id: string) {
    try {
      const delivery = await this.deliveryService.getDeliveryById(id);
      return delivery;
    } catch (error) {
      throw new NotFoundException(error.message);
    }
  }
}
