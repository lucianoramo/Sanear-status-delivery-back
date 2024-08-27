import { DeliveryRepository } from '../repository/delivery.repository';
import * as xlsx from 'xlsx';
import { DeliveryItem } from '../entity/delivery-item.entity';
import { OrderStatus } from '../enum/order-status.enum';
import { EmailService } from './email.service';
import { getStatusPedidoTitle } from 'src/utils/enum-utils';

export class DeliveryService {
  private deliveryRepository: DeliveryRepository;
  private emailService: EmailService;

  constructor() {
    this.deliveryRepository = new DeliveryRepository();
    this.emailService = new EmailService();
  }

  async getDeliveryById(id: string) {
    const delivery = await this.deliveryRepository.findDeliveryById(id);

    if (!delivery) {
      throw new Error('Delivery not found');
    }

    return delivery;
  }

  async processDeliveryFile(
    fileBuffer: Buffer,
  ): Promise<{ newItems: DeliveryItem[]; updatedItems: DeliveryItem[] }> {
    const deliveryItems = this.extractDeliveryItemsFromBuffer(fileBuffer);
    const { newItems, updatedItems } = await this.checkAndUpdateDeliveryItems(
      deliveryItems,
    );
    return { newItems, updatedItems };
  }

  private extractDeliveryItemsFromBuffer(fileBuffer: Buffer): DeliveryItem[] {
    const workbook = xlsx.read(fileBuffer, { type: 'buffer' });

    const worksheet = workbook.Sheets[workbook.SheetNames[0]];

    const jsonData = xlsx.utils.sheet_to_json(worksheet, { header: 1 });
    console.log(
      `DeliveryService => extractDeliveryItemsFromBuffer => jsonData:`,
      jsonData,
    );

    const validData = jsonData.slice(6, jsonData.length - 2);
    const seenCodes = new Set<string>();
    const deliveryItems: DeliveryItem[] = [];

    validData.forEach((item: any) => {
      const reorderedItem = item
        .filter((_, index) => index < item.length)
        .map((value: any, index: number) => {
          const isDateField = index === 0 || index === 7;
          if (isDateField && typeof value === 'number') {
            const date = xlsx.SSF.parse_date_code(value);
            const day = String(date.d).padStart(2, '0');
            const month = String(date.m).padStart(2, '0');
            const year = date.y;
            return `${month}/${day}/${year}`;
          }
          return String(value).trim();
        });

      const codigoPedido = reorderedItem[1];
      if (!seenCodes.has(codigoPedido)) {
        seenCodes.add(codigoPedido);

        const deliveryItem = new DeliveryItem();
        deliveryItem.dataPedido = reorderedItem[0];
        deliveryItem.codigoPedido = reorderedItem[1];
        deliveryItem.codigoCliente = reorderedItem[2];
        deliveryItem.descricaoCliente = reorderedItem[3];
        deliveryItem.emailCliente = reorderedItem[4];
        deliveryItem.telefoneCliente = reorderedItem[5];
        deliveryItem.descricaoVendedor = reorderedItem[6];
        deliveryItem.dataEntrega = reorderedItem[7];
        deliveryItem.cidadeCliente = reorderedItem[8];
        deliveryItem.estadoCliente = reorderedItem[9];
        deliveryItem.statusPedido =
          OrderStatus[reorderedItem[10] as keyof typeof OrderStatus];
        deliveryItem.descricaoTransportadora = reorderedItem[11];
        deliveryItem.dataUltimaAtualizacao = new Date();

        deliveryItems.push(deliveryItem);
      }
    });

    return deliveryItems;
  }

  private async checkAndUpdateDeliveryItems(
    deliveryItems: DeliveryItem[],
  ): Promise<{ newItems: DeliveryItem[]; updatedItems: DeliveryItem[] }> {
    const newItems: DeliveryItem[] = [];
    const updatedItems: DeliveryItem[] = [];

    for (const item of deliveryItems) {
      const existingItem =
        await this.deliveryRepository.findDeliveryByCodigoPedido(
          item.codigoPedido,
        );

      if (!existingItem) {
        newItems.push(item);

        // Enviar e-mail de criação de pedido
        const emailTemplate =
          this.emailService.getEmailTemplate('order-created');
        const emailText = emailTemplate
          .replace('{nomeCliente}', item.descricaoCliente)
          .replace(
            '{link}',
            `https://fkcwv6kvm4.us-west-2.awsapprunner.com/order?id=${item.codigoPedido}`,
          );

        await this.emailService.sendEmail(
          item.emailCliente,
          'Seu pedido foi criado!',
          emailText,
        );
      } else if (existingItem.statusPedido !== item.statusPedido) {
        existingItem.statusPedido = item.statusPedido;
        existingItem.dataUltimaAtualizacao = new Date();
        updatedItems.push(existingItem);

        // Enviar e-mail de atualização de status
        const emailTemplate = this.emailService.getEmailTemplate(
          'order-status-update',
        );
        const emailText = emailTemplate
          .replace('{nomeCliente}', existingItem.descricaoCliente)
          .replace('{status}', getStatusPedidoTitle(existingItem.statusPedido))
          .replace(
            '{link}',
            `
https://fkcwv6kvm4.us-west-2.awsapprunner.com/order?id=${existingItem.codigoPedido}`,
          );

        await this.emailService.sendEmail(
          existingItem.emailCliente,
          'O status do seu pedido mudou!',
          emailText,
        );
      }
    }

    return { newItems, updatedItems };
  }

  async saveNewItems(newItems: DeliveryItem[]): Promise<void> {
    await this.deliveryRepository.saveNewItems(newItems);
  }

  async updateItems(updatedItems: DeliveryItem[]): Promise<void> {
    await this.deliveryRepository.updateItems(updatedItems);
  }
}
