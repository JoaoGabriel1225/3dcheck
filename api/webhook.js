import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

// 1. DESATIVA O BODY PARSER AUTOMÁTICO (Obrigatório para Stripe na Vercel)
export const config = {
  api: {
    bodyParser: false,
  },
};

// 2. Função auxiliar para ler os dados brutos da requisição sem alterações
async function buffer(readable) {
  const chunks = [];
  for await (const chunk of readable) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const sig = req.headers['stripe-signature'];
  
  let event;

  try {
    // 3. CAPTURAMOS O CORPO BRUTO AQUI
    const buf = await buffer(req);

    // 4. VERIFICAÇÃO DE SEGURANÇA (Agora usando o Buffer 'buf' em vez de 'req.body')
    event = stripe.webhooks.constructEvent(
      buf, 
      sig, 
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error(`❌ Erro na assinatura do Webhook: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;

    try {
      const userId = session.metadata?.userId;
      
      if (!userId) {
        throw new Error("ID do usuário não encontrado nos metadados da sessão.");
      }

      // Lógica de tempo (R$ 199,90 = Anual, R$ 19,90 = Mensal)
      const isAnnual = session.amount_total > 10000; 
      const daysToAdd = isAnnual ? 365 : 30;

      const newExpiryDate = new Date();
      newExpiryDate.setDate(newExpiryDate.getDate() + daysToAdd);

      // Atualiza o perfil no Supabase (Coluna trialEndsAt conforme sua tabela)
      const { error } = await supabase
        .from('profiles')
        .update({ 
          plan_status: 'pro',
          trialEndsAt: newExpiryDate.toISOString() 
        })
        .eq('id', userId);

      if (error) throw error;

      console.log(`✅ SUCESSO: Usuário ${userId} ativado como PRO até ${newExpiryDate.toLocaleDateString()}.`);
      
    } catch (error) {
      console.error('❌ Erro ao atualizar Supabase via Webhook:', error.message);
      return res.status(500).json({ error: error.message });
    }
  }

  res.status(200).json({ received: true });
}
