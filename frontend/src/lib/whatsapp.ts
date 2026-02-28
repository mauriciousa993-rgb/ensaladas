// Función para enviar notificación de WhatsApp al dueño del negocio
// Usa la API de Twilio para WhatsApp o cualquier otro provider

interface SaladItem {
  nombreSalad: string;
  precioBase: number;
  ingredientesRemovidos: string[];
  proteinaExtra: string | null;
  precioProteinaExtra: number;
  precioTotal: number;
  cantidad: number;
}

interface OrderData {
  numeroOrden: string;
  cliente: {
    nombre: string;
    celular: string;
  };
  tipoEntrega: string;
  direccion?: {
    calle: string;
    numero: string;
    barrio?: string;
    ciudad: string;
    referencia?: string;
  };
  ensaldas: SaladItem[];
  total: number;
  metodoPago: 'Efectivo' | 'PSE';
}

// Configuración desde variables de entorno
const WHATSAPP_NUMBER = process.env.WHATSAPP_BUSINESS_NUMBER || '573001234567'; // Número del negocio en formato WhatsApp
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_WHATSAPP_NUMBER = 'whatsapp:+14155238886'; // Número de Twilio para WhatsApp

/**
 * Formatea el mensaje de notificación contemplate literals
 */
function formatearMensaje(order: OrderData): string {
  // Título según método de pago
  const tipoPago = order.metodoPago === 'Efectivo' 
    ? '🟢 Nuevo pedido en EFECTIVO' 
    : '✅ Nuevo pedido PAGADO por PSE';
  
  // Información de entrega
  const infoEntrega = order.tipoEntrega === 'domicilio' && order.direccion
    ? `📍 Domicilio: ${order.direccion.calle} #${order.direccion.numero}, ${order.direccion.barrio || ''} - ${order.direccion.ciudad}`
    : '🏪 Recoger en tienda';

  // Formatear cada ensalada
  const detallesEnsaldas = order.ensaldas.map((item, index) => {
    const ingredientesEliminados = item.ingredientesRemovidos.length > 0
      ? `\n   ❌ Sin: ${item.ingredientesRemovidos.join(', ')}`
      : '';
    
    const proteinaAgregada = item.proteinaExtra
      ? `\n   🍗 +${item.proteinaExtra} ($${item.precioProteinaExtra.toLocaleString('es-CO')})`
      : '';
    
    return `${index + 1}. ${item.nombreSalad} x${item.cantidad}${ingredientesEliminados}${proteinaAgregada}
   💰 $${item.precioTotal.toLocaleString('es-CO')}`;
  }).join('\n\n');

  // Construir mensaje completo
  return `🥗 *ENSALADAS FRESH* 🥗

${tipoPago}

📋 *Orden #${order.numeroOrden}*

👤 *Cliente:* ${order.cliente.nombre}
📱 *Tel:* ${order.cliente.celular}

${infoEntrega}

📦 *DETALLE DEL PEDIDO:*
${detallesEnsaldas}

💵 *TOTAL: $${order.total.toLocaleString('es-CO')}*
${order.metodoPago === 'Efectivo' ? '\n⚠️ PAGO PENDIENTE (efectivo al entregar)' : '\n✅ PAGO CONFIRMADO'}

─────────────────────`;
}

/**
 * Envía notificación de WhatsApp usando Twilio
 */
async function enviarWhatsAppTwilio(mensaje: string, numeroCliente: string): Promise<boolean> {
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
    console.log('⚠️ Twilio no configurado. Mensaje que se enviaría:', mensaje);
    return false;
  }

  try {
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': 'Basic ' + Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64'),
        },
        body: new URLSearchParams({
          From: TWILIO_WHATSAPP_NUMBER,
          To: `whatsapp:${numeroCliente}`,
          Body: mensaje,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      console.error('❌ Error de Twilio:', error);
      return false;
    }

    const result = await response.json();
    console.log('✅ WhatsApp enviado:', result.sid);
    return true;
  } catch (error) {
    console.error('❌ Error al enviar WhatsApp:', error);
    return false;
  }
}

/**
 * Función principal para enviar notificación de nuevo pedido
 */
export async function notificarNuevoPedido(order: OrderData): Promise<boolean> {
  const mensaje = formatearMensaje(order);
  
  console.log('\n📱 === ENVIANDO NOTIFICACIÓN WHATSAPP ===\n');
  console.log(mensaje);
  console.log('\n📱 === FIN NOTIFICACIÓN ===\n');

  // Enviar al número del negocio
  const enviado = await enviarWhatsAppTwilio(mensaje, WHATSAPP_NUMBER);
  
  return enviado;
}

/**
 * Función alternativa que usa WhatsApp Business API directa
 * (para cuando se tenga token de API de Meta)
 */
export async function enviarWhatsAppDirecto(mensaje: string, phoneNumberId: string, accessToken: string): Promise<boolean> {
  try {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: WHATSAPP_NUMBER,
          type: 'text',
          text: { body: mensaje },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      console.error('❌ Error de WhatsApp API:', error);
      return false;
    }

    const result = await response.json();
    console.log('✅ WhatsApp enviado:', result);
    return true;
  } catch (error) {
    console.error('❌ Error al enviar WhatsApp:', error);
    return false;
  }
}

export default notificarNuevoPedido;
