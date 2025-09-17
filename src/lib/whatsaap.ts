// src/lib/whatsapp.ts
// Configuração do WhatsApp
const WHATSAPP_CONFIG = {
  // Número de teste (pode ser alterado facilmente)
  phoneNumber: '+5573988199938',
  
  // API de envio (usando wa.me para simplicidade - pode ser substituída por Twilio, etc.)
  apiUrl: 'https://api.whatsapp.com/send',
  
  // Configurações de retry
  maxRetries: 3,
  retryDelay: 2000
};

export interface PedidoWhatsApp {
  nome: string;
  telefone: string;
  itens: string;
  adicionais?: string;
  bebidas?: string;
  valorTotal: number;
  dataPedido: string;
  numeroPedido: string;
  orderType: 'delivery' | 'pickup'; // Tipo de pedido
  valorPago?: number; // Novo campo para o valor que o cliente vai pagar
  subtotal: number; // Adicionado
  deliveryFee: number; // Adicionado
  paymentMethod: string; // Adicionado
  address?: string; // Adicionado para incluir no WhatsApp se for entrega
}

// Função para formatar a mensagem do WhatsApp
export function formatarMensagemWhatsApp(pedido: PedidoWhatsApp): string {
  const tipoPedidoTexto = pedido.orderType === 'delivery' ? 'ENTREGA' : 'RETIRADA NO LOCAL';
  const enderecoInfo = pedido.orderType === 'delivery' && pedido.address ? `\n📍 *Endereço:* ${pedido.address}` : '';

  let trocoInfo = '';
  if (pedido.valorPago && pedido.valorPago > pedido.valorTotal) {
    const troco = pedido.valorPago - pedido.valorTotal;
    trocoInfo = `\n💵 *Valor Pago:* R$ ${pedido.valorPago.toFixed(2)}\n🔄 *Troco Necessário:* R$ ${troco.toFixed(2)}`;
  } else if (pedido.valorPago && pedido.valorPago === pedido.valorTotal) {
    trocoInfo = `\n💵 *Valor Pago:* R$ ${pedido.valorPago.toFixed(2)} (Valor Exato)`;
  }

  const getPaymentMethodLabel = (method: string): string => {
    const methods: Record<string, string> = {
      pix: 'PIX',
      dinheiro: 'Dinheiro',
      cartao: 'Cartão'
    };
    return methods[method] || method.toUpperCase();
  };
  
  const mensagem = `✨ *NOVO PEDIDO RECEBIDO!* ✨

---
📋 *Detalhes do Pedido:*
*Número:* ${pedido.numeroPedido}
*Data/Hora:* ${pedido.dataPedido}
*Tipo:* ${tipoPedidoTexto}

---
👤 *Dados do Cliente:*
*Nome:* ${pedido.nome}
*Telefone:* ${pedido.telefone}${enderecoInfo}

---
🛒 *Itens do Pedido:*
${pedido.itens}
${pedido.adicionais ? `\n📝 *Observações:*\n${pedido.adicionais}` : ''}
${pedido.bebidas ? `\n🥤 *Bebidas:*\n${pedido.bebidas}` : ''}

---
💰 *Valores:*
*Subtotal:* R$ ${pedido.subtotal.toFixed(2)}
*Taxa de Entrega:* R$ ${pedido.deliveryFee.toFixed(2)}
*TOTAL:* R$ ${pedido.valorTotal.toFixed(2)}
*Pagamento:* ${getPaymentMethodLabel(pedido.paymentMethod)}${trocoInfo}

---
✅ Pedido confirmado e em produção!`;

  return mensagem;
}

// Função para enviar mensagem via WhatsApp Web (método simples)
export function enviarWhatsAppWeb(pedido: PedidoWhatsApp): Promise<{ success: boolean; message: string }> {
  return new Promise((resolve) => {
    try {
      const mensagem = formatarMensagemWhatsApp(pedido);
      const mensagemCodificada = encodeURIComponent(mensagem);
      const numeroLimpo = WHATSAPP_CONFIG.phoneNumber.replace(/\D/g, '');
      
      // URL do WhatsApp Web
      const whatsappUrl = `https://wa.me/${numeroLimpo}?text=${mensagemCodificada}`;
      
     // 🚀 Redirecionamento direto (sem popup)
      window.location.href = whatsappUrl;
      
      resolve({
        success: true,
        message: 'Redirecionado para o WhatsApp com sucesso!'
      });

    } catch (error) {
      console.error('Erro ao abrir WhatsApp:', error);
      resolve({
        success: false,
        message: 'Erro ao abrir WhatsApp. Tente novamente.'
      });
    }
  });
}

// Função alternativa usando API REST (para implementação futura com Twilio, etc.)
export async function enviarWhatsAppAPI(pedido: PedidoWhatsApp): Promise<{ success: boolean; message: string }> {
  try {
    const mensagem = formatarMensagemWhatsApp(pedido);
    
    // Simulação de API REST (substitua pela API real quando disponível)
    console.log('📱 Enviando para WhatsApp:', {
      to: WHATSAPP_CONFIG.phoneNumber,
      message: mensagem,
      pedido: pedido.numeroPedido
    });
    
    // Simular delay de API
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Para demonstração, sempre retorna sucesso
    // Em produção, substitua por chamada real à API
    return {
      success: true,
      message: `Mensagem enviada para ${WHATSAPP_CONFIG.phoneNumber}`
    };
    
  } catch (error) {
    console.error('Erro na API do WhatsApp:', error);
    return {
      success: false,
      message: 'Erro ao enviar mensagem via API. Tente novamente.'
    };
  }
}

// Função principal para enviar WhatsApp (com retry)
export async function enviarPedidoWhatsApp(
  pedido: PedidoWhatsApp, 
  metodo: 'web' | 'api' = 'web'
): Promise<{ success: boolean; message: string }> {
  let ultimoErro = '';
  
  for (let tentativa = 1; tentativa <= WHATSAPP_CONFIG.maxRetries; tentativa++) {
    try {
      console.log(`📱 Tentativa ${tentativa} de envio para WhatsApp...`);
      
      const resultado = metodo === 'web' 
        ? await enviarWhatsAppWeb(pedido)
        : await enviarWhatsAppAPI(pedido);
      
      if (resultado.success) {
        console.log('✅ WhatsApp enviado com sucesso!');
        return resultado;
      }
      
      ultimoErro = resultado.message;
      
      // Aguardar antes da próxima tentativa
      if (tentativa < WHATSAPP_CONFIG.maxRetries) {
        await new Promise(resolve => setTimeout(resolve, WHATSAPP_CONFIG.retryDelay));
      }
      
    } catch (error) {
      ultimoErro = `Erro na tentativa ${tentativa}: ${error}`;
      console.error(ultimoErro);
      
      if (tentativa < WHATSAPP_CONFIG.maxRetries) {
        await new Promise(resolve => setTimeout(resolve, WHATSAPP_CONFIG.retryDelay));
      }
    }
  }
  
  return {
    success: false,
    message: `Falha após ${WHATSAPP_CONFIG.maxRetries} tentativas. Último erro: ${ultimoErro}`
  };
}

// Função para atualizar configurações (para o admin)
export function atualizarConfigWhatsApp(novoNumero: string) {
  WHATSAPP_CONFIG.phoneNumber = novoNumero;
  console.log('📱 Número do WhatsApp atualizado:', novoNumero);
}

// Função para obter configurações atuais
export function obterConfigWhatsApp() {
  return { ...WHATSAPP_CONFIG };
}
