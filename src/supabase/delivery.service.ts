import { Injectable, Logger } from '@nestjs/common';
import { DeliveryRepository } from '../repository/delivery.repository';
import * as xlsx from 'xlsx';
import { DeliveryItem } from '../entity/delivery-item.entity';
import { OrderStatus } from '../enum/order-status.enum';
import { EmailService } from './email.service';
import { getStatusPedidoTitle } from 'src/utils/enum-utils';
import environmentConfig from '../config/environmentConfig';

@Injectable()
export class DeliveryService {
	private readonly logger = new Logger(DeliveryService.name);
	private deliveryRepository: DeliveryRepository;
	private emailService: EmailService;

	constructor() {
		this.deliveryRepository = new DeliveryRepository();
		this.emailService = new EmailService();
	}

	async getDeliveryById(id: string): Promise<DeliveryItem> {
		try {
			this.logger.log(`Fetching delivery with ID: ${id}`);
			const delivery = await this.deliveryRepository.findDeliveryByCodigoPedido(id);

			if (!delivery) {
				this.logger.warn(`Delivery with ID: ${id} not found`);
				throw new Error('Delivery not found');
			}

			this.logger.log(`Delivery with ID: ${id} retrieved successfully`);
			return delivery;
		} catch (error) {
			this.logger.error(`Failed to fetch delivery with ID: ${id}`, error);
			throw error;
		}
	}

	async processDeliveryFile(fileBuffer: Buffer): Promise<{ newItems: DeliveryItem[]; updatedItems: DeliveryItem[] }> {
		try {
			this.logger.log('Processing delivery file');
			const deliveryItems = this.extractDeliveryItemsFromBuffer(fileBuffer);
			const { newItems, updatedItems } = await this.checkAndUpdateDeliveryItems(deliveryItems);
			this.logger.log('Delivery file processed successfully');
			return { newItems, updatedItems };
		} catch (error) {
			this.logger.error('Failed to process delivery file', error);
			throw error;
		}
	}

	private extractDeliveryItemsFromBuffer(fileBuffer: Buffer): DeliveryItem[] {
		try {
			this.logger.log('Extracting delivery items from file buffer');
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
					deliveryItem.statusPedido = OrderStatus[reorderedItem[10] as keyof typeof OrderStatus];
					deliveryItem.descricaoTransportadora = reorderedItem[11];
					deliveryItem.dataUltimaAtualizacao = new Date();

					deliveryItems.push(deliveryItem);
				}
			});

			this.logger.log('Delivery items extracted successfully');

			if (deliveryItems.length > 3) {
				deliveryItems.splice(-3);
			}

			return deliveryItems;
		} catch (error) {
			this.logger.error('Failed to extract delivery items from buffer', error);
			throw new Error('Failed to extract delivery items');
		}
	}

	private async checkAndUpdateDeliveryItems(
		deliveryItems: DeliveryItem[],
	): Promise<{ newItems: DeliveryItem[]; updatedItems: DeliveryItem[] }> {
		const newItems: DeliveryItem[] = [];
		const updatedItems: DeliveryItem[] = [];

		for (const item of deliveryItems) {
			try {
				this.logger.log(`Checking delivery item with code: ${item.codigoPedido}`);
				const existingItem = await this.deliveryRepository.findDeliveryByCodigoPedido(item.codigoPedido);

				if (!existingItem) {
					newItems.push(item);

					// Send email for new order creation
					try {
						const emailTemplate = this.emailService.getEmailTemplate('order-created');
						const emailText = emailTemplate
							.replace('{nomeCliente}', item.descricaoCliente)
							.replace('{link}', `${environmentConfig.FRONT_END_URL}order/${item.codigoPedido}`);
						await this.emailService.sendEmail(item.emailCliente, 'Seu pedido foi criado!', emailText);
						this.logger.log(`New order email sent to ${item.emailCliente} for order code: ${item.codigoPedido}`);
					} catch (error) {
						this.logger.error(
							`Failed to send new order email to ${item.emailCliente} for order code: ${item.codigoPedido}`,
							error,
						);
					}
				} else if (existingItem.statusPedido !== item.statusPedido) {
					existingItem.statusPedido = item.statusPedido;
					existingItem.dataUltimaAtualizacao = new Date();
					updatedItems.push(existingItem);

					// Send email for order status update
					try {
						const emailTemplate = this.emailService.getEmailTemplate('order-status-update');
						const emailText = emailTemplate
							.replace('{nomeCliente}', existingItem.descricaoCliente)
							.replace('{status}', getStatusPedidoTitle(existingItem.statusPedido))
							.replace('{link}', `${environmentConfig.FRONT_END_URL}order/${existingItem.codigoPedido}`);
						await this.emailService.sendEmail(existingItem.emailCliente, 'O status do seu pedido mudou!', emailText);
						this.logger.log(
							`Order status update email sent to ${existingItem.emailCliente} for order code: ${existingItem.codigoPedido}`,
						);
					} catch (error) {
						this.logger.error(
							`Failed to send order status update email to ${existingItem.emailCliente} for order code: ${existingItem.codigoPedido}`,
							error,
						);
					}
				}
			} catch (error) {
				this.logger.error(`Error processing delivery item with code: ${item.codigoPedido}`, error);
			}
		}

		return { newItems, updatedItems };
	}

	async saveNewItems(newItems: DeliveryItem[]): Promise<void> {
		try {
			this.logger.log('Saving new delivery items');
			await this.deliveryRepository.saveNewItems(newItems);
			this.logger.log('New delivery items saved successfully');
		} catch (error) {
			this.logger.error('Failed to save new delivery items', error);
			throw error;
		}
	}

	async updateItems(updatedItems: DeliveryItem[]): Promise<void> {
		try {
			this.logger.log('Updating existing delivery items');
			await this.deliveryRepository.updateItems(updatedItems);
			this.logger.log('Existing delivery items updated successfully');
		} catch (error) {
			this.logger.error('Failed to update existing delivery items', error);
			throw error;
		}
	}
}
