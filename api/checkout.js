import { MercadoPagoConfig, Preference } from 'mercadopago';

const ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido.' });
  }

  const { userId, email, planType } = req.body;

  try {
    const client = new MercadoPagoConfig({ accessToken: ACCESS_TOKEN });
    const preference = new Preference(client);

    // Lógica de definição de preço e título
    let unitPrice = 19.90;
    let title = '3DCheck Plano Pro - Mensal';
    let planId = 'pro-monthly';

    if (planType === 'annual') {
      unitPrice = 199.90;
      title = '3DCheck Plano Pro - Anual (Acesso 1 Ano)';
      planId = 'pro-annual';
    }

    const result = await preference.create({
      body: {
        items: [
          {
            id: planId,
            title: title,
            quantity: 1,
            unit_price: unitPrice, 
            currency_id: 'BRL'
          }
        ],
        payer: { email: email },
        external_reference: `${userId}:${planType}`, 
        
        // --- INÍCIO DO AJUSTE SANC PARA FORÇAR PIX ---
        payment_methods: {
          excluded_payment_types: [], // Garante que nenhum método (Pix, Boleto, etc.) seja bloqueado
          installments: 12, // Permite parcelamento no cartão em até 12x
          default_payment_method_id: null
        },
        // --- FIM DO AJUSTE ---

        back_urls: {
          success: 'https://3dcheck-eight.vercel.app/app/dashboard', 
          failure: 'https://3dcheck-eight.vercel.app/app/billing'
        },
        auto_return: 'approved',
      }
    });

    return res.status(200).json({ init_point: result.init_point });

  } catch (error) {
    console.error('Erro ao gerar checkout:', error);
    return res.status(500).json({ error: 'Falha ao criar o pagamento.' });
  }
}
