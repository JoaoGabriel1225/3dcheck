import Stripe from 'stripe';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' });

  const { priceId, userId, email } = req.body;

  try {
    // Verificação de segurança da chave
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error("A chave STRIPE_SECRET_KEY não foi encontrada nas variáveis da Vercel.");
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription', 
      // DICA: Se o erro persistir, tente remover 'pix' da lista abaixo temporariamente para testar
      payment_method_types: ['card', 'pix'], 
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: email,
      metadata: { userId },
      success_url: `https://3dcheck-eight.vercel.app/app/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `https://3dcheck-eight.vercel.app/app/billing`,
    });

    return res.status(200).json({ url: session.url });

  } catch (error) {
    // Isso vai mostrar o erro real da Stripe no seu console do F12 agora!
    console.error('ERRO DETALHADO DA STRIPE:', error.message);
    return res.status(500).json({ 
      error: 'Erro na Stripe', 
      message: error.message 
    });
  }
}
