import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import { CheckCircle, XCircle, ExternalLink, UserCog, Wallet } from 'lucide-react';

export default function AdminDashboard() {
  const [requests, setRequests] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      // Busca solicitações de Pix Manual (tabela subscriptions_pending)
      const { data: pendingData, error: reqError } = await supabase
        .from('subscriptions_pending')
        .select(`
          *,
          profiles(name, email, plan_status)
        `)
        .order('created_at', { ascending: false });
        
      if (reqError) throw reqError;
      setRequests(pendingData || []);

      // Busca todos os perfis
      const { data: profiles, error: profError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (profError) throw profError;
      setUsers(profiles || []);

    } catch (e: any) {
      toast.error('Erro ao carregar dados admin');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Função para Aprovar via RPC (Banco de Dados)
  const handleApprove = async (requestId: string, userId: string, userName: string) => {
    try {
      const { error } = await supabase.rpc('approve_subscription', { 
        target_user_id: userId, 
        pending_id: requestId 
      });

      if (error) throw error;

      toast.success(`Acesso liberado! ${userName} agora é Pro por mais 30 dias.`);
      fetchData();
    } catch (err: any) {
      toast.error('Erro ao aprovar assinatura');
    }
  };

  // Função para Rejeitar
  const handleReject = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('subscriptions_pending')
        .update({ status: 'rejected' })
        .eq('id', requestId);

      if (error) throw error;

      toast.error('Pagamento rejeitado.');
      fetchData();
    } catch (err: any) {
      toast.error('Erro ao processar rejeição');
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-20">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-black tracking-tighter text-foreground uppercase italic">
          Admin <span className="text-blue-500">Control</span>
        </h2>
        <p className="text-muted-foreground font-medium italic">Gestão de ecossistema e validação de ativos.</p>
      </div>

      {/* SEÇÃO DE COMPROVANTES PIX */}
      <Card className="rounded-[2.5rem] border-border bg-card/50 backdrop-blur-sm overflow-hidden shadow-2xl">
        <CardHeader className="bg-accent/5 border-b border-border/50 p-8">
          <CardTitle className="font-black text-xl flex items-center gap-3 uppercase">
            <Wallet className="w-6 h-6 text-blue-500" />
            Validação de Pix Manual
          </CardTitle>
        </CardHeader>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-border/50">
                <TableHead className="py-6 px-8 text-[10px] font-black uppercase tracking-[0.2em]">Data</TableHead>
                <TableHead className="py-6 px-8 text-[10px] font-black uppercase tracking-[0.2em]">Usuário</TableHead>
                <TableHead className="py-6 px-8 text-[10px] font-black uppercase tracking-[0.2em]">Comprovante</TableHead>
                <TableHead className="py-6 px-8 text-[10px] font-black uppercase tracking-[0.2em]">Status</TableHead>
                <TableHead className="py-6 px-8 text-[10px] font-black uppercase tracking-[0.2em] text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-20 font-bold opacity-50">Sincronizando dados...</TableCell></TableRow>
              ) : requests.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-20 text-muted-foreground font-medium italic">Nenhuma solicitação pendente no momento.</TableCell></TableRow>
              ) : (
                requests.map((req) => (
                  <TableRow key={req.id} className="hover:bg-accent/5 border-border/50 transition-colors">
                    <TableCell className="py-6 px-8 text-xs font-bold">{new Date(req.created_at).toLocaleDateString()}</TableCell>
                    <TableCell className="py-6 px-8">
                      <div className="font-black text-sm uppercase italic">{req.profiles?.name}</div>
                      <div className="text-[10px] font-bold text-muted-foreground">{req.profiles?.email}</div>
                    </TableCell>
                    <TableCell className="py-6 px-8">
                      <Button 
                        variant="link" 
                        className="text-blue-500 font-black text-xs p-0 h-auto flex items-center gap-1 uppercase italic"
                        onClick={() => {
                          const { data } = supabase.storage.from('comprovantes').getPublicUrl(req.receipt_url);
                          window.open(data.publicUrl, '_blank');
                        }}
                      >
                        <ExternalLink className="w-3 h-3" /> Abrir Anexo
                      </Button>
                    </TableCell>
                    <TableCell className="py-6 px-8">
                      <Badge className={`rounded-lg font-black text-[9px] uppercase tracking-widest px-3 py-1 ${
                        req.status === 'pending' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' :
                        req.status === 'approved' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' :
                        'bg-red-500/10 text-red-500 border border-red-500/20'
                      }`}>
                        {req.status === 'pending' ? 'Em Análise' : req.status === 'approved' ? 'Validado' : 'Recusado'}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-6 px-8 text-right">
                      {req.status === 'pending' && (
                        <div className="flex gap-2 justify-end">
                          <Button 
                            size="sm" 
                            className="bg-emerald-600 hover:bg-emerald-500 font-black text-[10px] rounded-xl px-4"
                            onClick={() => handleApprove(req.id, req.user_id, req.profiles?.name)}
                          >
                            <CheckCircle className="w-3 h-3 mr-1" /> APROVAR
                          </Button>
                          <Button 
                            size="sm" 
                            variant="destructive" 
                            className="font-black text-[10px] rounded-xl px-4"
                            onClick={() => handleReject(req.id)}
                          >
                            <XCircle className="w-3 h-3 mr-1" /> REJEITAR
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* SEÇÃO DE USUÁRIOS */}
      <Card className="rounded-[2.5rem] border-border bg-card/50 overflow-hidden">
        <CardHeader className="bg-accent/5 border-b border-border/50 p-8">
          <CardTitle className="font-black text-xl flex items-center gap-3 uppercase">
            <UserCog className="w-6 h-6 text-blue-500" />
            Base de Usuários
          </CardTitle>
        </CardHeader>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-border/50">
                <TableHead className="py-6 px-8 text-[10px] font-black uppercase tracking-[0.2em]">Identificação</TableHead>
                <TableHead className="py-6 px-8 text-[10px] font-black uppercase tracking-[0.2em]">Nível</TableHead>
                <TableHead className="py-6 px-8 text-[10px] font-black uppercase tracking-[0.2em]">Status</TableHead>
                <TableHead className="py-6 px-8 text-[10px] font-black uppercase tracking-[0.2em]">Expiração</TableHead>
                <TableHead className="py-6 px-8 text-[10px] font-black uppercase tracking-[0.2em] text-right">Links</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id} className="hover:bg-accent/5 border-border/50 transition-colors">
                  <TableCell className="py-6 px-8">
                    <div className="font-black text-sm uppercase italic">{u.name}</div>
                    <div className="text-[10px] font-bold text-muted-foreground">{u.email}</div>
                  </TableCell>
                  <TableCell className="py-6 px-8">
                    <Badge variant="outline" className={`font-black text-[9px] uppercase tracking-widest ${
                      u.plan_status === 'pro' ? 'border-blue-500 text-blue-500' : 'border-muted-foreground/30 text-muted-foreground'
                    }`}>
                      {u.plan_status === 'pro' ? 'PLATINUM PRO' : 'FREE USER'}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-6 px-8">
                     <div className={`w-2 h-2 rounded-full ${
                       u.status === 'active' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' :
                       u.status === 'trial' ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]' : 'bg-red-500'
                     }`} />
                  </TableCell>
                  <TableCell className="py-6 px-8 text-xs font-bold text-muted-foreground">
                    {u.trialEndsAt ? new Date(u.trialEndsAt).toLocaleDateString() : 'PERMANENTE'}
                  </TableCell>
                  <TableCell className="py-6 px-8 text-right">
                    <a 
                      href={`/storefront/${u.id}`} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="text-[10px] font-black text-blue-500 uppercase italic hover:underline"
                    >
                      Ver Vitrine
                    </a>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
