import React, { useState } from 'react';
import { X, User, Phone, MapPin, CreditCard, MessageSquare, Loader2, CheckCircle } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useOrder } from '../contexts/OrderContext';
import { OrderData } from '../types/order';
import { salvarPedidoSupabase, PedidoSupabase } from '../lib/supabase';
import { enviarPedidoWhatsApp, PedidoWhatsApp } from '../lib/whatsapp';
import { useAdmin } from '../contexts/AdminContext'; // Adicione esta linha
import { isStoreOpen } from '../utils/storeStatus';
import { CartItem } from '../contexts/CartContext'; // Adicione esta importação

export function OrderForm() {
  const { state: cartState, totalPrice, deliveryFee, finalTotal, dispatch: cartDispatch } = useCart();
  const { state: orderState, dispatch: orderDispatch } = useOrder();
  const { state: adminState } = useAdmin(); // Adicione esta linha
  const storeOpen = isStoreOpen(adminState.settings.operatingHours);
  
  
  const [formData, setFormData] = useState({
    customerName: '',
    phone: '',
    address: '',
    paymentMethod: 'pix' as 'pix' | 'dinheiro' | 'cartao',
    observations: ''
  });
  const [orderType, setOrderType] = useState<'delivery' | 'pickup'>('delivery');
  const [amountPaid, setAmountPaid] = useState<number | null>(null); // Estado para o valor que o cliente vai pagar
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [supabaseError, setSupabaseError] = useState<string | null>(null);
  const [whatsappStatus, setWhatsappStatus] = useState<{ success?: boolean; message?: string } | null>(null);

  if (!orderState.showOrderForm) return null;

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.customerName.trim()) {
      newErrors.customerName = 'Nome é obrigatório';
    }
    
    if (!formData.phone.trim()) {
      newErrors.phone = 'Telefone é obrigatório';
    } else if (!/^\(\d{2}\)\s\d{4,5}-\d{4}$/.test(formData.phone)) {
      newErrors.phone = 'Formato: (11) 99999-9999';
    }
    
    if (orderType === 'delivery' && !formData.address.trim()) {
      newErrors.address = 'Endereço é obrigatório para entrega';
    }

    const currentSubtotalForValidation = cartState.items.reduce((total, item) => total + (item.product.price * item.quantity), 0);
    const currentDeliveryFeeForValidation = orderType === 'delivery' ? adminState.settings.deliveryFee : 0;
    const currentTotalForValidation = currentSubtotalForValidation + currentDeliveryFeeForValidation;

    if (formData.paymentMethod === 'dinheiro') {
      if (amountPaid === null || amountPaid < (orderType === 'delivery' ? finalTotal : totalPrice)) {
        newErrors.amountPaid = 'Valor pago deve ser maior ou igual ao total do pedido';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 11) {
      return numbers.replace(/(\d{2})(\d{4,5})(\d{4})/, '($1) $2-$3');
    }
    return value;
  };

  const handleInputChange = (field: string, value: string) => {
    if (field === 'phone') {
      value = formatPhone(value);
    }


     if (field === 'amountPaid') {
      setAmountPaid(parseFloat(value) || null);
      // Não limpe o erro aqui, pois a validação é mais complexa
      return;
    }
    
    
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleOrderTypeChange = (type: 'delivery' | 'pickup') => {
    setOrderType(type);
    if (type === 'pickup') {
      setFormData(prev => ({ ...prev, address: '' }));
      setErrors(prev => ({ ...prev, address: '' }));
    }
  };
  const generateOrderId = () => {
    const timestamp = Date.now().toString().slice(-5);
    return `PED-${timestamp}`;
  };

  const formatarItensParaSupabase = (items: any[]) => {
    return items.map(item => `${item.productName || item.product?.name || 'Item'} (${item.quantity || 1}x - R$ ${(item.price || item.product?.price || 0).toFixed(2)})`).join(', ');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!storeOpen) {
      alert('A loja está fechada no momento. Não é possível fazer pedidos.');
      return;
    }

     // Adicione esta verificação
    if (orderState.currentOrder && orderState.currentOrder.status !== 'entregue') {
    if (orderState.currentOrder &&
        orderState.currentOrder.status !== 'entregue' &&
        orderState.currentOrder.status !== 'pronto_para_retirada') {
      alert('Você já tem um pedido ativo! Por favor, acompanhe seu pedido atual ou aguarde a entrega antes de fazer um novo.');
      orderDispatch({ type: 'SHOW_TRACKING' }); // Opcional: redirecionar para o acompanhamento
      return;
    }
    }
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    setSupabaseError(null);
    orderDispatch({ type: 'SET_LOADING', payload: true });

  const calculatedSubtotal = cartState.items.reduce((total, item) => total + (item.product.price * item.quantity), 0);
  const currentDeliveryFee = orderType === 'delivery' ? adminState.settings.deliveryFee : 0;
  const calculatedTotal = calculatedSubtotal + currentDeliveryFee;

  console.log('DEBUG - OrderForm: calculatedSubtotal (after calc):', calculatedSubtotal);
  console.log('DEBUG - OrderForm: currentDeliveryFee (after calc):', currentDeliveryFee);
  console.log('DEBUG - OrderForm: calculatedTotal (after calc):', calculatedTotal);
    
    try {
      // Preparar dados para o Supabase
      const pedidoSupabase = {
        nome: formData.customerName,
        telefone: formData.phone,
        endereco: orderType === 'delivery' ? formData.address : 'Retirada no Local',
        items: cartState.items,
        adicionais: formData.observations || '',
        bebidas: cartState.items
          .filter(item => item.product.category === 'Bebidas')
          .map(item => `${item.product?.name || 'Bebida'} (${item.quantity || 1}x)`)
          .join(', '),
        valor_total: calculatedTotal,
        payment_method: formData.paymentMethod,
        type: orderType,
        valor_pago: formData.paymentMethod === 'dinheiro' ? amountPaid : null,
        delivery_fee: currentDeliveryFee,
      };

      console.log('DEBUG - OrderForm: formData.paymentMethod antes de salvar:', formData.paymentMethod);
      console.log('DEBUG - OrderForm: calculatedSubtotal:', calculatedSubtotal);
      console.log('DEBUG - OrderForm: currentDeliveryFee:', currentDeliveryFee);
      console.log('DEBUG - OrderForm: calculatedTotal:', calculatedTotal);
      console.log('DEBUG - OrderForm: amountPaid (digitado):', amountPaid);
      console.log('DEBUG - OrderForm: pedidoSupabase.valor_total (para Supabase):', pedidoSupabase.valor_total);
      console.log('DEBUG - OrderForm: pedidoSupabase.valor_pago (para Supabase):', pedidoSupabase.valor_pago);

      // Salvar no Supabase
      const resultado = await salvarPedidoSupabase(pedidoSupabase);
      
      if (resultado.success) {
        // Criar pedido local para acompanhamento
        const orderData: OrderData = {
          id: resultado.data?.id || generateOrderId(),
          customerName: formData.customerName,
          phone: formData.phone,
          address: orderType === 'delivery' ? formData.address : 'Retirada no Local',
          paymentMethod: formData.paymentMethod,
          observations: formData.observations,
          items: cartState.items.map(item => ({
            productId: item.product.id,
            productName: item.product.name,
            price: item.product.price,
            quantity: item.quantity
          })),
          subtotal: calculatedSubtotal, // Use o subtotal calculado aqui
          deliveryFee: currentDeliveryFee, // Use a taxa de entrega calculada aqui
          total: calculatedTotal, // Use o total calculado aqui
          status: 'recebido',
          createdAt: new Date(),
          estimatedDelivery: new Date(Date.now() + 45 * 60 * 1000),
          type: orderType,
          valorPago: formData.paymentMethod === 'dinheiro' ? amountPaid : null,
        };


        console.log('DEBUG - OrderForm: orderData.subtotal (antes do dispatch):', orderData.subtotal);
        console.log('DEBUG - OrderForm: orderData.deliveryFee (antes do dispatch):', orderData.deliveryFee);
        console.log('DEBUG - OrderForm: orderData.total (antes do dispatch):', orderData.total);
        console.log('DEBUG - OrderForm: orderData.valorPago (antes do dispatch):', orderData.valorPago);

        
        orderDispatch({ type: 'CREATE_ORDER', payload: orderData });
        cartDispatch({ type: 'CLEAR_CART' });
        cartDispatch({ type: 'CLOSE_CART' });
        
        // Enviar para WhatsApp após salvar no Supabase
        try {
          const pedidoWhatsApp: PedidoWhatsApp = {
            nome: formData.customerName,
            telefone: formData.phone,
            itens: formatarItensParaSupabase(cartState.items),
            adicionais: formData.observations || '',
            bebidas: cartState.items
              .filter(item => item.product.category === 'Bebidas')
              .map(item => `${item.product?.name || 'Bebida'} (${item.quantity || 1}x)`)
              .join(', '),
            valorTotal: calculatedTotal,
            dataPedido: new Date().toLocaleString('pt-BR'),
            numeroPedido: orderData.id,
            orderType: orderType,
            valorPago: formData.paymentMethod === 'dinheiro' ? amountPaid : null,
            // --- NOVOS CAMPOS PARA WHATSAPP ---
            subtotal: calculatedSubtotal, // Passando o subtotal
            deliveryFee: currentDeliveryFee, // Passando a taxa de entrega
            paymentMethod: formData.paymentMethod, // Passando o método de pagamento
            address: formData.address // Passando o endereço para o WhatsApp
          };
          
          const whatsappResult = await enviarPedidoWhatsApp(pedidoWhatsApp, 'web');
          setWhatsappStatus(whatsappResult);
          
          if (whatsappResult.success) {
            alert(`✅ ${resultado.message}! Pedido #${orderData.id.slice(-5)} criado.\n\n📱 ${whatsappResult.message}\n\nVocê pode acompanhar o status do seu pedido.`);
          } else {
            alert(`✅ ${resultado.message}! Pedido #${orderData.id.slice(-5)} criado.\n\n⚠️ WhatsApp: ${whatsappResult.message}\n\nVocê pode acompanhar o status do seu pedido.`);
          }
        } catch (whatsappError) {
          console.error('Erro no WhatsApp:', whatsappError);
          setWhatsappStatus({
            success: false,
            message: 'Erro ao enviar WhatsApp'
          });
          alert(`✅ ${resultado.message}! Pedido #${orderData.id.slice(-5)} criado.\n\n⚠️ Erro ao enviar WhatsApp, mas o pedido foi salvo.\n\nVocê pode acompanhar o status do seu pedido.`);
        }
      } else {
        setSupabaseError(resultado.message);
      }
    } catch (error) {
      console.error('Erro ao processar pedido:', error);
      setSupabaseError('Erro inesperado ao salvar pedido, tente novamente');
    } finally {
      setIsSubmitting(false);
      orderDispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const calculateChange = () => {
    const totalOrder = orderType === 'delivery' ? finalTotal : totalPrice;
    if (amountPaid !== null && amountPaid > totalOrder) {
      return amountPaid - totalOrder;
    }
    return 0;
  };
  const changeNeeded = calculateChange();

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div 
        className="absolute inset-0 bg-black bg-opacity-50 transition-opacity duration-300"
        onClick={() => orderDispatch({ type: 'HIDE_ORDER_FORM' })}
      />
      
      <div className="absolute inset-x-0 bottom-0 top-16 bg-white rounded-t-2xl shadow-xl transform transition-transform duration-300 ease-in-out overflow-y-auto dark:bg-gray-900">
        <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between dark:bg-gray-900 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Finalizar Pedido</h2>
          <button
            onClick={() => orderDispatch({ type: 'HIDE_ORDER_FORM' })}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors dark:hover:bg-gray-700 dark:text-gray-300"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-6">
          {/* Order Summary */}
          <div className="bg-red-50 p-4 rounded-lg dark:bg-red-900">
            <h3 className="font-semibold text-red-800 mb-2 dark:text-red-200">Resumo do Pedido</h3>
            <div className="space-y-1 text-sm text-red-700 dark:text-red-100">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>R$ {totalPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Entrega:</span>
                <span className={`font-medium ${orderType === 'pickup' ? 'text-green-600' : ''}`}>
                  {orderType === 'pickup' ? 'Grátis (Retirada)' : (deliveryFee === 0 ? 'Grátis' : `R$ ${deliveryFee.toFixed(2)}`)}
                </span>
              </div>
              <div className="flex justify-between font-bold text-red-800 border-t pt-1 dark:text-red-200 dark:border-red-700">
                <span>Total:</span>
                <span>R$ {(orderType === 'delivery' ? finalTotal : totalPrice).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Erro do Supabase */}
          {supabaseError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 dark:bg-red-900 dark:border-red-700">
              <div className="flex items-center space-x-2">
                <span className="text-red-600">❌</span>
                <p className="text-red-800 font-medium dark:text-red-200">Erro ao salvar pedido</p>
              </div>
              <p className="text-red-700 text-sm mt-1 dark:text-red-100">{supabaseError}</p>
              <button
                onClick={() => setSupabaseError(null)}
                className="text-red-600 hover:text-red-800 text-sm mt-2 underline dark:text-red-400 dark:hover:text-red-300"
              >
                Tentar novamente
              </button>
            </div>
          )}

          {/* Tipo de Pedido */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-800 flex items-center space-x-2 dark:text-gray-100">
              <MapPin size={18} className="text-red-500" />
              <span>Tipo de Pedido</span>
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <label
                className={`flex items-center justify-center p-4 border rounded-lg cursor-pointer transition-all ${
                  orderType === 'delivery'
                    ? 'border-red-500 bg-red-50 dark:border-red-700 dark:bg-red-900'
                    : 'border-gray-300 hover:border-red-300 dark:border-gray-600 dark:bg-gray-700 dark:hover:border-red-500'
                }`}
              >
                <input
                  type="radio"
                  name="orderType"
                  value="delivery"
                  checked={orderType === 'delivery'}
                  onChange={() => handleOrderTypeChange('delivery')}
                  className="sr-only"
                />
                <div className="text-center">
                  <div className="text-2xl mb-2">🚚</div>
                  <div className="font-medium text-gray-800 dark:text-gray-100">Entrega</div>
                  <div className="text-xs text-gray-600 dark:text-gray-300">Receba em casa</div>
                </div>
              </label>
              <label
                className={`flex items-center justify-center p-4 border rounded-lg cursor-pointer transition-all ${
                  orderType === 'pickup'
                    ? 'border-red-500 bg-red-50 dark:border-red-700 dark:bg-red-900'
                    : 'border-gray-300 hover:border-red-300 dark:border-gray-600 dark:bg-gray-700 dark:hover:border-red-500'
                }`}
              >
                <input
                  type="radio"
                  name="orderType"
                  value="pickup"
                  checked={orderType === 'pickup'}
                  onChange={() => handleOrderTypeChange('pickup')}
                  className="sr-only"
                />
                <div className="text-center">
                  <div className="text-2xl mb-2">🏪</div>
                  <div className="font-medium text-gray-800 dark:text-gray-100">Retirada</div>
                  <div className="text-xs text-gray-600 dark:text-gray-300">Buscar na loja</div>
                </div>
              </label>
            </div>
          </div>
          {/* Status do WhatsApp */}
          {whatsappStatus && (
            <div className={`border rounded-lg p-4 ${
              whatsappStatus.success 
                ? 'bg-green-50 border-green-200 dark:bg-green-900 dark:border-green-700' 
                : 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900 dark:border-yellow-700'
            }`}>
              <div className="flex items-center space-x-2">
                <span className={whatsappStatus.success ? 'text-green-600' : 'text-yellow-600'}>
                  {whatsappStatus.success ? '📱✅' : '📱⚠️'}
                </span>
                <p className={`font-medium ${
                  whatsappStatus.success ? 'text-green-800 dark:text-green-200' : 'text-yellow-800 dark:text-yellow-200'
                }`}>
                  WhatsApp
                </p>
              </div>
              <p className={`text-sm mt-1 ${
                whatsappStatus.success ? 'text-green-700 dark:text-green-100' : 'text-yellow-700 dark:text-yellow-100'
              }`}>
                {whatsappStatus.message}
              </p>
              <button
                onClick={() => setWhatsappStatus(null)}
                className={`text-sm mt-2 underline ${
                  whatsappStatus.success 
                    ? 'text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300' 
                    : 'text-yellow-600 hover:text-yellow-800 dark:text-yellow-400 dark:hover:text-yellow-300'
                }`}
              >
                Fechar
              </button>
            </div>
          )}
          {/* Customer Info */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-800 flex items-center space-x-2 dark:text-gray-100">
              <User size={18} className="text-red-500" />
              <span>Dados Pessoais</span>
            </h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-200">
                Nome Completo *
              </label>
              <input
                type="text"
                value={formData.customerName}
                onChange={(e) => handleInputChange('customerName', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 ${
                  errors.customerName ? 'border-red-500' : 'border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white'
                }`}
                placeholder="Seu nome completo"
              />
              {errors.customerName && (
                <p className="text-red-500 text-xs mt-1">{errors.customerName}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-200">
                Telefone *
              </label>
              <div className="relative">
                <Phone size={18} className="absolute left-3 top-2.5 text-gray-400 dark:text-gray-500" />
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 ${
                    errors.phone ? 'border-red-500' : 'border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white'
                  }`}
                  placeholder="(11) 99999-9999"
                />
              </div>
              {errors.phone && (
                <p className="text-red-500 text-xs mt-1">{errors.phone}</p>
              )}
            </div>

            {orderType === 'delivery' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-200">
                Endereço de Entrega *
              </label>
              <div className="relative">
                <MapPin size={18} className="absolute left-3 top-2.5 text-gray-400 dark:text-gray-500" />
                <textarea
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 resize-none ${
                    errors.address ? 'border-red-500' : 'border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white'
                  }`}
                  placeholder="Rua, número, bairro, complemento..."
                  rows={3}
                />
              </div>
              {errors.address && (
                <p className="text-red-500 text-xs mt-1">{errors.address}</p>
              )}
            </div>
            )}
          </div>

          {/* Payment Method */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-800 flex items-center space-x-2 dark:text-gray-100">
              <CreditCard size={18} className="text-red-500" />
              <span>Forma de Pagamento</span>
            </h3>
            
            <div className="space-y-2">
              {[
                { value: 'pix', label: '💳 PIX', desc: 'Pagamento instantâneo' },
                { value: 'dinheiro', label: '💵 Dinheiro', desc: 'Pagamento na entrega' },
                { value: 'cartao', label: '💳 Cartão', desc: 'Débito ou crédito na entrega' }
              ].map((option) => (
                <label
                  key={option.value}
                  className={`flex items-center p-3 border rounded-lg cursor-pointer transition-all ${
                    formData.paymentMethod === option.value
                      ? 'border-red-500 bg-red-50 dark:border-red-700 dark:bg-red-900'
                      : 'border-gray-300 hover:border-red-300 dark:border-gray-600 dark:bg-gray-700 dark:hover:border-red-500'
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value={option.value}
                    checked={formData.paymentMethod === option.value}
                    onChange={(e) => handleInputChange('paymentMethod', e.target.value)}
                    className="sr-only"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-gray-800 dark:text-gray-100">{option.label}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">{option.desc}</div>
                  </div>
                  {formData.paymentMethod === option.value && (
                    <CheckCircle size={20} className="text-red-500" />
                  )}
                </label>
              ))}
            </div>
          </div>


 {formData.paymentMethod === 'dinheiro' && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg shadow-inner dark:bg-gray-800">
                <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-200">
                  Precisa de troco? (Valor pago)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min={(orderType === 'delivery' ? finalTotal : totalPrice).toFixed(2)} // Valor mínimo é o total do pedido
                  value={amountPaid !== null ? amountPaid : ''}
                  onChange={(e) => handleInputChange('amountPaid', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 ${
                    errors.amountPaid ? 'border-red-500' : 'border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white'
                  }`}
                  placeholder={`R$ ${(orderType === 'delivery' ? finalTotal : totalPrice).toFixed(2)}`}
                />
                {errors.amountPaid && (
                  <p className="text-red-500 text-xs mt-1">{errors.amountPaid}</p>
                )}
                {amountPaid !== null && amountPaid >= (orderType === 'delivery' ? finalTotal : totalPrice) && (
                  <p className="text-green-600 text-sm mt-2 dark:text-green-400">
                    Troco: R$ {changeNeeded.toFixed(2)}
                  </p>
                )}
                {amountPaid !== null && amountPaid < (orderType === 'delivery' ? finalTotal : totalPrice) && (
                  <p className="text-red-500 text-sm mt-2 dark:text-red-400">
                    Valor insuficiente.
                  </p>
                )}
              </div>
            )}
          

          {/* Observations */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-200">
              <MessageSquare size={16} className="inline mr-1" />
              Observações (opcional)
            </label>
            <textarea
              value={formData.observations}
              onChange={(e) => handleInputChange('observations', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 resize-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              placeholder="Alguma observação especial para seu pedido..."
              rows={3}
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full py-3 rounded-lg font-medium transition-all duration-200 flex items-center justify-center space-x-2 ${
              isSubmitting 
                ? 'bg-gray-400 cursor-not-allowed' 
                : supabaseError 
                  ? 'bg-red-500 hover:bg-green-600' 
                  : 'bg-red-500 hover:bg-green-600'
            } text-white`}
          >
            {isSubmitting ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                <span>Salvando no Supabase...</span>
              </>
            ) : supabaseError ? (
              <>
                <span>🔄 Tentar Novamente</span>
              </>
            ) : (
              <>
                <CheckCircle size={20} />
                <span>Finalizar Pedido</span>
              </>
            )}
          </button>
        </form>

        {/* Info sobre Supabase */}
        <div className="mt-4 p-3 bg-blue-50 rounded-lg dark:bg-blue-900">
          <p className="text-xs text-blue-700 text-center dark:text-blue-100">
            🔒 Seus dados são salvos com segurança no Supabase
          </p>
        </div>
      </div>
    </div>
  );
}
