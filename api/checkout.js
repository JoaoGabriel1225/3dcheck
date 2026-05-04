import { MercadoPagoConfig, Payment } from 'mercadopago';

const ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN;

export default async function handler(req, res) {
  // Garante que apenas requisições POST sejam aceitas
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido.' });
  }

  const { formData, userId, planType } = req.body;

  try {
    const client = new MercadoPagoConfig({ accessToken: ACCESS_TOKEN });
    const payment = new Payment(client);

    // Define o valor exato para evitar erros de arredondamento
    const unitPrice = planType === 'annual' ? 199.90 : 19.90;

    const paymentBody = {
      transaction_amount: Number(unitPrice),
      description: `3DCheck Plano Pro - ${planType === 'annual' ? 'Anual' : 'Mensal'}`,
      payment_method_id: formData.payment_method_id,
      token: formData.token,
      // Correção do erro de installments: Garantimos que seja um número ou 1 para Pix
      installments: formData.installments ? Number(formData.installments) : 1,
      payer: {
        email: formData.payer.email,
        // O identification é obrigatório para alguns métodos de pagamento
        identification: formData.payer.identification,
      },
      // Referência para o seu Webhook identificar o usuário e o plano
      external_reference: `${userId}:${planType}`,
      notification_url: "https://3dcheck-eight.vercel.app/api/webhooks/mercadopago",
    };

    const result = await payment.create({ body: paymentBody });

    // Retorna a resposta para o front-end processar o QR Code ou confirmação
    return res.status(200).json({
      status: result.status,
      status_detail: result.status_detail,
      id: result.id,
      point_of_interaction: result.point_of_interaction
    });

  } catch (error) {
    console.error('Erro no processamento do pagamento:', error);
    return res.status(500).json({ 
      error: 'Falha ao processar pagamento',
      message: error.message 
    });
  }
}
