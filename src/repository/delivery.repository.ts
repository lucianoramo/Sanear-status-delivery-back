import { Injectable, Logger } from '@nestjs/common';
import { supabase } from '../config/supabaseClient';
import { DeliveryItem } from '../entity/delivery-item.entity';

@Injectable()
export class DeliveryRepository {
	private readonly logger = new Logger(DeliveryRepository.name);

	async findDeliveryById(id: string): Promise<DeliveryItem | null> {
		try {
			this.logger.log(`Fetching delivery with ID: ${id}`);
			const { data, error } = await supabase.from('deliveries').select('*').eq('id', id).single();

			if (error) {
				this.logger.error(`Failed to fetch delivery with ID: ${id}`, error);
				throw new Error(`Error fetching delivery by ID: ${error.message}`);
			}

			this.logger.log(`Delivery with ID: ${id} retrieved successfully`);
			return data as DeliveryItem;
		} catch (error) {
			this.logger.error(`Unexpected error fetching delivery with ID: ${id}`, error);
			throw error;
		}
	}

	async findDeliveryByCodigoPedido(codigoPedido: string): Promise<DeliveryItem | null> {
		try {
			this.logger.log(`Fetching delivery with codigoPedido: ${codigoPedido}`);
			const { data, error } = await supabase.from('deliveries').select('*').eq('codigoPedido', codigoPedido).single();
			this.logger.log(`response from database: ${data}`);
			if (error) {
				this.logger.error(`Error querying database for delivery with codigoPedido: ${codigoPedido}`, error);
				return null;
			}

			this.logger.log(`Delivery with codigoPedido: ${codigoPedido} retrieved successfully`);
			return data as DeliveryItem;
		} catch (error) {
			this.logger.error(`Unexpected error fetching delivery with codigoPedido: ${codigoPedido}`, error);
			throw error;
		}
	}

	async saveNewItems(newItems: DeliveryItem[]): Promise<void> {
		try {
			this.logger.log(`Saving ${newItems.length} new delivery items`);
			const { error } = await supabase.from('deliveries').insert(newItems);

			if (error) {
				this.logger.error('Error saving new delivery items', error);
				throw new Error(`Error saving new delivery items: ${error.message}`);
			}

			this.logger.log('New delivery items saved successfully');
		} catch (error) {
			this.logger.error('Unexpected error saving new delivery items', error);
			throw error;
		}
	}

	async updateItems(updatedItems: DeliveryItem[]): Promise<void> {
		for (const item of updatedItems) {
			try {
				this.logger.log(`Updating delivery item with codigoPedido: ${item.codigoPedido}`);
				const { error } = await supabase
					.from('deliveries')
					.update({ statusPedido: item.statusPedido })
					.eq('codigoPedido', item.codigoPedido);

				if (error) {
					this.logger.error(`Error updating delivery item with codigoPedido: ${item.codigoPedido}`, error);
					throw new Error(`Error updating delivery item with codigoPedido: ${item.codigoPedido}`);
				}

				this.logger.log(`Delivery item with codigoPedido: ${item.codigoPedido} updated successfully`);
			} catch (error) {
				this.logger.error(`Unexpected error updating delivery item with codigoPedido: ${item.codigoPedido}`, error);
				throw error;
			}
		}
	}
}
