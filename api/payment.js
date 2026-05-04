import Stripe from 'stripe';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' });

  const { priceId, userId, email } = req.body;

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription', // Define como assinatura recorrente[cite: 1]
      // ESSA É A MUDANÇA: Ativa o que estiver disponível no seu painel[cite: 1]
      automatic_payment_methods: {
        enabled: true,
      },
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: email,
      metadata: { userId },
      success_url: `https://3dcheck-eight.vercel.app/app/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `https://3dcheck-eight.vercel.app/app/billing`,
    });

    return res.status(200).json({ url: session.url });

  } catch (error) {
    console.error('Erro na Stripe:', error.message);
    return res.status(500).json({ error: 'Erro interno', message: error.message });
  }
}
