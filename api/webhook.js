import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

// 1. Configuração do Supabase (Usando a Service Role para ter permissão de escrita)
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  // O Webhook da Stripe precisa receber o corpo bruto (raw body) para verificar a assinatura
  if (req.method !== 'POST') return res.status(405).end();

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    // 2. Verificação de Segurança: Garante que o aviso veio realmente da Stripe
    event = stripe.webhooks.constructEvent(
      req.body, 
      sig, 
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error(`❌ Erro na assinatura do Webhook: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // 3. Processa apenas quando o checkout é concluído com sucesso
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;

    try {
      // Extraímos o ID do usuário que enviamos no metadado lá no Billing.tsx
      const userId = session.metadata?.userId;
      
      if (!userId) {
        throw new Error("ID do usuário não encontrado nos metadados da sessão.");
      }

      // 4. Lógica de tempo: Verifica se é o plano anual ou mensal pelo valor ou ID do preço
      // Se o valor for maior que 100 reais, assumimos que é o anual (365 dias)
      const isAnnual = session.amount_total > 10000; // Stripe conta em centavos (19990 = R$ 199,90)
      const daysToAdd = isAnnual ? 365 : 30;

      // 5. Gera a nova data baseada em HOJE
      const newExpiryDate = new Date();
      newExpiryDate.setDate(newExpiryDate.getDate() + daysToAdd);

      // 6. Atualiza o perfil no Supabase (Colunas: plan_status e trialEndsAt)
      const { error } = await supabase
        .from('profiles')
        .update({ 
          plan_status: 'pro',
          trialEndsAt: newExpiryDate.toISOString() // Atualiza a data conforme o print
        })
        .eq('id', userId);

      if (error) throw error;

      console.log(`✅ SUCESSO: Usuário ${userId} ativado como PRO até ${newExpiryDate.toLocaleDateString()}.`);
      
    } catch (error) {
      console.error('❌ Erro ao atualizar Supabase via Webhook:', error.message);
      return res.status(500).json({ error: error.message });
    }
  }

  // Responde 200 para a Stripe não tentar enviar o mesmo aviso várias vezes
  res.status(200).json({ received: true });
}
