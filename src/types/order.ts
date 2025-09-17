export interface OrderData {
  id: string;
  customerName: string;
  phone: string;
  address: string;
  paymentMethod: 'pix' | 'dinheiro' | 'cartao';
  observations?: string;
  items: Array<{
    productId: string;
    productName: string;
    price: number;
    quantity: number;
  }>;
  subtotal: number;
  deliveryFee: number;
  total: number;
  status: 'pendente' | 'recebido' | 'producao' | 'entrega' | 'pronto_para_retirada' | 'entregue';
  createdAt: Date;
  estimatedDelivery: Date;
  type: 'delivery' | 'pickup'; // 'delivery' para entrega, 'pickup' para retirada
  valorPago?: number; // Valor que o cliente vai pagar (para cálculo de troco)
}

export interface OrderStatus {
  status: 'pendente' | 'recebido' | 'producao' | 'entrega' | 'entregue';
  timestamp: Date;
  description: string;
}