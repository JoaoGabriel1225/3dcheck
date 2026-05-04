import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { getAIResponse } from '@/lib/aiService';
import { 
  Send, Bot, User as UserIcon, Mail, 
  Bell, MessageCircle, Sparkles, Circle
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

  // AÇÕES RÁPIDAS FOCADAS EM FUNCIONALIDADES 3DCHECK
  const quickActions = [
    "Como gerenciar meus pedidos?",
    "Como calcular o custo de impressão?",
    "Quais as vantagens do Plano Pro?"
  ];

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
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [chatMessages, isTyping]);

  const handleChat = async (userMsg: string) => {
    if (!userMsg.trim() || isTyping) return;

    setChatMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setInput('');
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
    <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-6 pb-20 overflow-hidden h-full flex flex-col">
      <header className="flex items-center justify-between animate-in fade-in slide-in-from-top-4 duration-700">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <h2 className="text-2xl md:text-3xl font-black uppercase italic tracking-tighter">
              Suporte <span className="text-blue-500 font-black">Inteligente</span>
            </h2>
            <div className="flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              <Circle className="w-1.5 h-1.5 fill-emerald-500 text-emerald-500 animate-pulse" />
              <span className="text-[8px] font-black uppercase text-emerald-600 tracking-tighter">IA Online</span>
            </div>
          </div>
          <p className="text-muted-foreground font-semibold text-[9px] uppercase tracking-widest opacity-60">
            3DCheck Ecosystem • Central de Ajuda
          </p>
        </div>
      </header>

      <Card className="bg-card/30 backdrop-blur-2xl border-border/50 flex-1 h-[60vh] md:h-[650px] flex flex-col rounded-[2.5rem] shadow-2xl relative overflow-hidden border-t-blue-500/20">
        {/* MENSAGENS COM ANIMAÇÃO */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 custom-scrollbar">
          <AnimatePresence initial={false}>
            {chatMessages.map((msg, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[90%] md:max-w-[80%] flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-8 h-8 md:w-10 md:h-10 rounded-xl flex items-center justify-center shrink-0 shadow-xl ${msg.role === 'assistant' ? 'bg-blue-600 text-white' : 'bg-muted border border-border'}`}>
                    {msg.role === 'assistant' ? <Bot className="w-4 h-4 md:w-5 md:h-5" /> : <UserIcon className="w-4 h-4 md:w-5 md:h-5" />}
                  </div>
                  <div className={`p-4 md:p-5 rounded-[1.5rem] text-xs md:text-[13px] font-medium leading-relaxed shadow-sm ${msg.role === 'assistant' ? 'bg-muted/40 border border-border/50 rounded-tl-none' : 'bg-blue-600 text-white rounded-tr-none shadow-blue-500/20'}`}>
                    {msg.content}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {isTyping && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3 justify-start items-center">
              <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white"><Bot className="w-4 h-4" /></div>
              <div className="flex gap-1 bg-muted/40 p-4 rounded-2xl rounded-tl-none">
                <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
              </div>
            </motion.div>
          )}
        </div>

        {/* FOOTER: Ações e Input */}
        <div className="p-4 md:p-6 bg-accent/5 border-t border-border/40 space-y-4">
          {/* Sugestões Rápidas */}
          {chatMessages.length < 4 && !isTyping && (
            <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
              {quickActions.map((action, i) => (
                <button 
                  key={i} 
                  onClick={() => handleChat(action)}
                  className="whitespace-nowrap px-4 py-2 rounded-full border border-border bg-background/50 text-[10px] font-black uppercase italic text-muted-foreground hover:border-blue-500/50 hover:text-blue-500 transition-all active:scale-95"
                >
                  {action}
                </button>
              ))}
            </div>
          )}

          {/* Fallback Humano (WhatsApp/Email) */}
          {chatMessages.length > 3 && (
            <div className="flex flex-col md:flex-row items-center justify-between gap-3 p-3 bg-blue-500/5 rounded-2xl border border-blue-500/10">
              <p className="text-[10px] font-black uppercase italic opacity-70">Humano necessário?</p>
              <div className="flex gap-2">
                <Button asChild variant="ghost" className="h-8 text-[9px] font-black uppercase text-green-600 hover:bg-green-500/10">
                  <a href="https://wa.me/5521994394315" target="_blank">WhatsApp <MessageCircle className="w-3 h-3 ml-1" /></a>
                </Button>
                <Button asChild variant="ghost" className="h-8 text-[9px] font-black uppercase text-blue-500 hover:bg-blue-500/10">
                  <a href="mailto:3dcheck.oficial@gmail.com">E-mail <Mail className="w-3 h-3 ml-1" /></a>
                </Button>
              </div>
            </div>
          )}

          <form onSubmit={(e) => { e.preventDefault(); handleChat(input); }} className="relative group">
            <Input 
              value={input} 
              onChange={(e) => setInput(e.target.value)} 
              placeholder="Digite sua dúvida aqui..." 
              className="h-14 md:h-16 pl-6 pr-16 rounded-2xl bg-background border-border shadow-inner font-bold italic text-sm transition-all focus:ring-2 focus:ring-blue-500/20" 
            />
            <Button 
              type="submit" 
              disabled={!input.trim() || isTyping} 
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl bg-blue-600 hover:bg-blue-500 w-10 h-10 md:w-12 md:h-12 shadow-lg transition-transform active:scale-90"
            >
              <Send className="w-4 h-4 md:w-5 md:h-5" />
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}
