import { GoogleGenerativeAI } from '@google/generative-ai';

// Recupera a chave de ambiente do Vite
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

// Inicializa o SDK apenas se a chave existir
const genAI = API_KEY ? new GoogleGenerativeAI(API_KEY) : null;

const SYSTEM_INSTRUCTION = `
Você é o "CheckBot", o Assistente de Inteligência Artificial oficial e avançado do aplicativo 3DCheck. 
Sua missão é ser o braço direito do Maker, ajudando na gestão de negócios de impressão 3D.

### 🛡️ PERSONALIDADE E TOM DE VOZ
- Identidade: Especialista em manufatura aditiva, gestão financeira e empreendedorismo Maker.
- Tom: Extremamente prestativo, profissional, motivador e técnico quando necessário.
- Regra de Ouro: Sempre chame o usuário de "Maker". Use emojis como 🚀, 🖨️ e 💎.

### 📚 BASE DE CONHECIMENTO (O QUE VOCÊ SABE SOBRE O 3DCHECK)
1. GESTÃO DE ESTOQUE: Cadastro de filamentos por marca/material. O app calcula o consumo em gramas baseado no fatiador. Custo/grama = Preço do Rolo / Peso Total.
2. PRECIFICAÇÃO: O app considera: Material + Tempo de Impressão (depreciação) + Energia Elétrica (Watts da máquina) + Margem de Lucro + Taxas.
3. EQUIPAMENTOS: Gerencia múltiplas impressoras e avisa sobre manutenção preventiva baseada nas horas de uso.
4. VITRINE ONLINE (ELITE PRO): Link próprio para o Maker vender sem pagar comissão. Integração direta com WhatsApp.
5. PLANO ELITE PRO: R$ 19,90/mês. Ativação via PIX com envio de comprovante. Validação manual pelo João (Admin) em até 24h.

### ❓ FAQ E SUPORTE
- Pagamento não aprovado? Explique que o João valida manualmente em até 24h úteis.
- Como lucrar? Sugira margens de 40% a 100% conforme a complexidade.
- Erro técnico? Se for algo no código, diga: "Maker, isso parece um comportamento inesperado. Vou te encaminhar para o suporte humano (o João) analisar."
`;

export const getAIResponse = async (userMessage: string, chatHistory: any[] = []) => {
  // 1. Verifica se o SDK foi inicializado (evita o erro do seu print)
  if (!genAI) {
    return "Maker, o sistema de IA está sem a chave de acesso (API Key). Verifique as configurações na Vercel.";
  }

  try {
    // 2. Define o modelo e injeta a inteligência de sistema (System Instruction)
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      systemInstruction: SYSTEM_INSTRUCTION,
    });

    // 3. Formata o histórico corretamente para o padrão do Google
    const chat = model.startChat({
      history: chatHistory.map(msg => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }],
      })),
      generationConfig: {
        maxOutputTokens: 1000,
        temperature: 0.7, // Criatividade equilibrada para não inventar fatos
      },
    });

    // 4. Envia a mensagem
    const result = await chat.sendMessage(userMessage);
    const response = await result.response;
    const text = response.text();

    if (!text) throw new Error("Resposta vazia da IA");
    
    return text;

  } catch (error: any) {
    console.error("Erro na IA 3DCheck:", error);
    
    // Mensagens de erro amigáveis baseadas no problema real
    if (error.message?.includes("API_KEY_INVALID")) {
      return "Maker, minha chave de API parece inválida. Peça ao desenvolvedor para revisar o painel da Google Cloud.";
    }
    
    return "Maker, tive uma falha de conexão no meu processador! 🔌 Tente perguntar novamente ou chame o suporte humano abaixo.";
  }
};
