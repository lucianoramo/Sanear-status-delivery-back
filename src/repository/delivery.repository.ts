import { supabase } from '../config/supabaseClient';
import { DeliveryItem } from '../entity/delivery-item.entity';

export class DeliveryRepository {
  async findDeliveryById(id: string) {
    const { data, error } = await supabase
      .from('deliveries')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      throw new Error(error.details);
    }

    return data;
  }

  async findDeliveryByCodigoPedido(
    codigoPedido: string,
  ): Promise<DeliveryItem | null> {
    const { data, error } = await supabase
      .from('deliveries')
      .select('*')
      .eq('codigoPedido', codigoPedido)
      .single();

    if (error) {
      console.error(
        `Error querying database for delivery with codigoPedido: ${codigoPedido}`,
        error,
      );
      return null;
    }

    return data as DeliveryItem;
  }

  async saveNewItems(newItems: DeliveryItem[]): Promise<void> {
    const { error } = await supabase.from('deliveries').insert(newItems);

    if (error) {
      console.error('Error saving new delivery items', error);
    }
  }

  async updateItems(updatedItems: DeliveryItem[]): Promise<void> {
    for (const item of updatedItems) {
      const { error } = await supabase
        .from('deliveries')
        .update({ statusPedido: item.statusPedido })
        .eq('codigoPedido', item.codigoPedido);

      if (error) {
        console.error(
          `Error updating delivery item with codigoPedido: ${item.codigoPedido}`,
          error,
        );
      }
    }
  }
}
