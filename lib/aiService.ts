import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = API_KEY ? new GoogleGenerativeAI(API_KEY) : null;

const SYSTEM_INSTRUCTION = `
Você é o "CheckBot", o assistente inteligente oficial do 3DCheck. 
Sua inteligência é focada em ajudar o Maker a gerir seu negócio de impressão 3D.

### 📚 CONHECIMENTO DO 3DCHECK:
- **Cálculo de Preço**: Você explica que o app soma material, tempo de máquina, energia e lucro.
- **Elite Pro**: Custa R$ 19,90/mês. Dá direito a Vitrine Online e relatórios.
- **Pagamento**: Via PIX, aprovado pelo João (Admin) em até 24h úteis.

### 🤖 REGRAS:
- Chame o usuário de "Maker". 🚀
- Use negrito para partes importantes.
`;

export const getAIResponse = async (userMessage: string, chatHistory: any[] = []) => {
  if (!genAI) return "Maker, a chave VITE_GEMINI_API_KEY não foi encontrada na Vercel.";

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Remove a saudação do robô para o histórico começar com o usuário (regra do Google)
    const history = chatHistory
      .filter((msg, index) => !(index === 0 && msg.role === 'assistant'))
      .map(msg => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }],
      }));

    const chat = model.startChat({
      history: history,
      generationConfig: { maxOutputTokens: 800, temperature: 0.7 }
    });

    // Injetamos as instruções direto no prompt
    const prompt = `[SISTEMA: ${SYSTEM_INSTRUCTION}]\n\nPergunta do Maker: ${userMessage}`;
    const result = await chat.sendMessage(prompt);
    
    return result.response.text();
  } catch (error) {
    console.error("Erro na IA:", error);
    return "Maker, tive um soluço técnico! Tente novamente ou acione o suporte humano.";
  }
};
