import Stripe from 'stripe';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' });

  const { priceId, userId, email } = req.body;

  // Validação extra para termos certeza que os dados estão vindo do Billing.tsx
  if (!priceId || !userId || !email) {
    return res.status(400).json({ error: `Dados incompletos: priceId=${priceId}, userId=${userId}, email=${email}` });
  }

  try {
    // Verifica se a chave secreta foi configurada
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error("A chave STRIPE_SECRET_KEY não foi encontrada no Vercel.");
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      automatic_payment_methods: { enabled: true },
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: email,
      metadata: { userId },
      success_url: `https://3dcheck-eight.vercel.app/app/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `https://3dcheck-eight.vercel.app/app/billing`,
    });

    return res.status(200).json({ url: session.url });

  } catch (error) {
    // IMPORTANTE: Agora enviamos a mensagem REAL do erro para o seu navegador
    console.error('Erro detalhado:', error.message);
    return res.status(500).json({ error: error.message });
  }
}
