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

export default function AdminDashboard() {
  const [requests, setRequests] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      // Fetch Payment Requests with profile details
      const { data: payRequests, error: reqError } = await supabase
        .from('payment_requests')
        .select(`
          *,
          profiles(name, email, status)
        `)
        .order('created_at', { ascending: false });
        
      if (reqError) throw reqError;
      setRequests(payRequests || []);

      const { data: profiles, error: profError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (profError) throw profError;
      setUsers(profiles || []);

    } catch (e: any) {
      toast.error('Erro ao carregar dados admin', e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handlePayment = async (requestId: string, userId: string, processStatus: 'APPROVED' | 'REJECTED', userName: string) => {
    try {
      // Update payment request
      const { error: updateReqError } = await supabase
        .from('payment_requests')
        .update({ status: processStatus })
        .eq('id', requestId);

      if (updateReqError) throw updateReqError;

      // Update user profile status
      if (processStatus === 'APPROVED') {
        const { error: updateProfError } = await supabase
          .from('profiles')
          .update({ 
            status: 'active',
            trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // + 30 days
          })
          .eq('id', userId);
        if (updateProfError) throw updateProfError;
        toast.success(`Pagamento aprovado. Usuário ${userName} ativado por 30 dias.`);
      } else {
        const { error: updateProfError } = await supabase
          .from('profiles')
          .update({ status: 'blocked' })
          .eq('id', userId);
        if (updateProfError) throw updateProfError;
        toast.success(`Pagamento rejeitado. Usuário ${userName} bloqueado.`);
      }

      fetchData();
    } catch (err: any) {
      toast.error('Erro ao processar pagamento', err.message);
    }
  };

  return (
    <div className="space-y-8 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">Admin Dashboard</h2>
          <p className="text-slate-500 font-medium mt-1">Gerenciamento global de usuários e pagamentos.</p>
        </div>
      </div>

      <Card className="rounded-xl border-slate-200 shadow-none overflow-hidden">
        <CardHeader className="bg-slate-50 border-b border-slate-200 px-6 py-4">
          <CardTitle className="font-extrabold text-slate-900 text-lg">Comprovantes e Solicitações de Pagamento</CardTitle>
        </CardHeader>
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="py-4 px-6 text-[11px] font-bold uppercase tracking-wider text-slate-500">Data</TableHead>
              <TableHead className="py-4 px-6 text-[11px] font-bold uppercase tracking-wider text-slate-500">Usuário</TableHead>
              <TableHead className="py-4 px-6 text-[11px] font-bold uppercase tracking-wider text-slate-500">Comprovante</TableHead>
              <TableHead className="py-4 px-6 text-[11px] font-bold uppercase tracking-wider text-slate-500">Status Atual</TableHead>
              <TableHead className="py-4 px-6 text-[11px] font-bold uppercase tracking-wider text-slate-500">Ação</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8">Carregando...</TableCell></TableRow>
            ) : requests.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8 text-slate-500">Nenhuma solicitação.</TableCell></TableRow>
            ) : (
              requests.map((req) => (
                <TableRow key={req.id} className="hover:bg-slate-50/50">
                  <TableCell className="py-4 px-6 text-sm font-medium text-slate-600">{new Date(req.created_at).toLocaleString()}</TableCell>
                  <TableCell className="py-4 px-6">
                    <div className="font-bold text-slate-900">{req.profiles?.name}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{req.profiles?.email}</div>
                  </TableCell>
                  <TableCell className="py-4 px-6">
                    <a href={req.pix_proof_url} target="_blank" rel="noreferrer" className="text-blue-600 font-bold hover:underline">
                      Ver PDF/Imagem
                    </a>
                  </TableCell>
                  <TableCell className="py-4 px-6">
                    {req.status === 'PENDING' ? (
                      <Badge variant="outline" className="bg-amber-100/60 text-amber-900 border-0 font-bold px-2 py-0.5 uppercase tracking-widest text-[10px]">Em Análise</Badge>
                    ) : req.status === 'APPROVED' ? (
                      <Badge variant="outline" className="bg-emerald-100/60 text-emerald-900 border-0 font-bold px-2 py-0.5 uppercase tracking-widest text-[10px]">Aprovado</Badge>
                    ) : (
                      <Badge variant="outline" className="bg-red-100/60 text-red-900 border-0 font-bold px-2 py-0.5 uppercase tracking-widest text-[10px]">Rejeitado</Badge>
                    )}
                    <span className="text-xs ml-2 text-slate-500 font-medium">({req.profiles?.status})</span>
                  </TableCell>
                  <TableCell className="py-4 px-6">
                    {req.status === 'PENDING' && (
                      <div className="flex gap-2">
                        <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 font-bold h-8 text-xs" onClick={() => handlePayment(req.id, req.user_id, 'APPROVED', req.profiles?.name || 'Desconhecido')}>Aprovar</Button>
                        <Button size="sm" variant="destructive" className="font-bold h-8 text-xs" onClick={() => handlePayment(req.id, req.user_id, 'REJECTED', req.profiles?.name || 'Desconhecido')}>Rejeitar</Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      <Card className="rounded-xl border-slate-200 shadow-none overflow-hidden">
        <CardHeader className="bg-slate-50 border-b border-slate-200 px-6 py-4">
          <CardTitle className="font-extrabold text-slate-900 text-lg">Todos os Usuários</CardTitle>
        </CardHeader>
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="py-4 px-6 text-[11px] font-bold uppercase tracking-wider text-slate-500">Nome</TableHead>
              <TableHead className="py-4 px-6 text-[11px] font-bold uppercase tracking-wider text-slate-500">Email</TableHead>
              <TableHead className="py-4 px-6 text-[11px] font-bold uppercase tracking-wider text-slate-500">Role</TableHead>
              <TableHead className="py-4 px-6 text-[11px] font-bold uppercase tracking-wider text-slate-500">Status</TableHead>
              <TableHead className="py-4 px-6 text-[11px] font-bold uppercase tracking-wider text-slate-500">Vencimento</TableHead>
              <TableHead className="py-4 px-6 text-[11px] font-bold uppercase tracking-wider text-slate-500">Link da Loja</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((u) => (
              <TableRow key={u.id} className="hover:bg-slate-50/50">
                <TableCell className="py-4 px-6 font-bold text-slate-900">{u.name}</TableCell>
                <TableCell className="py-4 px-6 font-medium text-slate-600">{u.email}</TableCell>
                <TableCell className="py-4 px-6 text-slate-500 font-medium">{u.role}</TableCell>
                <TableCell className="py-4 px-6">
                  <Badge variant="outline" className={`border-0 font-bold px-2 py-0.5 uppercase tracking-widest text-[10px] ${
                    u.status === 'active' ? 'bg-emerald-100/60 text-emerald-900' :
                    u.status === 'trial' ? 'bg-blue-100/60 text-blue-900' :
                    'bg-red-100/60 text-red-900'
                  }`}>{u.status}</Badge>
                </TableCell>
                <TableCell className="py-4 px-6 text-sm font-medium text-slate-600">{u.trialEndsAt ? new Date(u.trialEndsAt).toLocaleDateString() : 'N/A'}</TableCell>
                <TableCell className="py-4 px-6">
                  <a href={`/storefront/${u.id}`} target="_blank" rel="noreferrer" className="text-blue-600 font-bold hover:underline text-xs">
                    Ir para loja
                  </a>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
