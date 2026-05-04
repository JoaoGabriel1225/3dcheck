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
  Bell, Clock, Plus
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
  
  // Estado para os dias manuais por solicitação
  const [customDays, setCustomDays] = useState<Record<string, number>>({});

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
        toast.success("NOVO COMPROVANTE!", { icon: <Wallet className="text-emerald-500" /> });
        fetchData();
      })
      .subscribe();
    return () => { supabase.removeChannel(adminChannel); };
  }, []);

  // LÓGICA DE APROVAÇÃO COM DIAS VARIÁVEIS
  const handleApprove = async (requestId: string, userId: string, userName: string, days: number) => {
    if (!days || days <= 0) return toast.error("Selecione ou digite a quantidade de dias.");
    
    try {
      setLoading(true);
      const newExpiryDate = new Date();
      newExpiryDate.setDate(newExpiryDate.getDate() + days);

      const { error: profileError } = await supabase
        .from('profiles')
        .update({ 
          plan_status: 'pro', 
          trialEndsAt: newExpiryDate.toISOString() 
        })
        .eq('id', userId);

      if (profileError) throw profileError;

      const { error: requestError } = await supabase
        .from('subscriptions_pending')
        .update({ status: 'approved' })
        .eq('id', requestId);

      if (requestError) throw requestError;

      toast.success(`Elite ativada para ${userName} por ${days} dias!`);
      fetchData();
    } catch (err: any) {
      toast.error('Erro ao aprovar assinatura.');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async (requestId: string) => {
    try {
      await supabase.from('subscriptions_pending').update({ status: 'rejected' }).eq('id', requestId);
      toast.error('Solicitação rejeitada.');
      fetchData();
    } catch (err: any) {
      toast.error('Erro ao processar rejeição.');
    }
  };

  const filteredUsers = users.filter(u => 
    u.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-background p-6 space-y-6 max-w-[1600px] mx-auto">
      
      {/* HEADER (FIXO) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 flex-none">
        <div>
          <h2 className="text-3xl font-black tracking-tighter uppercase italic">Admin <span className="text-blue-500">Control</span></h2>
          <p className="text-muted-foreground text-xs font-medium italic">Gestão em tempo real do ecossistema 3DCheck.</p>
        </div>
        
        <div className="flex bg-muted/50 p-1 rounded-xl border border-border items-center">
          <button onClick={() => setActiveTab('finance')} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${activeTab === 'finance' ? 'bg-card shadow-sm text-blue-500' : 'text-muted-foreground'}`}>
            Financeiro
          </button>
          <button onClick={() => setActiveTab('users')} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${activeTab === 'users' ? 'bg-card shadow-sm text-blue-500' : 'text-muted-foreground'}`}>
            Operadores
          </button>
          <button onClick={() => setActiveTab('support')} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${activeTab === 'support' ? 'bg-card shadow-sm text-blue-500' : 'text-muted-foreground'}`}>
            Suporte
          </button>
          <Button onClick={fetchData} variant="ghost" size="icon" className="ml-2 h-8 w-8"><RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /></Button>
        </div>
      </div>

      {/* ÁREA DE CONTEÚDO (SCROLL INTERNO) */}
      <div className="flex-1 overflow-y-auto min-h-0 pr-2 custom-scrollbar">
        
        {activeTab === 'finance' && (
          <Card className="rounded-[2rem] border-border bg-card/50 shadow-xl border-t-blue-500/20">
            <Table>
              <TableHeader className="sticky top-0 bg-card z-10">
                <TableRow className="border-border/50">
                  <TableHead className="px-6 py-4 text-[9px] font-black uppercase italic">Operador / Data</TableHead>
                  <TableHead className="px-6 py-4 text-[9px] font-black uppercase italic">Comprovante</TableHead>
                  <TableHead className="px-6 py-4 text-[9px] font-black uppercase italic text-center">Tempo de Ativação</TableHead>
                  <TableHead className="px-6 py-4 text-[9px] font-black uppercase italic text-right">Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map(req => (
                  <TableRow key={req.id} className="border-border/40 hover:bg-accent/5">
                    <TableCell className="px-6 py-4">
                      <div className="font-black text-xs uppercase italic">{req.profiles?.name || 'Inexistente'}</div>
                      <div className="text-[9px] font-bold opacity-40">{new Date(req.created_at).toLocaleDateString()} • {req.plan_type}</div>
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <Button variant="link" className="text-blue-500 font-black italic p-0 h-auto text-[10px]" onClick={() => window.open(req.receipt_url, '_blank')}>
                        <ExternalLink className="w-3 h-3 mr-1" /> VER PIX
                      </Button>
                    </TableCell>
                    
                    {/* SELEÇÃO DE DIAS */}
                    <TableCell className="px-6 py-4">
                      {req.status === 'pending' && (
                        <div className="flex items-center justify-center gap-2">
                          <Button size="sm" variant="outline" className="h-7 text-[9px] font-black border-blue-500/30" onClick={() => setCustomDays({...customDays, [req.id]: 30})}>+30D</Button>
                          <Button size="sm" variant="outline" className="h-7 text-[9px] font-black border-amber-500/30" onClick={() => setCustomDays({...customDays, [req.id]: 365})}>+365D</Button>
                          <div className="flex items-center gap-1 bg-accent/20 px-2 rounded-lg border border-border">
                            <Clock className="w-3 h-3 opacity-30" />
                            <input 
                              type="number" 
                              placeholder="Dias"
                              className="w-12 bg-transparent border-none text-[10px] font-black focus:ring-0 h-7"
                              value={customDays[req.id] || ''}
                              onChange={(e) => setCustomDays({...customDays, [req.id]: parseInt(e.target.value)})}
                            />
                          </div>
                        </div>
                      )}
                    </TableCell>

                    <TableCell className="px-6 py-4 text-right">
                      {req.status === 'pending' ? (
                        <div className="flex justify-end gap-2">
                          <Button 
                            size="sm" 
                            className="bg-emerald-600 hover:bg-emerald-500 font-black rounded-lg text-[10px] h-8" 
                            onClick={() => handleApprove(req.id, req.user_id, req.profiles?.name, customDays[req.id] || (req.plan_type === 'annual' ? 365 : 30))}
                          >
                            APROVAR
                          </Button>
                          <Button size="sm" variant="ghost" className="text-red-500 font-black text-[10px] h-8" onClick={() => handleReject(req.id)}>REJEITAR</Button>
                        </div>
                      ) : (
                        <Badge className={`uppercase font-black italic text-[9px] ${req.status === 'approved' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                          {req.status}
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}

        {/* ... (Manter tabelas de Usuários e Suporte com a mesma lógica de scroll interno) */}
        {activeTab === 'users' && (
           <Card className="rounded-[2rem] border-border bg-card/40 overflow-hidden shadow-xl">
             <div className="p-4 border-b border-border/50"><Input placeholder="Pesquisar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="h-10 rounded-xl" /></div>
             <Table>
                {/* Mesma estrutura do seu código original de usuários */}
                <TableBody>
                  {filteredUsers.map(u => (
                    <TableRow key={u.id} className="border-border/40 hover:bg-accent/5">
                      <TableCell className="px-6 py-4 font-black text-xs uppercase">{u.name}</TableCell>
                      <TableCell className="px-6 py-4 font-bold text-[10px] opacity-50">{u.email}</TableCell>
                      <TableCell className="px-6 py-4 text-right">
                        <Badge className={u.plan_status === 'pro' ? 'bg-blue-500/10 text-blue-500' : ''}>{u.plan_status}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
             </Table>
           </Card>
        )}
      </div>
    </div>
  );
}
