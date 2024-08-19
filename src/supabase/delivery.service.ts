import { DeliveryRepository } from '../repository/delivery.repository';
import * as xlsx from 'xlsx';
import { DeliveryItem } from 'src/entity/delivery-item.entity';
import { OrderStatus } from 'src/enum/order-status.enum';

export class DeliveryService {
  private deliveryRepository: DeliveryRepository;

  constructor() {
    this.deliveryRepository = new DeliveryRepository();
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
      } else if (existingItem.statusPedido !== item.statusPedido) {
        existingItem.statusPedido = item.statusPedido;
        updatedItems.push(existingItem);
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
