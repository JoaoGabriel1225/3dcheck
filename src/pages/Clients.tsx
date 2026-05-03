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
import { 
  Users, Plus, Edit2, Trash2, Phone, Mail, 
  UserPlus, Search, MessageCircle, TrendingUp, 
  UserCheck, Calendar // Adicionado Calendar para o filtro
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type TimeFilter = 'hoje' | 'semana' | 'mes' | 'todos';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
};

const itemVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: { opacity: 1, x: 0 }
};

export default function Clients() {
  const { profile } = useAuth();
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('mes'); // Novo estado de filtro
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingClientId, setEditingClientId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  const fetchClients = async () => {
    if (!profile) return;
    setLoading(true);
    try {
      // Lógica de data para o filtro
      let startDate = new Date();
      startDate.setHours(0, 0, 0, 0);

      if (timeFilter === 'semana') {
        startDate.setDate(startDate.getDate() - 7);
      } else if (timeFilter === 'mes') {
        startDate.setDate(1);
      } else if (timeFilter === 'todos') {
        startDate = new Date('2000-01-01');
      }

      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('user_id', profile.id)
        .gte('created_at', startDate.toISOString()) // Filtro aplicado na query
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
  }, [profile, timeFilter]); // Recarrega quando o filtro muda

  const totalFiltered = clients.length;

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

  const openWhatsapp = (phone: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    window.open(`https://wa.me/${cleanPhone}`, '_blank');
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
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="space-y-8 pb-10"
    >
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-blue-500 font-bold text-xs uppercase tracking-[0.2em]">
            <Users className="w-4 h-4" />
            CRM & Contatos
          </div>
          <h2 className="text-4xl font-black tracking-tight text-foreground">Clientes</h2>
          <p className="text-muted-foreground font-medium max-w-lg">Gerencie sua base de clientes e acompanhe o crescimento.</p>
        </div>

        {/* SELETOR DE FILTRO TEMPORAL */}
        <div className="flex items-center bg-muted/50 p-1.5 rounded-2xl border border-border overflow-x-auto hide-scrollbar">
           {(['hoje', 'semana', 'mes', 'todos'] as const).map((filter) => (
             <Button 
               key={filter}
               variant="ghost" 
               onClick={() => setTimeFilter(filter)}
               className={`h-9 px-4 rounded-xl text-xs font-bold transition-all relative ${timeFilter === filter ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
             >
               {timeFilter === filter && (
                 <motion.div 
                   layoutId="activeFilter"
                   className="absolute inset-0 bg-background shadow-sm rounded-xl"
                   transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                 />
               )}
               <span className="relative z-10 capitalize">
                 {filter === 'mes' ? 'Mês' : filter === 'semana' ? 'Semana' : filter === 'todos' ? 'Total' : 'Hoje'}
               </span>
             </Button>
           ))}
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="h-12 px-6 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-2xl shadow-lg shadow-blue-600/20 gap-2 transition-all hover:scale-[1.02] active:scale-95">
              <UserPlus className="w-5 h-5" /> Novo Cliente
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md rounded-[2rem] border-border bg-card shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black flex items-center gap-2">
                <UserCheck className="w-6 h-6 text-blue-500" />
                {editingClientId ? 'Editar Perfil' : 'Cadastrar Cliente'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSaveClient} className="space-y-6 pt-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-[10px] font-black uppercase tracking-wider text-muted-foreground ml-1">Nome Completo</Label>
                <input id="name" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Ex: João da Silva" className="flex h-12 w-full rounded-2xl border border-input bg-muted/30 px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-[10px] font-black uppercase tracking-wider text-muted-foreground ml-1">WhatsApp</Label>
                <div className="flex gap-2">
                  <div className="h-12 flex items-center px-4 bg-accent rounded-2xl border border-border font-black text-sm text-muted-foreground">+55</div>
                  <input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} required placeholder="11 99999-9999" className="flex h-12 w-full rounded-2xl border border-input bg-muted/30 px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 flex-1" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-wider text-muted-foreground ml-1">E-mail (Opcional)</Label>
                <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="cliente@exemplo.com" className="flex h-12 w-full rounded-2xl border border-input bg-muted/30 px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" />
              </div>
              <Button type="submit" className="w-full h-14 font-black bg-blue-600 hover:bg-blue-500 text-white rounded-2xl shadow-xl shadow-blue-600/20 text-lg transition-all">
                {editingClientId ? 'SALVAR ALTERAÇÕES' : 'CONFIRMAR CADASTRO'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* MÉTRICAS DA BASE */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <motion.div variants={itemVariants}>
          <Card className="bg-card/50 border-border overflow-hidden relative group">
            <div className="absolute top-0 left-0 w-1 h-full bg-blue-500" />
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Clientes no Período</p>
                <h3 className="text-3xl font-black mt-1">{totalFiltered} <span className="text-blue-500 text-sm">Contatos</span></h3>
              </div>
              <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-500 group-hover:scale-110 transition-transform">
                <Users className="w-6 h-6" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="bg-card/50 border-border overflow-hidden relative group">
            <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Novos do Filtro</p>
                <h3 className="text-3xl font-black mt-1">+{totalFiltered}</h3>
              </div>
              <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-500 group-hover:scale-110 transition-transform">
                <TrendingUp className="w-6 h-6" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* BUSCA E TABELA */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <motion.div variants={itemVariants} className="relative max-w-md w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              placeholder="Buscar por nome ou telefone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex h-12 w-full rounded-2xl border border-input bg-card/50 px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 pl-11 border-border focus:ring-blue-500/20"
            />
          </motion.div>
          {/* Badge informativa do filtro */}
          <span className="text-[10px] uppercase font-black text-muted-foreground bg-muted px-3 py-1.5 rounded-lg flex items-center gap-1.5 self-start md:self-auto border border-border">
             <Calendar className="w-3 h-3" /> {timeFilter}
          </span>
        </div>

        <Card className="border-border bg-card/30 backdrop-blur-sm shadow-xl rounded-[2rem] overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-accent/30 hover:bg-accent/30 border-border border-b">
                  <TableHead className="h-14 px-8 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Nome</TableHead>
                  <TableHead className="h-14 px-8 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Contato</TableHead>
                  <TableHead className="h-14 px-8 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground text-center">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <AnimatePresence mode="popLayout">
                  {loading ? (
                    <TableRow><TableCell colSpan={3} className="text-center py-20 text-muted-foreground animate-pulse font-black tracking-widest uppercase">Sincronizando Base...</TableCell></TableRow>
                  ) : filteredClients.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-20">
                        <div className="flex flex-col items-center gap-4 opacity-40">
                          <Users className="w-12 h-12" />
                          <p className="font-bold">Nenhum cliente no período.</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredClients.map((client) => (
                      <motion.tr
                        layout
                        key={client.id}
                        variants={itemVariants}
                        initial="hidden"
                        animate="visible"
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="group hover:bg-blue-500/5 transition-colors border-border border-b last:border-0"
                      >
                        <TableCell className="px-8 py-5">
                          <div className="font-black text-sm text-foreground uppercase tracking-tight">{client.name}</div>
                          <div className="flex items-center gap-1.5 mt-1 text-[11px] text-muted-foreground font-medium">
                            <Mail className="w-3 h-3" /> {client.email || 'Sem e-mail'}
                          </div>
                        </TableCell>
                        <TableCell className="px-8 py-5">
                          <div className="flex items-center gap-2">
                             <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                             <span className="font-bold text-sm text-foreground">{client.phone}</span>
                          </div>
                        </TableCell>
                        <TableCell className="px-8 py-5">
                          <div className="flex items-center justify-center gap-3">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => openWhatsapp(client.phone)}
                              className="h-10 w-10 rounded-2xl bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white transition-all shadow-sm"
                            >
                              <MessageCircle className="h-5 w-5" />
                            </Button>
                            
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => handleEdit(client)}
                              className="h-10 w-10 rounded-2xl bg-accent text-muted-foreground hover:text-blue-500 hover:bg-blue-500/10 transition-all" 
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>

                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => deleteClient(client.id)}
                              className="h-10 w-10 rounded-2xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all" 
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </motion.tr>
                    ))
                  )}
                </AnimatePresence>
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>
    </motion.div>
  );
}
