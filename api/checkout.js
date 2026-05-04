import { MercadoPagoConfig, Payment } from 'mercadopago';

const ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido.' });
  }

  // O Checkout Bricks envia os dados dentro de 'formData'
  const { formData, userId, planType } = req.body;

  try {
    const client = new MercadoPagoConfig({ accessToken: ACCESS_TOKEN });
    const payment = new Payment(client);

    // Definimos o valor com base no plano selecionado no front-end
    const unitPrice = planType === 'annual' ? 199.90 : 19.90;

    const paymentBody = {
      body: {
        transaction_amount: unitPrice,
        description: `3DCheck Plano Pro - ${planType === 'annual' ? 'Anual' : 'Mensal'}`,
        payment_method_id: formData.payment_method_id,
        token: formData.token, // Necessário para Cartão de Crédito
        installments: formData.installments,
        payer: {
          email: formData.payer.email,
          identification: formData.payer.identification,
        },
        // Mantemos a referência para o seu Webhook liberar o acesso
        external_reference: `${userId}:${planType}`,
        notification_url: "https://3dcheck-eight.vercel.app/api/webhooks/mercadopago",
      },
    };

    const result = await payment.create(paymentBody);

    // Retornamos o resultado completo para o Brick processar (Pix ou Cartão)
    return res.status(200).json({
      status: result.status,
      status_detail: result.status_detail,
      id: result.id,
      // Se for Pix, o Brick usará esses dados para exibir o QR Code automaticamente
      point_of_interaction: result.point_of_interaction
    });

  } catch (error) {
    console.error('Erro ao processar pagamento Bricks:', error);
    return res.status(500).json({ 
      error: 'Falha ao processar pagamento',
      message: error.message 
    });
  }
}
