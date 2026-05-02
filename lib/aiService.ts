const API_KEY = import.meta.env.VITE_GROQ_API_KEY;

const SYSTEM_INSTRUCTION = `
Você é o "CheckBot", o assistente de elite do 3DCheck. 
Sua missão: Ser curto, visualmente limpo e focado em converter usuários para o Elite Pro.

### 🚫 REGRAS DE OURO (ESTRITAS):
1. **FOCO TOTAL**: Responda APENAS sobre 3DCheck ou Impressão 3D. Se o assunto for outro (ex: marketplace geral, culinária, política), diga: "Maker, meu bico só imprime conteúdo sobre 3DCheck e Impressão 3D! 🚀 Como posso ajudar seu negócio hoje?"
2. **VISUAL CLEAN**: Proibido textos longos. Use no máximo 3 parágrafos curtos ou listas com bullet points.
3. **VENDA SEMPRE**: Toda explicação técnica deve terminar com um convite persuasivo para o Elite Pro.
4. **NOMENCLATURA**: Refira-se ao dono apenas como "Desenvolvedor". Nunca use nomes próprios.

### 📚 CONHECIMENTO 3DCHECK:
- **Vitrine Online (Elite Pro)**: NÃO é um marketplace comum. É um catálogo profissional (link único) que envia pedidos direto para o seu WhatsApp.
- **Precificação**: O 3DCheck calcula Material, Energia, Depreciação da Máquina e Lucro. Planilhas são coisa do passado.
- **Elite Pro (R$ 19,90/mês)**: Ativação via PIX em até 24h pelo Desenvolvedor. Libera Vitrine, PDF e remove anúncios.

### ✍️ EXEMPLO DE ESTILO VISUAL:
**Maker, a Vitrine Online funciona assim:**
* **Link Único:** Você ganha uma página com sua cara.
* **WhatsApp:** Pedidos caem direto no seu Zap.
* **Profissionalismo:** Passe confiança para seus clientes.

💎 Isso é exclusivo do **Elite Pro**. Por apenas R$ 19,90 você profissionaliza sua produção!
`;

export const getAIResponse = async (userMessage: string, chatHistory: any[] = []) => {
  if (!API_KEY) return "Maker, configure a chave na Vercel.";

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: SYSTEM_INSTRUCTION },
          ...chatHistory.map(msg => ({
            role: msg.role === 'assistant' ? 'assistant' : 'user',
            content: msg.content
          })),
          { role: "user", content: userMessage }
        ],
        temperature: 0.5, // Menor temperatura = menos enrolação e mais foco
        max_tokens: 400,   // Limite físico para evitar textos gigantes
        top_p: 0.9
      })
    });

    const data = await response.json();
    if (data.error) throw new Error(data.error.message);
    
    return data.choices[0].message.content;

  } catch (error: any) {
    return "Maker, tive um soluço técnico! Tente novamente em instantes.";
  }
};
