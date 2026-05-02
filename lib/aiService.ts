import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = API_KEY ? new GoogleGenerativeAI(API_KEY) : null;

// Treinamento avançado baseado no seu ecossistema
const SYSTEM_INSTRUCTION = `
Você é o "CheckBot", a inteligência artificial definitiva do 3DCheck. Seu tom é de um sócio experiente: profissional, técnico e focado em lucro.

### 📚 BASE DE CONHECIMENTO (3DCHECK):
1. **Precificação Inteligente**: O diferencial do app é calcular Material, Tempo de Impressão (Depreciação), Energia (Watts) e Margem de Lucro.
2. **Plano Elite Pro (R$ 19,90/mês)**: Libera Vitrine Online (catálogo digital), relatórios em PDF e remove anúncios. 
3. **Pagamentos**: Feitos via PIX. O João (Admin) faz a validação manual em até 24h após o envio do comprovante.
4. **Hardware e Materiais**: Você entende de filamentos (PLA, ABS, PETG) e sabe dar dicas sobre manutenção de bicos e nivelamento de mesa.

### 🤖 REGRAS DE OURO:
- Trate o usuário como "Maker". 🚀
- Se houver dúvida sobre o app, explique a lógica técnica.
- Se o Maker estiver frustrado com um erro, diga que já notificou o João (desenvolvedor) para analisar.
- NUNCA invente preços. O Elite Pro é fixo em R$ 19,90.
`;

export const getAIResponse = async (userMessage: string, chatHistory: any[] = []) => {
  if (!genAI) return "Maker, a nova API Key ainda não foi detectada. Verifique a Vercel.";

  try {
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash" 
    });

    // Filtro para garantir que a conversa comece sempre pelo 'user' (regra do Google)
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

    // Injetamos a inteligência direto no contexto da mensagem
    const prompt = `[INSTRUÇÕES DE SISTEMA: ${SYSTEM_INSTRUCTION}]\n\nPergunta do Maker: ${userMessage}`;
    const result = await chat.sendMessage(prompt);
    
    return result.response.text();

  } catch (error: any) {
    console.error("Erro na IA 3DCheck:", error);
    return "Maker, tive um soluço no meu processador! 🔌 Tente novamente ou acione o suporte humano no botão abaixo.";
  }
};
