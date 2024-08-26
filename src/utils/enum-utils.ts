import { OrderStatus } from 'src/enum/order-status.enum';

export function getStatusPedidoTitle(status: OrderStatus): string {
  return OrderStatus[status];
}
