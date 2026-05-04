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
} from '@/components/ui/table';
import { toast } from 'sonner';
import { 
  CheckCircle, XCircle, ExternalLink, UserCog, 
  Wallet, RefreshCw, MessageSquare, Send, Paperclip, Search, Users, ShieldAlert,
  Bell, Clock
} from 'lucide-react';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'finance' | 'users' | 'support'>('finance');
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
      toast.error('Falha ao sincronizar dados administrativos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    const adminChannel = supabase
      .channel('admin_realtime_updates')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'subscriptions_pending' }, () => {
        toast.success("NOVO COMPROVANTE!", {
          description: "Um operador enviou um pagamento para validação.",
          icon: <Wallet className="text-emerald-500" />,
          duration: 8000,
        });
        fetchData();
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'support_tickets' }, () => {
        toast.info("NOVO CHAMADO DE SUPORTE!", {
          description: "Um usuário abriu uma nova solicitação de ajuda.",
          icon: <MessageSquare className="text-blue-500" />,
          duration: 8000,
        });
        fetchData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(adminChannel);
    };
  }, []);

  // LÓGICA DE APROVAÇÃO MANUAL CORRIGIDA
  const handleApprove = async (requestId: string, userId: string, userName: string, planType: string) => {
    try {
      setLoading(true);
      
      // 1. Calcular a nova data de expiração
      const daysToAdd = planType === 'annual' ? 365 : 30;
      const newExpiryDate = new Date();
      newExpiryDate.setDate(newExpiryDate.getDate() + daysToAdd);

      // 2. Atualizar Perfil do Usuário para PRO
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ 
          plan_status: 'pro', 
          trialEndsAt: newExpiryDate.toISOString() 
        })
        .eq('id', userId);

      if (profileError) throw profileError;

      // 3. Atualizar Status da Solicitação de Pix
      const { error: requestError } = await supabase
        .from('subscriptions_pending')
        .update({ status: 'approved' })
        .eq('id', requestId);

      if (requestError) throw requestError;

      toast.success(`Elite ativada para ${userName} por ${daysToAdd} dias!`);
      fetchData();
    } catch (err: any) {
      console.error(err);
      toast.error('Erro ao aprovar assinatura. Verifique permissões do Supabase.');
    } finally {
      setLoading(false);
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

  // ... (restante dos filtros e handleAdminReply permanecem iguais)
  const filteredUsers = users.filter(u => 
    u.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
        .update({ 
          admin_reply: reply, 
          status: 'responded', 
          has_unread_reply: true 
        })
        .eq('id', ticketId);

      if (error) throw error;
      
      toast.success("Resposta enviada com sucesso!");
      setReplyTexts(prev => ({ ...prev, [ticketId]: '' }));
      fetchData();
    } catch (err: any) {
      toast.error("Erro ao registrar resposta.");
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-20 px-4">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black tracking-tighter uppercase italic">Admin <span className="text-blue-500">Control</span></h2>
          <p className="text-muted-foreground font-medium italic">Sincronização global do ecossistema 3DCheck.</p>
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

      {/* ABA FINANCEIRO ATUALIZADA */}
      {activeTab === 'finance' && (
        <Card className="rounded-[2.5rem] border-border bg-card/50 overflow-hidden shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
          <CardHeader className="p-8 border-b border-border/50 bg-blue-500/5">
            <CardTitle className="font-black text-xl italic uppercase flex items-center gap-3">
              <ShieldAlert className="text-blue-500" /> Solicitações de Pix Manual
            </CardTitle>
          </CardHeader>
          <Table>
            <TableHeader>
              <TableRow className="border-border/50">
                <TableHead className="px-8 py-6 text-[10px] font-black uppercase italic">Data</TableHead>
                <TableHead className="px-8 py-6 text-[10px] font-black uppercase italic">Operador</TableHead>
                <TableHead className="px-8 py-6 text-[10px] font-black uppercase italic">Plano</TableHead>
                <TableHead className="px-8 py-6 text-[10px] font-black uppercase italic">Comprovante</TableHead>
                <TableHead className="px-8 py-6 text-[10px] font-black uppercase italic text-right">Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map(req => (
                <TableRow key={req.id} className="border-border/50 hover:bg-accent/5">
                  <TableCell className="px-8 py-6 font-bold text-xs">{new Date(req.created_at).toLocaleDateString()}</TableCell>
                  <TableCell className="px-8 py-6">
                    <div className="font-black text-sm uppercase italic">{req.profiles?.name || 'Inexistente'}</div>
                    <div className="text-[10px] font-bold opacity-50">{req.profiles?.email || '---'}</div>
                  </TableCell>
                  <TableCell className="px-8 py-6">
                    <Badge variant="outline" className={`font-black italic uppercase text-[9px] ${req.plan_type === 'annual' ? 'border-amber-500/50 text-amber-600' : 'border-blue-500/50 text-blue-600'}`}>
                      {req.plan_type === 'annual' ? 'ANUAL' : 'MENSAL'}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-8 py-6">
                    <Button 
                      variant="link" 
                      className="text-blue-500 font-black italic p-0 h-auto flex items-center gap-1" 
                      onClick={() => window.open(req.receipt_url, '_blank')}
                    >
                      <ExternalLink className="w-3 h-3" /> Ver Imagem
                    </Button>
                  </TableCell>
                  <TableCell className="px-8 py-6 text-right flex justify-end gap-2">
                    {req.status === 'pending' ? (
                      <>
                        <Button size="sm" className="bg-emerald-600 hover:bg-emerald-500 font-black rounded-xl" onClick={() => handleApprove(req.id, req.user_id, req.profiles?.name, req.plan_type)}>APROVAR</Button>
                        <Button size="sm" variant="destructive" className="font-black rounded-xl" onClick={() => handleReject(req.id)}>REJEITAR</Button>
                      </>
                    ) : (
                      <Badge className={`uppercase font-black italic ${req.status === 'approved' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                        {req.status === 'approved' ? 'APROVADO' : 'REJEITADO'}
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* ... ABAS DE USUÁRIOS E SUPORTE CONTINUAM IGUAIS ... */}
      {/* (Código oculto para brevidade, mantenha o seu original abaixo daqui) */}
    </div>
  );
}
