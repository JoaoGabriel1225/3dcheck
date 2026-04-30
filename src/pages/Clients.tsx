import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { Users, Plus, Edit2, Trash2 } from 'lucide-react';

export default function Clients() {
  const { profile } = useAuth();
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingClientId, setEditingClientId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  const fetchClients = async () => {
    if (!profile) return;
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('user_id', profile.id)
        .order('name', { ascending: true });

      if (error) throw error;
      setClients(data || []);
    } catch (e: any) {
      toast.error('Erro ao buscar clientes', e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, [profile]);

  const handleSaveClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    try {
      const cleanPhone = phone.replace(/\D/g, '');
      if (cleanPhone.length < 10) {
        toast.error('Telefone inválido. Verifique o DDD.');
        return;
      }
      const fullPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;

      const payload = {
        user_id: profile.id,
        name,
        phone: fullPhone,
        email: email || null
      };

      if (editingClientId) {
        const { error } = await supabase.from('clients').update(payload).eq('id', editingClientId);
        if (error) throw error;
        toast.success('Cliente atualizado com sucesso.');
      } else {
        const { error } = await supabase.from('clients').insert(payload);
        if (error) throw error;
        toast.success('Cliente criado com sucesso.');
      }

      setIsDialogOpen(false);
      resetForm();
      fetchClients();
    } catch (err: any) {
      toast.error('Erro ao salvar cliente', err.message);
    }
  };

  const handleEdit = (client: any) => {
    setEditingClientId(client.id);
    setName(client.name);
    let p = client.phone || '';
    if (p.startsWith('55') && p.length > 11) {
      p = p.substring(2);
    }
    setPhone(p);
    setEmail(client.email || '');
    setIsDialogOpen(true);
  };

  const deleteClient = async (id: string) => {
    if (!confirm('Deseja realmente excluir este cliente?')) return;
    try {
      const { error } = await supabase.from('clients').delete().eq('id', id);
      if (error) throw error;
      toast.success('Cliente excluído com sucesso.');
      fetchClients();
    } catch (err: any) {
      toast.error('Erro ao excluir', err.message);
    }
  };

  const resetForm = () => {
    setEditingClientId(null);
    setName('');
    setPhone('');
    setEmail('');
  };

  return (
    <div className="space-y-8 max-w-6xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-foreground">Clientes</h2>
          <p className="text-muted-foreground font-medium mt-1">Gerencie sua lista de clientes.</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-primary-foreground font-bold hover:opacity-90 shadow-sm gap-2">
              <Plus className="w-5 h-5" /> Adicionar Cliente
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md rounded-xl">
            <DialogHeader>
              <DialogTitle className="font-extrabold text-foreground">
                {editingClientId ? 'Editar Cliente' : 'Novo Cliente'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSaveClient} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="font-bold text-foreground text-xs uppercase tracking-wider">Nome *</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Ex: João da Silva" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone" className="font-bold text-foreground text-xs uppercase tracking-wider">WhatsApp / Telefone *</Label>
                <div className="flex gap-2">
                  <Input value="+55" disabled className="w-16 bg-muted font-medium text-center px-0" />
                  <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} required placeholder="DDD + Número (ex: 11 99999-9999)" className="flex-1" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="font-bold text-foreground text-xs uppercase tracking-wider">Email (Opcional)</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Ex: joao@email.com" />
              </div>
              
              <div className="pt-4">
                <Button type="submit" className="w-full font-bold bg-primary text-primary-foreground hover:opacity-90">
                  {editingClientId ? 'Salvar Alterações' : 'Cadastrar Cliente'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="rounded-xl border border-border shadow-sm overflow-x-auto bg-card transition-colors">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted hover:bg-muted">
              <TableHead className="py-4 px-5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Nome</TableHead>
              <TableHead className="py-4 px-5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Telefone</TableHead>
              <TableHead className="py-4 px-5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Email</TableHead>
              <TableHead className="py-4 px-5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground w-24">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={4} className="text-center py-8">Carregando...</TableCell></TableRow>
            ) : clients.length === 0 ? (
              <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Nenhum cliente cadastrado.</TableCell></TableRow>
            ) : (
              clients.map((client) => (
                <TableRow key={client.id} className="hover:bg-muted/50">
                  <TableCell className="py-4 px-5 font-bold text-foreground">{client.name}</TableCell>
                  <TableCell className="py-4 px-5 font-medium text-foreground">{client.phone}</TableCell>
                  <TableCell className="py-4 px-5 font-medium text-muted-foreground">{client.email || '-'}</TableCell>
                  <TableCell className="py-4 px-5">
                    <div className="flex gap-2">
                      <Button variant="secondary" size="icon" className="h-8 w-8 rounded-md bg-background hover:bg-muted shadow-sm" onClick={() => handleEdit(client)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button variant="destructive" size="icon" className="h-8 w-8 rounded-md shadow-sm" onClick={() => deleteClient(client.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
