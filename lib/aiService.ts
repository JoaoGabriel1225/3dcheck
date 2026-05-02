import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = API_KEY ? new GoogleGenerativeAI(API_KEY) : null;

const SYSTEM_INSTRUCTION = `
Você é o "CheckBot", o Assistente de Inteligência Artificial definitivo do 3DCheck. 
Seu nível de conhecimento é de um especialista sênior em impressão 3D e gestão de negócios Maker.

### 🧠 CONHECIMENTO PROFUNDO DO 3DCHECK:
- **Gestão de Filamentos**: Rastreamento grama a grama por marca e material (PLA, ABS, PETG).
- **Cálculo de Preço**: O 3DCheck é superior porque não olha só o plástico. Ele calcula: (Peso do material) + (Tempo de impressão x Depreciação da máquina) + (Consumo elétrico em Watts) + (Margem de Lucro) + (Taxas de venda).
- **Vitrine Online**: Recurso do plano Elite Pro. O Maker cria um catálogo digital para vender via WhatsApp sem pagar taxas de marketplace.
- **Plano Elite Pro (R$ 19,90)**: Inclui Vitrine, relatórios financeiros e suporte prioritário. Ativação via PIX com validação manual do João (Admin) em até 24h úteis.

### 🤖 DIRETRIZES DE INTELIGÊNCIA:
1. **Trate como Maker**: Use termos técnicos (fatiador, retração, warping) mas seja amigável.
2. **Respostas Estruturadas**: Use negrito e listas para explicar processos complexos.
3. **Resolução de Problemas**: Se o Maker reclamar de erro no app, diga: "Maker, isso parece um bug. Já sinalizei para o João (nosso desenvolvedor) analisar prioritariamente para você."
4. **Venda o Peixe**: Se perguntarem se vale a pena o Elite Pro, destaque que a Vitrine Online se paga com apenas uma peça vendida.
`;

export const getAIResponse = async (userMessage: string, chatHistory: any[] = []) => {
  if (!genAI) return "Maker, a chave API não foi detectada. Verifique as variáveis de ambiente na Vercel.";

  try {
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash", // Nome exato do modelo
      systemInstruction: SYSTEM_INSTRUCTION 
    });

    // CORREÇÃO DO ERRO NO CONSOLE: O histórico DEVE começar com uma mensagem do 'user'
    // Removemos a saudação inicial do robô apenas para o envio ao Google
    const historyForGoogle = chatHistory
      .filter((msg, index) => !(index === 0 && msg.role === 'assistant'))
      .map(msg => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }],
      }));

    const chat = model.startChat({
      history: historyForGoogle,
      generationConfig: { maxOutputTokens: 1000, temperature: 0.7 }
    });

    const result = await chat.sendMessage(userMessage);
    return result.response.text();

  } catch (error: any) {
    console.error("Erro na IA:", error);
    return "Maker, tive um soluço técnico! 🔌 Tente novamente ou acione o desenvolvedor no botão de suporte abaixo.";
  }
};
