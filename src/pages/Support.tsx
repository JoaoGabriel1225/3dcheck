import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { getAIResponse } from '@/lib/aiService'; // Importando seu novo "cérebro"
import { 
  Send, 
  Bot, 
  User as UserIcon, 
  Sparkles, 
  Mail, 
  RefreshCw,
  Bell,
  CheckCircle2,
  Trash2,
  History,
  Search,
  Zap
} from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function Support() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSubTab, setActiveSubTab] = useState<'chat' | 'history'>('chat');
  
  // Estados do Chatbot
  const [chatMessages, setChatMessages] = useState<Message[]>([
    { role: 'assistant', content: `Olá, Maker! Eu sou o assistente do 3DCheck. Como posso ajudar seu negócio hoje? 🚀` }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchTickets = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('support_tickets')
      .select('*')
      .order('created_at', { ascending: false });
    setTickets(data || []);
  };

  useEffect(() => { 
    fetchTickets(); 
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
            toast.info("O João respondeu seu chamado!", { icon: <Bell className="text-blue-500" /> });
            fetchTickets();
          }
        })
        .subscribe();
      return () => { supabase.removeChannel(subscription); };
    }
  }, [user]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [chatMessages, isTyping]);

  // Lógica da IA
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

  // Criar Ticket Real (Escalação)
  const escalateToHuman = async () => {
    setLoading(true);
    const lastQuestion = chatMessages.filter(m => m.role === 'user').pop()?.content || "Dúvida via Chat";
    
    const { error } = await supabase.from('support_tickets').insert({
      user_id: user?.id,
      subject: "Atendimento IA escalado",
      message: lastQuestion,
      status: 'open'
    });

    if (!error) {
      toast.success("Enviado para o João!");
      setChatMessages(prev => [...prev, { role: 'assistant', content: "Certo! Já avisei o João. Ele vai analisar e te responder em até 24h. Você verá a resposta na aba 'Histórico'. 📩" }]);
      fetchTickets();
    }
    setLoading(false);
  };

  const handleDeleteTicket = async (id: string) => {
    if (!confirm("Remover do histórico?")) return;
    await supabase.from('support_tickets').delete().eq('id', id);
    setTickets(prev => prev.filter(t => t.id !== id));
  };

  const filteredHistory = tickets.filter(t => 
    t.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.message?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-4xl mx-auto p-8 space-y-10 pb-20">
      <header className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h2 className="text-3xl font-black uppercase italic tracking-tighter text-foreground">
            Suporte <span className="text-blue-500">Inteligente</span>
          </h2>
          <p className="text-muted-foreground font-medium text-[10px] uppercase tracking-widest opacity-60">Respostas instantâneas e suporte humano</p>
        </div>
        <div className="flex bg-muted/50 p-1 rounded-xl border border-border">
          <Button variant={activeSubTab === 'chat' ? 'default' : 'ghost'} onClick={() => setActiveSubTab('chat')} className="rounded-lg font-black text-[10px] uppercase h-9">Chat IA</Button>
          <Button variant={activeSubTab === 'history' ? 'default' : 'ghost'} onClick={() => setActiveSubTab('history')} className="rounded-lg font-black text-[10px] uppercase h-9">Histórico</Button>
        </div>
      </header>

      {activeSubTab === 'chat' ? (
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
                <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center text-white"><Bot className="w-5 h-5" /></div>
                <div className="bg-muted/50 p-5 rounded-[1.5rem] rounded-tl-none flex gap-1">
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" />
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                </div>
              </div>
            )}
          </div>

          {chatMessages.length > 2 && (
            <div className="flex justify-center mb-4">
              <Button onClick={escalateToHuman} disabled={loading} variant="outline" className="rounded-full border-blue-500/20 text-[10px] font-black uppercase italic text-blue-500 h-9 px-6 hover:bg-blue-500 hover:text-white transition-all shadow-xl">
                Não resolveu? Fale com o desenvolvedor. <Mail className="w-3 h-3 ml-2" />
              </Button>
            </div>
          )}

          <form onSubmit={handleChat} className="mt-4 relative">
            <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Pergunte sobre filamentos, vitrine, planos..." className="h-16 pl-6 pr-20 rounded-2xl bg-background border-border shadow-2xl font-bold italic" />
            <Button type="submit" disabled={!input.trim() || isTyping} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl bg-blue-600 hover:bg-blue-500 w-12 h-12 shadow-lg shadow-blue-600/20">
              <Send className="w-5 h-5" />
            </Button>
          </form>
        </Card>
      ) : (
        <div className="space-y-6 animate-in fade-in">
          <div className="relative group max-w-sm ml-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 opacity-30" />
            <Input placeholder="Pesquisar histórico..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-12 rounded-2xl bg-muted/10 border-border h-11" />
          </div>

          <div className="space-y-6">
            {filteredHistory.length === 0 ? (
              <div className="py-16 text-center border-2 border-dashed border-border rounded-[3rem] opacity-40 italic font-medium">Histórico vazio.</div>
            ) : (
              filteredHistory.map(ticket => (
                <div key={ticket.id} className={`group p-8 border rounded-[2.5rem] transition-all relative ${ticket.has_unread_reply ? 'bg-blue-500/5 border-blue-500/40 shadow-xl' : 'bg-card/40 border-border'}`}>
                  <div className="flex justify-between items-start mb-4">
                    <div className="space-y-1">
                      <h4 className="font-black uppercase italic text-lg leading-tight">{ticket.subject}</h4>
                      <span className="text-[9px] font-black opacity-40 uppercase tracking-widest">{new Date(ticket.created_at).toLocaleDateString()}</span>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteTicket(ticket.id)} className="rounded-full hover:text-red-500 hover:bg-red-500/10"><Trash2 className="w-4 h-4" /></Button>
                  </div>
                  <p className="text-sm font-medium opacity-70 mb-4 leading-relaxed">{ticket.message}</p>
                  {ticket.admin_reply && (
                    <div className="mt-6 p-6 bg-blue-500/5 border-l-4 border-blue-600 rounded-r-3xl">
                      <div className="flex items-center gap-2 mb-2 text-blue-500"><CheckCircle2 className="w-4 h-4" /><span className="text-[10px] font-black uppercase">Equipe 3DCheck</span></div>
                      <p className="font-bold text-sm italic text-foreground/90">{ticket.admin_reply}</p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
