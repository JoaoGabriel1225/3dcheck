import Stripe from 'stripe';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' });

  const { priceId, userId, email } = req.body;

  try {
    // Inicialização da Stripe com a sua Secret Key (sk_test_...)
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      // CORREÇÃO: Substituímos o parâmetro problemático por payment_method_types.
      // Isso resolve o erro de "parâmetro desconhecido" e foca no que já está ativo na sua conta.
      payment_method_types: ['card'], 
      line_items: [{ 
        price: priceId, // Agora usando o seu price_... correto que você encontrou
        quantity: 1 
      }],
      customer_email: email,
      metadata: { userId },
      success_url: `https://3dcheck-eight.vercel.app/app/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `https://3dcheck-eight.vercel.app/app/billing`,
    });

    // Retorna a URL para o redirecionamento no front-end
    return res.status(200).json({ url: session.url });

  } catch (error) {
    // Envia o erro exato para o console do seu navegador para debug
    console.error('Erro na Stripe:', error.message);
    return res.status(500).json({ error: error.message });
  }
}
