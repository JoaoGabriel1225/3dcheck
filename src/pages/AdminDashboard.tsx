import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/table';
import { toast } from 'sonner';
import { 
  CheckCircle, XCircle, ExternalLink, UserCog, 
  Wallet, RefreshCw, MessageSquare, Send, Paperclip, Search, Users, ShieldAlert
} from 'lucide-react';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'finance' | 'users' | 'support'>('finance');
  // NOVOS ESTADOS PARA SUPORTE
  const [supportSubTab, setSupportSubTab] = useState<'pending' | 'history'>('pending');
  const [supportSearch, setSupportSearch] = useState('');
  
  const [searchTerm, setSearchTerm] = useState('');
  const [requests, setRequests] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyTexts, setReplyTexts] = useState<Record<string, string>>({});

  const fetchData = async () => {
    try {
      setLoading(true);
      const [reqs, profs, tix] = await Promise.all([
        supabase.from('subscriptions_pending').select(`*, profiles (name, email, plan_status)`).order('created_at', { ascending: false }),
        supabase.from('profiles').select('*').order('created_at', { ascending: false }),
        supabase.from('support_tickets').select(`*, profiles (name, email)`).order('created_at', { ascending: false })
      ]);
      setRequests(reqs.data || []);
      setUsers(profs.data || []);
      setTickets(tix.data || []);
    } catch (e: any) {
      toast.error('Falha ao sincronizar dados.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // --- FUNÇÕES DE AÇÃO FINANCEIRA (ADICIONADAS PARA CORRIGIR O ERRO) ---
  const handleApprove = async (requestId: string, userId: string, userName: string) => {
    try {
      const { error } = await supabase.rpc('approve_subscription', { 
        target_user_id: userId, 
        pending_id: requestId 
      });
      if (error) throw error;
      toast.success(`Elite ativada para ${userName}!`);
      fetchData();
    } catch (err: any) {
      toast.error('Erro ao aprovar assinatura.');
    }
  };

  const handleReject = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('subscriptions_pending')
        .update({ status: 'rejected' })
        .eq('id', requestId);
      if (error) throw error;
      toast.error('Solicitação rejeitada.');
      fetchData();
    } catch (err: any) {
      toast.error('Erro ao processar rejeição.');
    }
  };

  // Lógica da Barra de Pesquisa de Usuários
  const filteredUsers = users.filter(u => 
    u.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // NOVA LÓGICA DE FILTRAGEM E PESQUISA PARA SUPORTE
  const filteredTickets = tickets.filter(t => {
    const matchesSearch = 
      t.subject?.toLowerCase().includes(supportSearch.toLowerCase()) ||
      t.profiles?.name?.toLowerCase().includes(supportSearch.toLowerCase()) ||
      t.message?.toLowerCase().includes(supportSearch.toLowerCase());
    
    if (supportSubTab === 'pending') return !t.admin_reply && matchesSearch;
    return t.admin_reply && matchesSearch;
  });

  const handleAdminReply = async (ticketId: string) => {
    const reply = replyTexts[ticketId];
    if (!reply?.trim()) return toast.error("Digite uma resposta.");
    try {
      const { error } = await supabase
        .from('support_tickets')
        .update({ admin_reply: reply, status: 'responded', has_unread_reply: true })
        .eq('id', ticketId);
      if (error) throw error;
      toast.success("Resposta enviada!");
      setReplyTexts(prev => ({ ...prev, [ticketId]: '' }));
      fetchData(); // Move automaticamente para o histórico
    } catch (err) {
      toast.error("Erro ao enviar.");
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-20 px-4">
      {/* HEADER E NAVEGAÇÃO POR ABAS (Original mantido) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black tracking-tighter uppercase italic">Admin <span className="text-blue-500">Control</span></h2>
          <p className="text-muted-foreground font-medium italic">Gestão centralizada do ecossistema 3DCheck.</p>
        </div>
        
        <div className="flex bg-muted/50 p-1.5 rounded-2xl border border-border shrink-0">
          <button onClick={() => setActiveTab('finance')} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${activeTab === 'finance' ? 'bg-card shadow-sm text-blue-500' : 'text-muted-foreground hover:text-foreground'}`}>
            <Wallet className="w-3.5 h-3.5" /> Financeiro
          </button>
          <button onClick={() => setActiveTab('users')} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${activeTab === 'users' ? 'bg-card shadow-sm text-blue-500' : 'text-muted-foreground hover:text-foreground'}`}>
            <Users className="w-3.5 h-3.5" /> Operadores
          </button>
          <button onClick={() => setActiveTab('support')} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${activeTab === 'support' ? 'bg-card shadow-sm text-blue-500' : 'text-muted-foreground hover:text-foreground'}`}>
            <MessageSquare className="w-3.5 h-3.5" /> Suporte
          </button>
          <Button onClick={fetchData} variant="ghost" size="icon" className="ml-2 rounded-xl"><RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /></Button>
        </div>
      </div>

      {activeTab === 'finance' && (
        <Card className="rounded-[2.5rem] border-border bg-card/50 overflow-hidden shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
          <CardHeader className="p-8 border-b border-border/50 bg-blue-500/5">
            <CardTitle className="font-black text-xl italic uppercase flex items-center gap-3">
              <ShieldAlert className="text-blue-500" /> Solicitações Pendentes
            </CardTitle>
          </CardHeader>
          <Table>
            <TableHeader>
              <TableRow className="border-border/50">
                <TableHead className="px-8 py-6 text-[10px] font-black uppercase italic">Data</TableHead>
                <TableHead className="px-8 py-6 text-[10px] font-black uppercase italic">Operador</TableHead>
                <TableHead className="px-8 py-6 text-[10px] font-black uppercase italic">Comprovante</TableHead>
                <TableHead className="px-8 py-6 text-[10px] font-black uppercase italic text-right">Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map(req => (
                <TableRow key={req.id} className="border-border/50 hover:bg-accent/5">
                  <TableCell className="px-8 py-6 font-bold text-xs">{new Date(req.created_at).toLocaleDateString()}</TableCell>
                  <TableCell className="px-8 py-6">
                    <div className="font-black text-sm uppercase italic">{req.profiles?.name}</div>
                    <div className="text-[10px] font-bold opacity-50">{req.profiles?.email}</div>
                  </TableCell>
                  <TableCell className="px-8 py-6">
                    <Button variant="link" className="text-blue-500 font-black italic p-0 h-auto flex items-center gap-1" onClick={() => window.open(supabase.storage.from('comprovantes').getPublicUrl(req.receipt_url).data.publicUrl, '_blank')}>
                      <ExternalLink className="w-3 h-3" /> Ver Comprovante
                    </Button>
                  </TableCell>
                  <TableCell className="px-8 py-6 text-right flex justify-end gap-2">
                    {req.status === 'pending' ? (
                      <>
                        <Button size="sm" className="bg-emerald-600 hover:bg-emerald-500 font-black rounded-xl" onClick={() => handleApprove(req.id, req.user_id, req.profiles?.name)}>APROVAR</Button>
                        <Button size="sm" variant="destructive" className="font-black rounded-xl" onClick={() => handleReject(req.id)}>REJEITAR</Button>
                      </>
                    ) : <Badge variant="outline" className="uppercase font-black italic">{req.status}</Badge>}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {activeTab === 'users' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="relative max-w-md group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-blue-500 transition-colors" />
            <Input 
              placeholder="Pesquisar por nome ou e-mail..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-14 pl-12 rounded-2xl bg-card border-border font-bold shadow-xl"
            />
          </div>
          <Card className="rounded-[2.5rem] border-border bg-card/40 overflow-hidden shadow-2xl">
            <Table>
              <TableHeader>
                <TableRow className="border-border/50">
                  <TableHead className="px-8 py-6 text-[10px] font-black uppercase italic">Nome / E-mail</TableHead>
                  <TableHead className="px-8 py-6 text-[10px] font-black uppercase italic">Plano</TableHead>
                  <TableHead className="px-8 py-6 text-[10px] font-black uppercase italic">Status</TableHead>
                  <TableHead className="px-8 py-6 text-[10px] font-black uppercase italic text-right">Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map(u => (
                  <TableRow key={u.id} className="border-border/50 hover:bg-accent/5">
                    <TableCell className="px-8 py-6">
                      <div className="font-black text-sm uppercase italic">{u.name}</div>
                      <div className="text-[10px] font-bold opacity-50">{u.email}</div>
                    </TableCell>
                    <TableCell className="px-8 py-6">
                      <Badge className={u.plan_status === 'pro' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' : 'bg-muted'}>{u.plan_status === 'pro' ? 'ELITE PRO' : 'STARTER'}</Badge>
                    </TableCell>
                    <TableCell className="px-8 py-6">
                      <div className={`w-2.5 h-2.5 rounded-full ${u.status === 'active' ? 'bg-emerald-500 shadow-[0_0_10px_emerald]' : 'bg-red-500'}`} />
                    </TableCell>
                    <TableCell className="px-8 py-6 text-right">
                      <Button variant="ghost" size="sm" className="text-blue-500 font-black italic text-[10px]" onClick={() => window.open(`/storefront/${u.id}`, '_blank')}>VISUALIZAR <ExternalLink className="w-3 h-3 ml-1"/></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </div>
      )}

      {/* ABA SUPORTE: ATUALIZADA COM SUB-ABAS E PESQUISA */}
      {activeTab === 'support' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          <div className="flex flex-col md:flex-row justify-between gap-4">
            <div className="flex bg-muted/30 p-1 rounded-xl w-fit">
              <Button 
                size="sm" 
                variant={supportSubTab === 'pending' ? 'default' : 'ghost'} 
                onClick={() => setSupportSubTab('pending')}
                className="rounded-lg font-black text-[10px] uppercase h-9"
              >
                Pendentes ({tickets.filter(t => !t.admin_reply).length})
              </Button>
              <Button 
                size="sm" 
                variant={supportSubTab === 'history' ? 'default' : 'ghost'} 
                onClick={() => setSupportSubTab('history')}
                className="rounded-lg font-black text-[10px] uppercase h-9"
              >
                Histórico ({tickets.filter(t => t.admin_reply).length})
              </Button>
            </div>
            
            <div className="relative w-full md:w-80 group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-30 group-focus-within:text-blue-500 transition-colors" />
              <Input 
                placeholder="Pesquisar no suporte..." 
                value={supportSearch} 
                onChange={(e) => setSupportSearch(e.target.value)} 
                className="pl-10 rounded-xl h-11 border-border shadow-sm" 
              />
            </div>
          </div>

          <div className="grid gap-6">
            {filteredTickets.map(ticket => (
              <Card key={ticket.id} className={`rounded-[2.5rem] border-border bg-card/40 shadow-xl overflow-hidden transition-all ${!ticket.admin_reply ? 'border-blue-500/30 ring-1 ring-blue-500/10 shadow-blue-500/5' : ''}`}>
                <div className="p-8 grid md:grid-cols-[1fr_320px] gap-8">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Badge className={ticket.admin_reply ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-blue-600'}>{ticket.admin_reply ? 'Respondido' : 'Aguardando'}</Badge>
                      <span className="text-[10px] font-black opacity-30 uppercase">{new Date(ticket.created_at).toLocaleString()}</span>
                    </div>
                    <h3 className="text-xl font-black italic uppercase tracking-tighter">{ticket.subject}</h3>
                    <div className="p-6 bg-background/50 rounded-2xl border border-border text-sm font-medium leading-relaxed italic opacity-80">"{ticket.message}"</div>
                    
                    {ticket.attachment_url && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="rounded-xl border-blue-500/20 text-blue-500 bg-blue-500/5 hover:bg-blue-500/10 font-black italic uppercase text-[10px] gap-2 h-10 px-4" 
                        onClick={() => window.open(supabase.storage.from('support-attachments').getPublicUrl(ticket.attachment_url).data.publicUrl, '_blank')}
                      >
                        <Paperclip className="w-4 h-4" /> Ver Anexo de Evidência
                      </Button>
                    )}
                  </div>

                  <div className="flex flex-col gap-4 bg-accent/10 p-6 rounded-[2rem] border border-border/40">
                    <div className="space-y-1">
                      <div className="text-[10px] font-black uppercase italic opacity-40">Operador</div>
                      <div className="font-black text-sm italic uppercase">{ticket.profiles?.name}</div>
                      <div className="text-[9px] font-bold opacity-50">{ticket.profiles?.email}</div>
                    </div>
                    
                    <div className="pt-4 border-t border-border/50">
                      {ticket.admin_reply ? (
                        <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-xl text-[11px] font-bold italic text-emerald-700">
                          <span className="block text-[8px] uppercase not-italic opacity-50 mb-1">Resposta Enviada:</span>
                          {ticket.admin_reply}
                        </div>
                      ) : (
                        <>
                          <Textarea 
                            placeholder="Sua resposta..." 
                            className="bg-background rounded-xl border-border text-xs min-h-[100px] mb-3"
                            value={replyTexts[ticket.id] || ''}
                            onChange={(e) => setReplyTexts(prev => ({ ...prev, [ticket.id]: e.target.value }))}
                          />
                          <Button onClick={() => handleAdminReply(ticket.id)} className="w-full bg-blue-600 hover:bg-blue-500 font-black uppercase italic rounded-xl h-11">Responder <Send className="w-4 h-4 ml-2"/></Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
            {filteredTickets.length === 0 && (
              <div className="py-20 text-center opacity-40 italic font-medium border-2 border-dashed border-border rounded-[2.5rem]">
                Nenhum chamado encontrado nesta categoria.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
