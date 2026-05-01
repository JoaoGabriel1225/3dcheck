import { MercadoPagoConfig, Payment } from 'mercadopago';
import { createClient } from '@supabase/supabase-js';

// Configuração usando Variáveis de Ambiente para segurança máxima
const supabase = createClient(
  process.env.SUPABASE_URL, 
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const client = new MercadoPagoConfig({ 
  accessToken: process.env.MP_ACCESS_TOKEN 
});

export default async function handler(req, res) {
  // Importante: Responder rápido ao Mercado Pago para evitar reenvios desnecessários
  if (req.method !== 'POST') return res.status(405).end();

  const { data, type } = req.body;

  // Só processamos se a notificação for de um pagamento
  if (type === 'payment') {
    try {
      const payment = new Payment(client);
      
      // Buscamos os detalhes do pagamento no Mercado Pago usando o ID recebido
      const paymentData = await payment.get({ id: data.id });

      // Se o status for aprovado (PIX pago ou Cartão autorizado)
      if (paymentData.status === 'approved') {
        const userId = paymentData.external_reference; // O ID do usuário que enviamos no checkout

        // Atualizamos o perfil do usuário no Supabase para PRO
        const { error } = await supabase
          .from('profiles')
          .update({ 
            plan_status: 'pro',
            trial_ends_at: null // Remove a expiração do trial
          })
          .eq('id', userId);

        if (error) {
            console.error('Erro ao atualizar Supabase:', error);
            throw error;
        }
        
        console.log(`Sucesso: Usuário ${userId} agora é PRO.`);
      }
    } catch (error) {
      console.error('Erro ao processar webhook:', error);
      // Retornamos 500 para o Mercado Pago tentar novamente mais tarde se for um erro temporário
      return res.status(500).json({ error: error.message });
    }
  }

  // Retornamos 200 (OK) para confirmar o recebimento da notificação
  res.status(200).send('OK');
}
