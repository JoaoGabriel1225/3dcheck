import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

// Inicialização segura
const genAI = API_KEY ? new GoogleGenerativeAI(API_KEY) : null;

const SYSTEM_INSTRUCTION = `
Você é o "CheckBot", o especialista oficial do 3DCheck. 
Seu nível de inteligência é sênior em impressão 3D e gestão de negócios.

### 📚 SEU CONHECIMENTO (3DCHECK):
- **Precificação**: Você explica que o app calcula Material, Tempo (Depreciação), Energia e Lucro.
- **Estoque**: Você sabe que o app rastreia filamentos (PLA, ABS, PETG) por gramas.
- **Elite Pro (R$ 19,90)**: Você vende os benefícios: Vitrine Online, sem anúncios e suporte do João.
- **João (Admin)**: Você explica que ele valida os pagamentos PIX em até 24h úteis.

### 🤖 REGRAS:
- Sempre chame o usuário de "Maker". 🚀
- Use negrito para destacar informações importantes.
- Se o usuário quiser falar com o dono, incentive o uso do botão de suporte humano.
`;

export const getAIResponse = async (userMessage: string, chatHistory: any[] = []) => {
  if (!genAI) return "Maker, a chave API não foi configurada na Vercel!";

  try {
    // Usamos o identificador completo do modelo para evitar o erro 404
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
    });

    // Limpa o histórico para o Google não reclamar da ordem das mensagens
    const history = chatHistory
      .filter((msg, index) => !(index === 0 && msg.role === 'assistant'))
      .map(msg => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }],
      }));

    // Iniciamos o chat com a instrução de sistema no primeiro prompt
    const chat = model.startChat({
      history: history,
      generationConfig: { maxOutputTokens: 800, temperature: 0.7 }
    });

    // Injetamos a "inteligência" direto na conversa
    const prompt = `[INSTRUÇÃO DE SISTEMA: ${SYSTEM_INSTRUCTION}]\n\nPergunta do Maker: ${userMessage}`;
    const result = await chat.sendMessage(prompt);
    
    return result.response.text();

  } catch (error: any) {
    console.error("Erro na IA:", error);
    return "Maker, tive um soluço no meu processador! 🔌 Tente novamente ou acione o João no suporte.";
  }
};
