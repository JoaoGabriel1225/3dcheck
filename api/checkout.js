import { MercadoPagoConfig, Preference } from 'mercadopago';

// ⚠️ IMPORTANTE: Cole o seu Access Token (começa com APP_USR) aqui
const ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN;
export default async function handler(req, res) {
  // A Vercel só permite requisições POST para criar o checkout
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido.' });
  }

  const { userId, email } = req.body;

  try {
    const client = new MercadoPagoConfig({ accessToken: ACCESS_TOKEN });
    const preference = new Preference(client);

    const result = await preference.create({
      body: {
        items: [
          {
            id: 'pro-monthly',
            title: '3DCheck Plano Pro - Acesso Completo',
            quantity: 1,
            unit_price: 19.90, 
            currency_id: 'BRL'
          }
        ],
        payer: { email: email },
        // Enviando o ID do usuário para sabermos quem pagou
        external_reference: userId, 
        back_urls: {
          success: 'https://3dcheck-eight.vercel.app/app/dashboard', 
          failure: 'https://3dcheck-eight.vercel.app/app/billing'
        },
        auto_return: 'approved',
      }
    });

    // Retorna a URL segura de checkout
    return res.status(200).json({ init_point: result.init_point });

  } catch (error) {
    console.error('Erro ao gerar checkout:', error);
    return res.status(500).json({ error: 'Falha ao criar o pagamento.' });
  }
}
