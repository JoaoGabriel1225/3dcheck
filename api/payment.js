import Stripe from 'stripe';

export default async function handler(req, res) {
  // Garantimos que apenas o método POST seja aceito como no tutorial original[cite: 1]
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const { priceId, userId, email } = req.body;

  // Validação para evitar que a API tente processar dados vazios
  if (!priceId || !userId || !email) {
    return res.status(400).json({ error: 'Informações de checkout incompletas (priceId, userId ou email ausentes).' });
  }

  try {
    // Verificamos se a chave secreta existe antes de inicializar para evitar crash do servidor
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error("A variável de ambiente STRIPE_SECRET_KEY não foi encontrada no Vercel.");
    }

    // Inicializamos o Stripe dentro do handler para maior segurança[cite: 1]
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    // Criação da sessão de checkout conforme o padrão do tutorial[cite: 1]
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription', // Define como pagamento recorrente[cite: 1]
      payment_method_types: ['card', 'pix'], // Ativa Pix e Cartão para o Brasil
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      customer_email: email,
      metadata: {
        userId: userId, // Vincula a transação ao seu usuário no Supabase[cite: 1]
      },
      success_url: `https://3dcheck-eight.vercel.app/app/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `https://3dcheck-eight.vercel.app/app/billing`,
    });

    // Retorna a URL da Stripe para o seu Billing.tsx fazer o redirecionamento[cite: 1]
    return res.status(200).json({ url: session.url });

  } catch (error) {
    console.error('Erro na API Stripe:', error.message);
    return res.status(500).json({ 
      error: 'Erro interno no servidor de pagamento', 
      message: error.message 
    });
  }
}
