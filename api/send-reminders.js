import { createClient } from '@supabase/supabase-js';
import sgMail from '@sendgrid/mail';

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export default async function handler(req, res) {
  try {
    // Obtener facturas no pagadas
    const { data: facturas, error } = await supabase
      .from('facturas')
      .select('*')
      .eq('pagada', false);

    if (error) throw error;

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    let enviados = 0;

    for (const factura of facturas) {
      const vencimiento = new Date(factura.fecha_vencimiento);
      vencimiento.setHours(0, 0, 0, 0);
      
      const diffDias = Math.ceil((vencimiento - hoy) / (1000 * 60 * 60 * 24));

      let debeEnviar = false;
      let tipo = '';

      // 3 días antes
      if (diffDias === 3) {
        debeEnviar = true;
        tipo = '3_dias_antes';
      }
      // Día del vencimiento
      else if (diffDias === 0) {
        debeEnviar = true;
        tipo = 'dia_vencimiento';
      }
      // 7 días después
      else if (diffDias === -7) {
        debeEnviar = true;
        tipo = '7_dias_despues';
      }

      if (debeEnviar) {
        // Verificar si ya se envió
        const { data: yaEnviado } = await supabase
          .from('recordatorios_enviados')
          .select('id')
          .eq('factura_id', factura.id)
          .eq('tipo', tipo)
          .single();

        if (!yaEnviado) {
          // Enviar email
          const msg = {
            to: factura.email_cliente,
            from: process.env.SENDGRID_FROM_EMAIL,
            subject: getEmailSubject(tipo, factura.numero_factura),
            text: getEmailBody(tipo, factura),
            html: getEmailHTML(tipo, factura)
          };

          await sgMail.send(msg);

          // Registrar envío
          await supabase
            .from('recordatorios_enviados')
            .insert([{
              factura_id: factura.id,
              tipo: tipo
            }]);

          enviados++;
        }
      }
    }

    res.status(200).json({ 
      success: true, 
      enviados,
      mensaje: `${enviados} recordatorios enviados`
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
}

function getEmailSubject(tipo, numeroFactura) {
  switch(tipo) {
    case '3_dias_antes':
      return `Recordatorio - Factura ${numeroFactura} vence pronto`;
    case 'dia_vencimiento':
      return `Factura ${numeroFactura} vence HOY`;
    case '7_dias_despues':
      return `Factura ${numeroFactura} - Seguimiento de pago`;
    default:
      return `Recordatorio - Factura ${numeroFactura}`;
  }
}

function getEmailBody(tipo, factura) {
  const base = `Hola ${factura.nombre_cliente},\n\n`;
  
  switch(tipo) {
    case '3_dias_antes':
      return base + `Te recordamos que la factura ${factura.numero_factura} por $${factura.monto} vence en 3 días.\n\nFecha de vencimiento: ${new Date(factura.fecha_vencimiento).toLocaleDateString()}\n\nSi ya realizaste el pago, ignora este mensaje.\n\nSaludos!`;
    
    case 'dia_vencimiento':
      return base + `Solo un recordatorio de que la factura ${factura.numero_factura} por $${factura.monto} vence HOY.\n\nSi necesitas más tiempo o ya realizaste el pago, por favor avísanos.\n\nGracias!`;
    
    case '7_dias_despues':
      return base + `La factura ${factura.numero_factura} por $${factura.monto} venció hace 7 días.\n\n¿Podemos coordinar el pago esta semana?\n\nSi hay algún problema o ya realizaste el pago, por favor házmelo saber.\n\nQuedo atento.`;
    
    default:
      return base + `Recordatorio sobre la factura ${factura.numero_factura}.`;
  }
}

function getEmailHTML(tipo, factura) {
  return `
    <h2>Recordatorio de Pago</h2>
    ${getEmailBody(tipo, factura).replace(/\n/g, '<br>')}
  `;
}