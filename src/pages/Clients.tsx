import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { Users, Plus, Edit2, Trash2, Phone, Mail, UserPlus, Search } from 'lucide-react';

export default function Clients() {
  const { profile } = useAuth();
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
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
      toast.error('Erro ao buscar clientes');
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
        toast.success('Cliente atualizado!');
      } else {
        const { error } = await supabase.from('clients').insert(payload);
        if (error) throw error;
        toast.success('Cliente cadastrado!');
      }

      setIsDialogOpen(false);
      resetForm();
      fetchClients();
    } catch (err: any) {
      toast.error('Erro ao salvar cliente');
    }
  };

  const handleEdit = (client: any) => {
    setEditingClientId(client.id);
    setName(client.name);
    let p = client.phone || '';
    if (p.startsWith('55') && p.length > 11) p = p.substring(2);
    setPhone(p);
    setEmail(client.email || '');
    setIsDialogOpen(true);
  };

  const deleteClient = async (id: string) => {
    if (!confirm('Deseja realmente excluir este cliente?')) return;
    try {
      const { error } = await supabase.from('clients').delete().eq('id', id);
      if (error) throw error;
      toast.success('Cliente removido.');
      fetchClients();
    } catch (err: any) {
      toast.error('Erro ao excluir');
    }
  };

  const resetForm = () => {
    setEditingClientId(null);
    setName('');
    setPhone('');
    setEmail('');
  };

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.phone.includes(searchTerm)
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-blue-500 font-bold text-xs uppercase tracking-[0.2em]">
            <Users className="w-4 h-4" />
            Base de Contatos
          </div>
          <h2 className="text-4xl font-black tracking-tight text-foreground">Clientes</h2>
          <p className="text-muted-foreground font-medium">Gerencie sua lista de contatos e histórico de pedidos.</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="h-12 px-6 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-xl shadow-lg shadow-blue-500/20 gap-2 transition-all hover:scale-105 active:scale-95">
              <UserPlus className="w-5 h-5" /> Adicionar Cliente
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md rounded-2xl border-border bg-card shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black">
                {editingClientId ? 'Editar Perfil' : 'Novo Cliente'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSaveClient} className="space-y-6 pt-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Nome Completo</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Ex: João da Silva" className="h-11 rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">WhatsApp (DDD + Número)</Label>
                <div className="flex gap-2">
                  <div className="h-11 flex items-center px-3 bg-accent rounded-xl border border-border font-bold text-sm text-muted-foreground">+55</div>
                  <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} required placeholder="11 99999-9999" className="h-11 rounded-xl flex-1" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Email de Contato</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="cliente@exemplo.com" className="h-11 rounded-xl" />
              </div>
              
              <div className="pt-2">
                <Button type="submit" className="w-full h-12 font-black bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-lg shadow-blue-500/20 transition-all">
                  {editingClientId ? 'Salvar Alterações' : 'Finalizar Cadastro'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* SEARCH BAR */}
      <Card className="p-4 border-border bg-card/50 backdrop-blur-md rounded-2xl max-w-md group focus-within:border-blue-500/50 transition-all">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-blue-500 transition-colors" />
          <Input
            placeholder="Pesquisar por nome ou telefone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 border-none bg-transparent shadow-none focus-visible:ring-0"
          />
        </div>
      </Card>

      {/* CLIENTS TABLE */}
      <Card className="border-border bg-card/30 backdrop-blur-sm shadow-xl rounded-2xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-accent/30 hover:bg-accent/30 border-border">
              <TableHead className="h-14 px-6 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Nome do Cliente</TableHead>
              <TableHead className="h-14 px-6 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground"><div className="flex items-center gap-2"><Phone className="w-3 h-3" /> WhatsApp</div></TableHead>
              <TableHead className="h-14 px-6 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground"><div className="flex items-center gap-2"><Mail className="w-3 h-3" /> Email</div></TableHead>
              <TableHead className="h-14 px-6 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground text-center">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={4} className="text-center py-20 text-muted-foreground animate-pulse font-bold tracking-widest">Sincronizando dados...</TableCell></TableRow>
            ) : filteredClients.length === 0 ? (
              <TableRow><TableCell colSpan={4} className="text-center py-20 text-muted-foreground font-medium">Nenhum cliente encontrado na sua base.</TableCell></TableRow>
            ) : (
              filteredClients.map((client) => (
                <TableRow key={client.id} className="hover:bg-accent/20 transition-colors border-border">
                  <TableCell className="px-6 py-5">
                    <div className="font-black text-sm text-foreground tracking-tight">{client.name}</div>
                  </TableCell>
                  <TableCell className="px-6 py-5">
                    <div className="font-bold text-sm text-foreground opacity-80">{client.phone}</div>
                  </TableCell>
                  <TableCell className="px-6 py-5 font-medium text-muted-foreground text-sm">
                    {client.email || <span className="opacity-30 italic text-xs">Não informado</span>}
                  </TableCell>
                  <TableCell className="px-6 py-5">
                    <div className="flex items-center justify-center gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-9 w-9 rounded-xl bg-accent text-muted-foreground hover:text-blue-500 hover:bg-blue-500/10 transition-all" 
                        onClick={() => handleEdit(client)}
                        title="Editar Perfil"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-9 w-9 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-sm" 
                        onClick={() => deleteClient(client.id)}
                        title="Remover Cliente"
                      >
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
