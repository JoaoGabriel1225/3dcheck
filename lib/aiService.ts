// Usaremos o fetch direto para não precisar instalar bibliotecas novas no GitHub
const API_KEY = import.meta.env.VITE_GROQ_API_KEY;

const SYSTEM_INSTRUCTION = `
Você é o "CheckBot", o assistente oficial do 3DCheck. 
Seu tom é amigável e focado em produtividade para o mundo Maker.

CONHECIMENTO:
- Precificação: Soma material, tempo de máquina, energia e lucro.
- Elite Pro: R$ 19,90/mês com Vitrine Online e relatórios.
- Pagamentos: Via PIX, aprovados pelo João (Admin) em até 24h úteis.

REGRAS: Sempre chame o usuário de "Maker". Use emojis como 🚀 e 🖨️.
`;

export const getAIResponse = async (userMessage: string, chatHistory: any[] = []) => {
  if (!API_KEY) return "Maker, a chave da Groq não foi configurada na Vercel.";

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile", // Um dos modelos mais inteligentes do mundo
        messages: [
          { role: "system", content: SYSTEM_INSTRUCTION },
          ...chatHistory.map(msg => ({
            role: msg.role === 'assistant' ? 'assistant' : 'user',
            content: msg.content
          })),
          { role: "user", content: userMessage }
        ],
        temperature: 0.7,
        max_tokens: 1000
      })
    });

    const data = await response.json();
    
    if (data.error) throw new Error(data.error.message);
    
    return data.choices[0].message.content;

  } catch (error: any) {
    console.error("Erro na Groq:", error);
    return "Maker, tive um soluço técnico! 🔌 Tente novamente ou acione o suporte humano.";
  }
};
