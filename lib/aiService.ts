import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = API_KEY ? new GoogleGenerativeAI(API_KEY) : null;

const SYSTEM_INSTRUCTION = `
Você é o "CheckBot", o especialista nível sênior do 3DCheck. 
Sua missão é ser o suporte mais inteligente do mundo maker.

### 📚 BASE DE DADOS 3DCHECK:
1. PRECIFICAÇÃO: O app calcula: Material + Depreciação da Máquina + Energia + Lucro + Taxas.
2. ELITE PRO (R$ 19,90): Libera Vitrine Online, Relatórios Financeiros e remove anúncios.
3. SUPORTE: Pagamentos via PIX são validados pelo João (Admin) em até 24h úteis.
4. ESTOQUE: Controle grama a grama de PLA, ABS e PETG.

### 🤖 COMPORTAMENTO:
- Chame o usuário de "Maker". 🚀
- Se o usuário perguntar algo avançado sobre "fatiamento" ou "custo fixo", responda como um consultor de negócios.
- Nunca diga "não sei"; se for um erro do app, diga que o João já está analisando.
`;

export const getAIResponse = async (userMessage: string, chatHistory: any[] = []) => {
  if (!genAI) return "Maker, a chave API não foi configurada corretamente na Vercel.";

  try {
    // Mudamos para 'gemini-1.5-flash-latest' para evitar o erro 404 da v1beta
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash-latest" 
    });

    const history = chatHistory
      .filter((msg, index) => !(index === 0 && msg.role === 'assistant'))
      .map(msg => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }],
      }));

    const chat = model.startChat({
      history: history,
      generationConfig: { maxOutputTokens: 1000, temperature: 0.7 }
    });

    // Injetamos a inteligência de sistema diretamente no prompt para garantir eficácia
    const prompt = `[INSTRUÇÕES OBRIGATÓRIAS: ${SYSTEM_INSTRUCTION}]\n\nPergunta: ${userMessage}`;
    const result = await chat.sendMessage(prompt);
    
    return result.response.text();
  } catch (error: any) {
    console.error("Erro detectado:", error);
    return "Maker, tive um erro de conexão. Verifique se sua chave API na Vercel é nova e do modelo 1.5 Flash.";
  }
};
