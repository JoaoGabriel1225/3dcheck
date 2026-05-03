import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { getAIResponse } from '@/lib/aiService';
import { 
  Send, 
  Bot, 
  User as UserIcon, 
  Mail, 
  Bell,
  MessageCircle
} from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function Support() {
  const { user } = useAuth();
  const [chatMessages, setChatMessages] = useState<Message[]>([
    { role: 'assistant', content: `Olá, Maker! Eu sou o assistente do 3DCheck. Como posso ajudar seu negócio hoje? 🚀` }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => { 
    if (user) {
      const subscription = supabase
        .channel('user_support_channel')
        .on('postgres_changes', { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'support_tickets',
          filter: `user_id=eq.${user.id}` 
        }, (payload) => {
          if (payload.new.has_unread_reply) {
            toast.info("O Desenvolvedor respondeu seu chamado!", { icon: <Bell className="text-blue-500" /> });
          }
        })
        .subscribe();
      return () => { supabase.removeChannel(subscription); };
    }
  }, [user]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [chatMessages, isTyping]);

  const handleChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;

    const userMsg = input.trim();
    setInput('');
    setChatMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsTyping(true);

    try {
      const response = await getAIResponse(userMsg, chatMessages);
      setChatMessages(prev => [...prev, { role: 'assistant', content: response }]);
    } catch (error) {
      toast.error("Erro na conexão com a IA.");
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-8 space-y-10 pb-20">
      <header className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h2 className="text-3xl font-black uppercase italic tracking-tighter text-foreground">
            Suporte <span className="text-blue-500">Inteligente</span>
          </h2>
          <p className="text-muted-foreground font-medium text-[10px] uppercase tracking-widest opacity-60">
            Respostas instantâneas e contato direto
          </p>
        </div>
      </header>

      <Card className="bg-card/40 backdrop-blur-xl border-border p-6 h-[600px] flex flex-col rounded-[2.5rem] shadow-2xl relative">
        <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-6 pr-4 custom-scrollbar">
          {chatMessages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2`}>
              <div className={`max-w-[85%] flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-lg ${msg.role === 'assistant' ? 'bg-blue-600 text-white' : 'bg-muted border border-border'}`}>
                  {msg.role === 'assistant' ? <Bot className="w-5 h-5" /> : <UserIcon className="w-5 h-5" />}
                </div>
                <div className={`p-5 rounded-[1.5rem] text-sm font-medium leading-relaxed ${msg.role === 'assistant' ? 'bg-muted/50 border border-border rounded-tl-none' : 'bg-blue-600 text-white rounded-tr-none shadow-xl'}`}>
                  {msg.content}
                </div>
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex gap-4 justify-start animate-pulse">
              <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center text-white">
                <Bot className="w-5 h-5" />
              </div>
              <div className="bg-muted/50 p-5 rounded-[1.5rem] rounded-tl-none flex gap-1">
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" />
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:0.2s]" />
              </div>
            </div>
          )}
        </div>

        {chatMessages.length > 2 && (
          <div className="flex flex-col items-center gap-3 mb-4 animate-in zoom-in-95 duration-300">
            <p className="text-[10px] font-black uppercase italic text-muted-foreground opacity-70 text-center">
              Não resolveu? Fale diretamente com o Desenvolvedor:
            </p>
            <div className="flex gap-3">
              <Button 
                asChild
                variant="outline" 
                className="rounded-full border-green-500/20 text-[10px] font-black uppercase italic text-green-600 h-9 px-6 hover:bg-green-500 hover:text-white transition-all shadow-xl"
              >
                <a 
                  href="https://wa.me/5521994394315?text=Olá%2C+estou+no+suporte+do+3DCheck+e+preciso+de+ajuda." 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  WhatsApp <MessageCircle className="w-3 h-3 ml-2" />
                </a>
              </Button>

              <Button 
                asChild
                variant="outline" 
                className="rounded-full border-blue-500/20 text-[10px] font-black uppercase italic text-blue-500 h-9 px-6 hover:bg-blue-500 hover:text-white transition-all shadow-xl"
              >
                {/* Ajuste no link de e-mail */}
                <a 
                  href="mailto:3dcheck.oficial@gmail.com?subject=Suporte%203DCheck"
                  rel="noopener noreferrer"
                >
                  E-mail <Mail className="w-3 h-3 ml-2" />
                </a>
              </Button>
            </div>
          </div>
        )}

        <form onSubmit={handleChat} className="mt-4 relative">
          <Input 
            value={input} 
            onChange={(e) => setInput(e.target.value)} 
            placeholder="Pergunte sobre filamentos, vitrine, planos..." 
            className="h-16 pl-6 pr-20 rounded-2xl bg-background border-border shadow-2xl font-bold italic" 
          />
          <Button 
            type="submit" 
            disabled={!input.trim() || isTyping} 
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl bg-blue-600 hover:bg-blue-500 w-12 h-12 shadow-lg shadow-blue-600/20"
          >
            <Send className="w-5 h-5" />
          </Button>
        </form>
      </Card>
    </div>
  );
}
