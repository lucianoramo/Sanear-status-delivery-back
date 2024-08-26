import {
  Controller,
  Get,
  NotFoundException,
  Post,
  Req,
  Query,
} from '@nestjs/common';
import { DeliveryService } from '../../../supabase/delivery.service';
import { FastifyRequest } from 'fastify';
@Controller()
export class DeliveryController {
  //private deliveryService: DeliveryService;

  constructor(private readonly deliveryService: DeliveryService) {}
  @Post('upload-file')
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

    if (newItems.length > 0) {
      await this.deliveryService.saveNewItems(newItems);
    }

    if (updatedItems.length > 0) {
      await this.deliveryService.updateItems(updatedItems);
    }

    return { newItems, updatedItems };
  }

  @Get('order')
  async getDelivery(@Query('id') id: string) {
    try {
      const delivery = await this.deliveryService.getDeliveryById(id);
      return delivery;
    } catch (error) {
      throw new NotFoundException(error.message);
    }
  }

  @Get('/')
  healthCheck(): string {
    return 'OK';
  }
}
