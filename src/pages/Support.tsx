import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card'; // Importação adicionada para corrigir o erro
import { toast } from 'sonner';
import { MessageSquare, Paperclip, Send, Bell, CheckCircle2 } from 'lucide-react';

export default function Support() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  const fetchTickets = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('support_tickets')
      .select('*')
      .order('created_at', { ascending: false });
    setTickets(data || []);
  };

  useEffect(() => { fetchTickets(); }, [user]);

  // Função para limpar a notificação quando o usuário ler a resposta
  const markAsRead = async (ticketId: string, hasUnread: boolean) => {
    if (!hasUnread) return;
    
    await supabase
      .from('support_tickets')
      .update({ has_unread_reply: false })
      .eq('id', ticketId);
    
    fetchTickets(); // Atualiza a lista para sumir o aviso
  };

  const handleSendTicket = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.target);
    
    let attachmentPath = null;
    if (file) {
      const fileName = `${Date.now()}-${file.name}`;
      const { data, error } = await supabase.storage
        .from('support-attachments')
        .upload(`${user.id}/${fileName}`, file);
      
      if (error) {
        toast.error("Erro ao subir anexo");
      } else {
        attachmentPath = data.path;
      }
    }

    const { error } = await supabase.from('support_tickets').insert({
      user_id: user.id,
      subject: formData.get('subject'),
      message: formData.get('message'),
      attachment_url: attachmentPath,
      status: 'open'
    });

    if (!error) {
      toast.success("Enviado para o suporte!");
      e.target.reset();
      setFile(null);
      fetchTickets();
    }
    setLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto p-8 space-y-12 pb-20">
      <header className="flex flex-col gap-2">
        <h2 className="text-3xl font-black uppercase italic tracking-tighter text-foreground">
          Central de <span className="text-blue-500">Suporte</span>
        </h2>
        <p className="text-muted-foreground font-medium italic">Feedback e auxílio técnico para sua operação.</p>
      </header>

      {/* FORMULÁRIO DE ENVIO */}
      <Card className="bg-card/50 p-8 rounded-[2.5rem] border-border border shadow-2xl backdrop-blur-sm">
        <form onSubmit={handleSendTicket} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest opacity-50">Assunto</Label>
              <Input name="subject" required className="h-12 rounded-2xl bg-muted/20" placeholder="Ex: Dúvida sobre faturamento" />
            </div>
            
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest opacity-50">Mensagem</Label>
              <Textarea name="message" required className="min-h-[120px] rounded-2xl bg-muted/20" placeholder="Como podemos te ajudar hoje?" />
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <Label className="flex items-center gap-2 cursor-pointer bg-blue-500/10 text-blue-500 p-4 rounded-2xl hover:bg-blue-500/20 transition-all border border-blue-500/20">
                <Paperclip className="w-4 h-4" />
                <span className="text-[10px] font-black uppercase">{file ? file.name : 'Anexar Imagem'}</span>
                <input type="file" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
              </Label>

              <Button type="submit" disabled={loading} className="h-14 px-10 bg-blue-600 hover:bg-blue-500 text-white font-black uppercase italic rounded-2xl shadow-lg shadow-blue-600/20 ml-auto">
                {loading ? 'Sincronizando...' : 'Enviar Mensagem'} <Send className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </form>
      </Card>

      {/* LISTA DE CHAMADOS */}
      <div className="space-y-4">
        <h3 className="font-black text-[10px] uppercase tracking-[0.3em] opacity-40">Histórico de Conversas</h3>
        
        {tickets.length === 0 ? (
          <div className="py-10 text-center border-2 border-dashed border-border rounded-[2rem] opacity-50 italic font-medium">
            Nenhum chamado aberto.
          </div>
        ) : (
          tickets.map(ticket => (
            <div 
              key={ticket.id} 
              onClick={() => markAsRead(ticket.id, ticket.has_unread_reply)}
              className={`p-8 border rounded-[2rem] transition-all cursor-pointer group ${
                ticket.has_unread_reply 
                ? 'bg-blue-500/5 border-blue-500/40 shadow-lg shadow-blue-500/5' 
                : 'bg-card/30 border-border hover:border-blue-500/20'
              }`}
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="font-black uppercase italic text-lg leading-tight group-hover:text-blue-500 transition-colors">
                    {ticket.subject}
                  </h4>
                  <span className="text-[9px] font-black opacity-40 uppercase tracking-widest">
                    {new Date(ticket.created_at).toLocaleDateString()}
                  </span>
                </div>
                
                {ticket.has_unread_reply && (
                  <div className="bg-blue-500 text-white px-3 py-1 rounded-full text-[9px] font-black flex items-center gap-1 animate-pulse">
                    <Bell className="w-3 h-3" /> NOVA RESPOSTA
                  </div>
                )}
              </div>

              <p className="text-sm font-medium opacity-70 mb-4">{ticket.message}</p>

              {ticket.admin_reply && (
                <div className="mt-6 p-6 bg-background/50 border-l-4 border-blue-500 rounded-r-2xl">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-500" />
                    <span className="text-[10px] font-black text-blue-500 uppercase">Resposta da Equipe 3DCheck</span>
                  </div>
                  <p className="font-bold text-sm italic">{ticket.admin_reply}</p>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
