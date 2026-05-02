import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { 
  MessageSquare, 
  Paperclip, 
  Send, 
  Bell, 
  CheckCircle2, 
  Trash2, 
  History, 
  FileCheck 
} from 'lucide-react';

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

  const markAsRead = async (ticketId: string, hasUnread: boolean) => {
    if (!hasUnread) return;
    await supabase
      .from('support_tickets')
      .update({ has_unread_reply: false })
      .eq('id', ticketId);
    fetchTickets();
  };

  // NOVA FUNÇÃO: Excluir chamado do histórico
  const handleDeleteTicket = async (ticketId: string) => {
    if (!confirm("Deseja realmente remover esta conversa do seu histórico?")) return;
    
    try {
      const { error } = await supabase
        .from('support_tickets')
        .delete()
        .eq('id', ticketId);

      if (error) throw error;
      
      toast.success("Conversa removida do histórico.");
      fetchTickets();
    } catch (err: any) {
      toast.error("Erro ao excluir: " + err.message);
    }
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
    <div className="max-w-4xl mx-auto p-8 space-y-10 pb-20">
      <header className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h2 className="text-3xl font-black uppercase italic tracking-tighter text-foreground">
            Suporte <span className="text-blue-500">& Feedback</span>
          </h2>
          <p className="text-muted-foreground font-medium text-xs uppercase tracking-widest opacity-60">Canal direto com a equipe 3DCheck</p>
        </div>
        <History className="w-8 h-8 text-blue-500/20" />
      </header>

      {/* FORMULÁRIO DE ENVIO */}
      <Card className="bg-card/50 p-8 rounded-[2.5rem] border-border border shadow-2xl backdrop-blur-sm">
        <form onSubmit={handleSendTicket} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest opacity-50">Qual o assunto?</Label>
              <Input name="subject" required className="h-12 rounded-2xl bg-muted/20 border-border" placeholder="Ex: Problema com pagamento ou Sugestão" />
            </div>
            
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest opacity-50">Detalhes</Label>
              <Textarea name="message" required className="min-h-[120px] rounded-2xl bg-muted/20 border-border" placeholder="Explique aqui o que aconteceu..." />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
              <Label className="flex items-center gap-3 cursor-pointer bg-blue-500/5 text-blue-500 px-5 py-3 rounded-2xl border border-blue-500/20 hover:bg-blue-500/10 transition-all">
                <Paperclip className="w-4 h-4" />
                <span className="text-[10px] font-black uppercase">
                  {file ? file.name : 'Anexar evidência (Foto)'}
                </span>
                <input type="file" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
              </Label>

              <Button type="submit" disabled={loading} className="h-14 px-12 bg-blue-600 hover:bg-blue-500 text-white font-black uppercase italic rounded-2xl shadow-xl shadow-blue-600/20">
                {loading ? 'Sincronizando...' : 'Enviar Mensagem'} <Send className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </form>
      </Card>

      {/* LISTA DE CHAMADOS */}
      <div className="space-y-6">
        <h3 className="font-black text-[10px] uppercase tracking-[0.3em] opacity-40">Histórico de Atendimento</h3>
        
        {tickets.length === 0 ? (
          <div className="py-16 text-center border-2 border-dashed border-border rounded-[3rem] opacity-40 italic font-medium">
            Nenhuma conversa no histórico.
          </div>
        ) : (
          tickets.map(ticket => (
            <div 
              key={ticket.id} 
              onClick={() => markAsRead(ticket.id, ticket.has_unread_reply)}
              className={`group p-8 border rounded-[2.5rem] transition-all cursor-pointer relative ${
                ticket.has_unread_reply 
                ? 'bg-blue-500/5 border-blue-500/40 shadow-xl' 
                : 'bg-card/40 border-border hover:border-blue-500/20'
              }`}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="space-y-1">
                  <h4 className="font-black uppercase italic text-lg leading-tight group-hover:text-blue-500 transition-colors">
                    {ticket.subject}
                  </h4>
                  <div className="flex items-center gap-3">
                    <span className="text-[9px] font-black opacity-40 uppercase tracking-widest">
                      {new Date(ticket.created_at).toLocaleDateString()}
                    </span>
                    {ticket.attachment_url && (
                      <span className="flex items-center gap-1 text-[9px] font-black text-blue-500 uppercase tracking-widest">
                        <FileCheck className="w-3 h-3" /> Contém Anexo
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {ticket.has_unread_reply && (
                    <div className="bg-blue-600 text-white px-3 py-1 rounded-full text-[9px] font-black animate-pulse">
                      NOVA RESPOSTA
                    </div>
                  )}
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteTicket(ticket.id);
                    }}
                    className="rounded-full text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <p className="text-sm font-medium opacity-70 mb-4 leading-relaxed">{ticket.message}</p>

              {ticket.admin_reply && (
                <div className="mt-6 p-6 bg-background/50 border-l-4 border-blue-600 rounded-r-3xl">
                  <div className="flex items-center gap-2 mb-2 text-blue-500">
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="text-[10px] font-black uppercase tracking-tighter">Resposta da Equipe 3DCheck</span>
                  </div>
                  <p className="font-bold text-sm italic text-foreground/90">{ticket.admin_reply}</p>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
