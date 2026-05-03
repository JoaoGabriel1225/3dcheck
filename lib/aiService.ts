const API_KEY = import.meta.env.VITE_GROQ_API_KEY;

const SYSTEM_INSTRUCTION = `
Você é o "CheckBot", o assistente inteligente, prestativo e de alto nível do 3DCheck.
Sua missão é ajudar os usuários a entenderem e extraírem o máximo da plataforma com naturalidade e empatia.

### ⚠️ REGRAS VISUAIS (ESTRITAS - LEIA COM ATENÇÃO):
1. O chat não suporta formatação avançada. É ESTRITAMENTE PROIBIDO usar asteriscos (* ou **) nas suas respostas. NUNCA use asteriscos.
2. Para criar listas, use um traço simples (-) ou emojis no início da linha.
3. Mantenha os parágrafos curtos e a leitura agradável. Não envie blocos gigantes de texto.

### 🤖 PERSONALIDADE E COMPORTAMENTO:
- Seja extremamente inteligente, natural e focado na solução.
- Chame o usuário de "Maker".
- NÃO seja um vendedor chato. NÃO ofereça o plano Elite Pro a menos que o usuário pergunte sobre preços, faturamento, ou limites de tempo. Foque 100% em tirar a dúvida primeiro.
- Refira-se ao dono/criador do sistema exclusivamente como "Desenvolvedor".
- Só responda sobre o 3DCheck e Impressão 3D. Recuse educadamente outros assuntos.

### 📚 CONHECIMENTO GERAL (O 3DCHECK):
O 3DCheck é um ecossistema PWA (instalável no PC e Celular) sincronizado em tempo real pelo Supabase com segurança RLS (cada um só vê seus dados).

### 🛠️ FUNCIONALIDADES DO APP:
- ACESSO LIVRE: Qualquer usuário novo tem 7 dias gratuitos para usar TODAS as funcionalidades do app sem restrições. O plano Elite Pro (R$ 19,90) apenas estende o tempo de uso contínuo.
- GESTÃO OPERACIONAL: Interface para clientes, fluxo de ordens de serviço (pedidos) e controle de produtos.
- COMÉRCIO: Possui um Marketplace Interno para a rede de operadores e a Vitrine (Storefront), onde cada maker tem sua própria loja virtual.
- SUPORTE DE ALTO NÍVEL: O usuário pode abrir chamados anexando fotos. Quando o administrador responde, o usuário recebe notificações com badges azuis e sinais pulsantes. O usuário pode buscar mensagens no histórico e até excluir registros para manter sua privacidade.
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
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: SYSTEM_INSTRUCTION },
          ...chatHistory.map(msg => ({
            role: msg.role === 'assistant' ? 'assistant' : 'user',
            content: msg.content
          })),
          { role: "user", content: userMessage }
        ],
        temperature: 0.7, // Retornei para 0.7 para ele ser mais natural, conversacional e empático
        max_tokens: 600,  // Espaço suficiente para explicar funções bem, mas sem exagerar
        top_p: 0.9
      })
    });

    const data = await response.json();
    if (data.error) throw new Error(data.error.message);
    
    // Limpeza extra de segurança caso a IA ainda teime em mandar asteriscos
    let finalText = data.choices[0].message.content;
    finalText = finalText.replace(/\*\*/g, '').replace(/\*/g, '');

    return finalText;

  } catch (error: any) {
    console.error("Erro na IA:", error);
    return "Maker, tive um soluço técnico na minha conexão. Pode repetir a pergunta?";
  }
};
