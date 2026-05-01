import { MercadoPagoConfig, Payment } from 'mercadopago';
import { createClient } from '@supabase/supabase-js';

// Suas chaves do Supabase (pegue no painel do Supabase em Project Settings > API)
const supabase = createClient('SUA_URL_DO_SUPABASE', 'SUA_SERVICE_ROLE_KEY');

const client = new MercadoPagoConfig({ 
  accessToken: 'SEU_ACCESS_TOKEN_DO_MERCADO_PAGO' 
});

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { data, type } = req.body;

  // O Mercado Pago envia vários avisos; queremos apenas o de 'payment'
  if (type === 'payment') {
    try {
      const payment = new Payment(client);
      const paymentData = await payment.get({ id: data.id });

      // Se o status for 'approved', liberamos o acesso
      if (paymentData.status === 'approved') {
        const userId = paymentData.external_reference; // O ID que enviamos no Billing.tsx

        const { error } = await supabase
          .from('profiles')
          .update({ 
            plan_status: 'pro',
            trial_ends_at: null // Remove a trava do trial para o plano ser vitalício/mensal
          })
          .eq('id', userId);

        if (error) throw error;
      }
    } catch (error) {
      console.error('Erro ao processar webhook:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  // Sempre responda 200 para o Mercado Pago não achar que deu erro
  res.status(200).send('OK');
}
