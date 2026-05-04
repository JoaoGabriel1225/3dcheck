import { MercadoPagoConfig, Payment } from 'mercadopago';
import { createClient } from '@supabase/supabase-js';

// Configuração usando Variáveis de Ambiente
const supabase = createClient(
  process.env.SUPABASE_URL, 
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const client = new MercadoPagoConfig({ 
  accessToken: process.env.MP_ACCESS_TOKEN 
});

export default async function handler(req, res) {
  // Responder rápido ao Mercado Pago
  if (req.method !== 'POST') return res.status(405).end();

  const { data, type } = req.body;

  if (type === 'payment') {
    try {
      const payment = new Payment(client);
      
      // Detalhes do pagamento no Mercado Pago
      const paymentData = await payment.get({ id: data.id });

      if (paymentData.status === 'approved') {
        // 1. Extraímos o ID do usuário e o tipo de plano do external_reference
        // Recebemos no formato "id-do-usuario:planType"
        const reference = paymentData.external_reference || "";
        const [userId, planType] = reference.split(':');

        if (!userId) throw new Error("ID do usuário não encontrado na referência.");

        // 2. Calculamos quantos dias adicionar
        const daysToAdd = planType === 'annual' ? 365 : 30;
        
        // 3. Geramos a nova data de expiração baseada em hoje
        const newExpiryDate = new Date();
        newExpiryDate.setDate(newExpiryDate.getDate() + daysToAdd);

        // 4. Atualizamos o perfil do usuário no Supabase
        const { error } = await supabase
          .from('profiles')
          .update({ 
            plan_status: 'pro',
            trial_ends_at: newExpiryDate.toISOString(), // Define a validade (30 ou 365 dias)
            // plan_type: planType // Opcional: caso queira salvar qual plano ele está
          })
          .eq('id', userId);

        if (error) {
            console.error('Erro ao atualizar Supabase:', error);
            throw error;
        }
        
        console.log(`✅ SUCESSO: Usuário ${userId} ativado como PRO por ${daysToAdd} dias (${planType}).`);
      }
    } catch (error) {
      console.error('❌ Erro ao processar webhook:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  res.status(200).send('OK');
}
