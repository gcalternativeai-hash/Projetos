// src/utils/printComanda.ts
/**
 * Sistema de impressão de comandas - Nova implementação
 * Substitui completamente a lógica anterior
 */

import { OrderData } from '../types/order';

interface PrintOptions {
  storeName?: string;
  storeAddress?: string;
  storePhone?: string;
}

/**
 * Formata a data para exibição na comanda
 */
const formatDateTime = (date: Date): string => {
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Converte método de pagamento para label legível
 */
const getPaymentMethodLabel = (method: string): string => {
  const methods: Record<string, string> = {
    pix: 'PIX',
    dinheiro: 'Dinheiro',
    cartao: 'Cartão'
  };
  return methods[method] || method.toUpperCase();
};

/**
 * Gera o HTML da comanda para impressão
 */
const generateComandaHTML = (order: OrderData, options: PrintOptions = {}): string => {
  console.log('DEBUG - printComanda: Objeto OrderData recebido para gerar comanda:', order);
  console.log('DEBUG - printComanda: order.paymentMethod:', order.paymentMethod);
  console.log('DEBUG - printComanda: order.deliveryFee:', order.deliveryFee);
  console.log('DEBUG - printComanda: order.total:', order.total);
  console.log('DEBUG - printComanda: order.subtotal:', order.subtotal); // Certifique-se que este log está aqui
  console.log('DEBUG - printComanda: order.valorPago:', order.valorPago);

  const {
    storeName = 'UMAMI', // Altere para o nome correto da loja
    storeAddress = 'Rua Barão do Rio Branco, 101 - Maracás-Ba', // Altere para o endereço correto
    storePhone = '(73) 9 8819-9938' // Altere para o telefone correto
  } = options;

  const orderType = order.address ? 'ENTREGA' : 'RETIRADA';

  let trocoInfoHTML = '';
  console.log('DEBUG - printComanda: Verificando condição para troco...');
  console.log('DEBUG - printComanda: order.paymentMethod === "dinheiro":', order.paymentMethod === 'dinheiro');
  console.log('DEBUG - printComanda: order.valorPago !== undefined:', order.valorPago !== undefined);
  console.log('DEBUG - printComanda: order.valorPago !== null:', order.valorPago !== null);
  console.log('DEBUG - printComanda: Tipo de order.valorPago:', typeof order.valorPago);

  if (order.paymentMethod === 'dinheiro' && order.valorPago !== undefined && order.valorPago !== null) {
    console.log('DEBUG - printComanda: Condição para troco ATENDIDA. Gerando HTML do troco.');
    const troco = order.valorPago - order.total;
    trocoInfoHTML = `
      <div class="total-line">
        <span>VALOR PAGO:</span>
        <span>R$ ${order.valorPago.toFixed(2)}</span>
      </div>
      ${troco > 0 ? `
      <div class="total-line">
        <span>TROCO:</span>
        <span>R$ ${troco.toFixed(2)}</span>
      </div>
      ` : ''}
    `;
    console.log('DEBUG - printComanda: trocoInfoHTML gerado:', trocoInfoHTML);
  } else {
    console.log('DEBUG - printComanda: Condição para troco NÃO ATENDIDA. trocoInfoHTML permanecerá vazio.');
  }
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Comanda - ${order.id}</title>
      <style>
        @page {
          size: 80mm auto;
          margin: 5mm;
        }
        
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Courier New', monospace;
          font-size: 16px; /* ALTERADO: Aumentado para preencher mais */
          line-height: 1.3;
          color: black;
          background: white;
          width: 78mm; /* Ajustado para impressoras de 80mm */
          margin: 0 auto;
          font-weight: bold;
        }
        
        .header {
          text-align: center;
          margin-bottom: 10px;
          border-bottom: 1px solid #000;
          padding-bottom: 5px;
        }
        
        .header h1 {
          font-size: 20px; /* ALTERADO: Aumentado */
          margin-bottom: 2px;
        }
        
        .header h2 {
          font-size: 18px; /* ALTERADO: Aumentado */
          margin-bottom: 3px;
        }
        
        .separator {
          text-align: center;
          margin: 8px 0;
        }
        
        .info-section {
          margin-bottom: 10px;
        }
        
        .info-line {
          margin-bottom: 2px;
          word-wrap: break-word;
        }
        
        .info-line strong {
          /* Herdará do body */
        }

        .items-section {
          margin: 10px 0;
        }
        
        .items-header {
          /* Herdará do body */
          margin-bottom: 5px;
          text-decoration: underline;
        }
        
        .item {
          display: flex;
          justify-content: space-between;
          margin-bottom: 3px;
          align-items: flex-start;
        }
        
        .item-name {
          flex: 1;
          margin-right: 5px;
          /* Herdará do body */
        }
        
        .item-price {
          /* Herdará do body */
          white-space: nowrap;
        }
        
        .observations {
          margin: 10px 0;
          padding: 5px;
          border: 1px solid #000;
        }
        
        .observations-header {
          /* Herdará do body */
          margin-bottom: 3px;
        }
        
        .totals {
          margin: 10px 0;
          border-top: 1px solid #000;
          padding-top: 5px;
        }
        
        .total-line {
          display: flex;
          justify-content: space-between;
          margin-bottom: 2px;
        }
        
        .total-line span {
          /* Herdará do body */
        }

        .total-final {
          font-size: 18px; /* ALTERADO: Aumentado */
          border-top: 1px solid #000;
          padding-top: 3px;
          margin-top: 3px;
        }
        
        .total-final span {
          /* Herdará do body */
        }

        .footer {
          text-align: center;
          margin-top: 15px;
          border-top: 1px solid #000;
          padding-top: 5px;
          font-size: 14px; /* ALTERADO: Aumentado */
        }
        
        @media print {
          body { margin: 0; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${storeName}</h1>
        <h2>COMANDA DE PEDIDO</h2>
      </div>
      
      <div class="separator">================================</div>
      
      <div class="info-section">
        <div class="info-line"><strong>PEDIDO:</strong> ${order.id}</div>
        <div class="info-line"><strong>DATA/HORA:</strong> ${formatDateTime(order.createdAt)}</div>
        <div class="info-line"><strong>CLIENTE:</strong> ${order.customerName}</div>
        <div class="info-line"><strong>TELEFONE:</strong> ${order.phone}</div>
        <div class="info-line"><strong>TIPO:</strong> ${order.type === 'delivery' ? 'ENTREGA' : 'RETIRADA NO LOCAL'}</div>
        ${order.address ? `<div class="info-line"><strong>ENDEREÇO:</strong> ${order.address}</div>` : ''}
      </div>
      
      <div class="separator">--------------------------------</div>
      
      <div class="items-section">
        <div class="items-header">ITENS DO PEDIDO:</div>
        ${order.items.map(item => `
          <div class="item">
            <div class="item-name">${item.quantity}x ${item.product.name}</div> <!-- ALTERADO AQUI -->
            <div class="item-price">R$ ${(item.product.price * item.quantity).toFixed(2)}</div> <!-- ALTERADO AQUI -->
          </div>
        `).join('')}
      </div>
      
      ${order.observations ? `
        <div class="separator">--------------------------------</div>
        <div class="observations">
          <div class="observations-header">OBSERVAÇÕES:</div>
          <div>${order.observations}</div>
        </div>
      ` : ''}
      
      <div class="separator">--------------------------------</div>
      
      <div class="totals">
        <div class="total-line">
          <span>SUBTOTAL:</span>
          <span>R$ ${order.subtotal.toFixed(2)}</span>
        </div>
        <div class="total-line">
          <span>ENTREGA:</span>
          <span>R$ ${order.deliveryFee.toFixed(2)}</span>
        </div>
        <div class="total-line total-final">
          <span>TOTAL:</span>
          <span>R$ ${order.total.toFixed(2)}</span>
        </div>
        <div class="total-line" style="margin-top: 5px;">
          <span><strong>PAGAMENTO:</strong></span>
          <span><strong>${getPaymentMethodLabel(order.paymentMethod)}</strong></span>
        </div>
        ${trocoInfoHTML}
      </div>
      
      <div class="separator">================================</div>
      
      <div class="footer">
        <div>Obrigado pela preferência!</div>
        <div style="margin-top: 2px;">${storePhone}</div>
        <div>${storeAddress}</div>
      </div>
    </body>
    </html>
  `;
};

/**
 * Função principal para imprimir comanda
 * Nova implementação usando iframe oculto para evitar bloqueio de pop-ups
 */
export const printComanda = (order: OrderData, options: PrintOptions = {}): void => {
  try {
    const comandaHTML = generateComandaHTML(order, options);
    
    // Criar iframe oculto para impressão
    const printFrame = document.createElement('iframe');
    printFrame.style.display = 'none';
    printFrame.style.position = 'absolute';
    printFrame.style.left = '-9999px';
    printFrame.style.top = '-9999px';
    document.body.appendChild(printFrame);
    
    // Escrever o conteúdo HTML no iframe
    const iframeDoc = printFrame.contentWindow?.document;
    if (iframeDoc) {
      iframeDoc.open();
      iframeDoc.write(comandaHTML);
      iframeDoc.close();
      
      // Acionar a impressão do conteúdo do iframe
      printFrame.contentWindow?.print();
      
      // Remover o iframe após a impressão
      setTimeout(() => {
        document.body.removeChild(printFrame);
      }, 1000);
    } else {
      alert('Erro: Não foi possível acessar o documento do iframe para impressão.');
      document.body.removeChild(printFrame);
    }

    
  } catch (error) {
    console.error('Erro ao imprimir comanda:', error);
    alert('Erro ao gerar a comanda para impressão. Tente novamente.');
  }
};

export default {
  printComanda
};
