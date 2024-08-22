import {
  Controller,
  Get,
  NotFoundException,
  Post,
  Req,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { DeliveryService } from '../../../supabase/delivery.service';
import { FastifyRequest } from 'fastify';
@Controller()
export class DeliveryController {
  private deliveryService: DeliveryService;

  constructor() {
    this.deliveryService = new DeliveryService();
  }
  @Post('upload-file')
  @UseInterceptors(FileInterceptor('deliveryFile'))
  async uploadFile(@Req() request: FastifyRequest): Promise<any> {
    // Handle multipart file upload with Fastify
    const files = await request.saveRequestFiles();
    const deliveryFile = files.find(
      (file) => file.fieldname === 'deliveryFile',
    );

    if (!deliveryFile) {
      throw new NotFoundException('File not found');
    }

    const fileBuffer = await deliveryFile.toBuffer(); // Get the buffer of the uploaded file
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
