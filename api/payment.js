import { MercadoPagoConfig, Payment } from 'mercadopago';

const ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido.' });
  }

  // Recebemos o email direto do body também, como garantia
  const { formData, userId, planType, email } = req.body;

  try {
    const client = new MercadoPagoConfig({ accessToken: ACCESS_TOKEN });
    const payment = new Payment(client);

    const unitPrice = planType === 'annual' ? 199.90 : 19.90;

    // Criamos o objeto de pagamento de forma limpa
    const result = await payment.create({
      body: {
        transaction_amount: Number(unitPrice),
        description: `3DCheck Plano Pro - ${planType === 'annual' ? 'Anual' : 'Mensal'}`,
        payment_method_id: formData.payment_method_id,
        // Só envia o token se ele existir (essencial para não quebrar o Pix)
        ...(formData.token && { token: formData.token }),
        installments: formData.installments ? Number(formData.installments) : 1,
        payer: {
          // Fallback de email caso o formData venha incompleto
          email: formData.payer?.email || email,
          identification: formData.payer?.identification,
        },
        external_reference: `${userId}:${planType}`,
        notification_url: "https://3dcheck-eight.vercel.app/api/webhooks/mercadopago",
      },
    });

    return res.status(200).json({
      status: result.status,
      status_detail: result.status_detail,
      id: result.id,
      point_of_interaction: result.point_of_interaction
    });

  } catch (error) {
    console.error('Erro no processamento:', error);
    return res.status(500).json({ 
      error: 'Falha ao processar pagamento',
      message: error.message 
    });
  }
}
