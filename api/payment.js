import Stripe from 'stripe';

// Inicializa o Stripe com a sua chave secreta que já está no Vercel
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  // O tutorial original usa o método POST para criar sessões
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const { priceId, userId, email } = req.body;

  // Validação básica para evitar erros de execução
  if (!priceId || !userId || !email) {
    return res.status(400).json({ error: 'Informações de checkout incompletas.' });
  }

  try {
    // Tradução da lógica 'Stripe::Checkout::Session.create' para JavaScript
    const session = await stripe.checkout.sessions.create({
      // Define o modo como assinatura para planos recorrentes (mensal/anual)
      mode: 'subscription', 
      
      // Ativa as formas de pagamento que o público brasileiro mais usa
      payment_method_types: ['card', 'pix'],
      
      // Define o item que está sendo assinado com base no ID do produto[cite: 1]
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      
      // Pré-preenche o e-mail do usuário no formulário da Stripe
      customer_email: email,
      
      // O campo metadata é crucial: ele guarda o ID do usuário para o Webhook ler depois[cite: 1]
      metadata: {
        userId: userId,
      },

      // URLs de retorno seguindo o padrão de redirecionamento do tutorial[cite: 1]
      success_url: `https://3dcheck-eight.vercel.app/app/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `https://3dcheck-eight.vercel.app/app/billing`,
    });

    // Em vez de redirecionar direto pelo servidor (como no Ruby), 
    // enviamos a URL para o seu React fazer o redirecionamento[cite: 1]
    return res.status(200).json({ url: session.url });

  } catch (error) {
    // Tratamento de erro similar ao resgate (rescue) do código original[cite: 1]
    console.error('Erro na sessão do Stripe:', error);
    return res.status(500).json({ 
      error: 'Erro ao criar sessão de pagamento', 
      message: error.message 
    });
  }
}
