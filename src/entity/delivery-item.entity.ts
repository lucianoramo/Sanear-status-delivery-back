import { OrderStatus } from 'src/enum/order-status.enum';

export class DeliveryItem {
  dataPedido: string;
  codigoPedido: string;
  codigoCliente: string;
  descricaoCliente: string;
  emailCliente: string;
  telefoneCliente: string;
  descricaoVendedor: string;
  dataEntrega: string;
  cidadeCliente: string;
  estadoCliente: string;
  statusPedido: OrderStatus;
  descricaoTransportadora: string;
}
