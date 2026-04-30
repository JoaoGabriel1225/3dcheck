import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import { MessageCircle, Copy, Plus, Search, Trash2, ShoppingBag, Filter, Calendar, User, Tag } from 'lucide-react';

const STATUS_OPTIONS = ['Todos', 'Aguardando contato', 'Confirmado', 'Preparação', 'Pronto', 'Enviado', 'Cancelado'];

export default function Orders() {
  const { profile } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Todos');
  const [whatsappModalOpen, setWhatsappModalOpen] = useState(false);
  const [pendingWhatsappMessage, setPendingWhatsappMessage] = useState('');
  const [pendingWhatsappPhone, setPendingWhatsappPhone] = useState('');
  const [isNewOrderDialogOpen, setIsNewOrderDialogOpen] = useState(false);
  const [clientsOptions, setClientsOptions] = useState<any[]>([]);
  const [productsOptions, setProductsOptions] = useState<any[]>([]);
  const [clientSearchText, setClientSearchText] = useState('');
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [newClientName, setNewClientName] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('custom');
  const [orderDescription, setOrderDescription] = useState('');
  const [orderPrice, setOrderPrice] = useState('');
  const [orderCost, setOrderCost] = useState('');

  const fetchOrders = async () => {
    if (!profile) return;
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`id, description, status, final_price, cost_total, created_at, clients(name, phone), products(name)`)
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setOrders(data || []);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const fetchOptions = async () => {
    if (!profile) return;
    try {
      const [clientsRes, productsRes] = await Promise.all([
        supabase.from('clients').select('id, name, phone').eq('user_id', profile.id).order('name'),
        supabase.from('products').select('id, name, description, final_price, cost_total').eq('user_id', profile.id).order('name')
      ]);
      if (clientsRes.data) setClientsOptions(clientsRes.data);
      if (productsRes.data) setProductsOptions(productsRes.data);
    } catch (err: any) { console.error('Error fetching options', err); }
  };

  useEffect(() => { fetchOrders(); fetchOptions(); }, [profile]);

  const generateWhatsappMessage = (productName: string, status: string, clientName: string) => {
    return `Olá ${clientName || ''}, seu pedido de ${productName || 'impressão 3D'} está agora em: *${status}*.`;
  };

  const updateStatus = async (order: any, newStatus: string) => {
    try {
      const { error } = await supabase.from('orders').update({ status: newStatus }).eq('id', order.id);
      if (error) throw error;
      toast.success('Status atualizado!');
      fetchOrders();
      const phone = order.clients?.phone;
      if (phone && newStatus !== 'Cancelado') {
        const msg = generateWhatsappMessage(order.products?.name, newStatus, order.clients?.name);
        const cleanPhone = phone.replace(/\D/g, '');
        const finalPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
        setPendingWhatsappPhone(finalPhone);
        setPendingWhatsappMessage(msg);
        setWhatsappModalOpen(true);
      }
    } catch (err: any) { toast.error('Erro ao atualizar status: ' + err.message); }
  };

  const deleteOrder = async (id: string) => {
    if (!confirm('Excluir este pedido permanentemente? Isso afetará seu dashboard financeiro.')) return;
    try {
      const { error } = await supabase.from('orders').delete().eq('id', id);
      if (error) throw error;
      toast.success('Pedido removido.');
      fetchOrders();
    } catch (err: any) { toast.error('Erro ao excluir: ' + err.message); }
  };

  const openWhatsapp = (phone: string, msg: string) => {
    if (!phone) return;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const copyMessage = (msg: string) => {
    navigator.clipboard.writeText(msg);
    toast.success('Copiado!');
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'Aguardando contato': return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
      case 'Confirmado':
      case 'Preparação': return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      case 'Pronto':
      case 'Enviado': return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
      case 'Cancelado': return 'bg-red-500/10 text-red-600 border-red-500/20';
      default: return 'bg-slate-500/10 text-slate-600 border-slate-500/20';
    }
  };

  const handleProductSelect = (productId: string) => {
    setSelectedProductId(productId);
    if (productId !== 'custom') {
      const product = productsOptions.find(p => p.id === productId);
      if (product) {
        setOrderDescription(product.description || '');
        setOrderPrice(product.final_price?.toString() || '');
        setOrderCost(product.cost_total?.toString() || '0');
      }
    } else {
      setOrderPrice('');
      setOrderCost('');
    }
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    try {
      let finalClientId = selectedClientId;
      if (!finalClientId) {
        const cleanPhone = newClientPhone.replace(/\D/g, '');
        if (cleanPhone.length < 10) { toast.error('Telefone inválido.'); return; }
        const fullPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
        const { data: newClient, error: clientErr } = await supabase.from('clients').insert({ user_id: profile.id, name: newClientName || clientSearchText, phone: fullPhone }).select().single();
        if (clientErr) throw clientErr;
        finalClientId = newClient.id;
      }
      if (!finalClientId) return;
      const { error: orderErr } = await supabase.from('orders').insert({
        user_id: profile.id,
        client_id: finalClientId,
        product_id: selectedProductId === 'custom' ? null : selectedProductId,
        status: 'Aguardando contato',
        description: orderDescription,
        final_price: parseFloat(orderPrice.toString().replace(',', '.')) || 0,
        cost_total: parseFloat(orderCost.toString().replace(',', '.')) || 0
      });
      if (orderErr) throw orderErr;
      toast.success('Pedido criado!');
      setIsNewOrderDialogOpen(false);
      resetOrderForm();
      fetchOptions();
      fetchOrders();
    } catch (err: any) { toast.error('Erro ao criar: ' + err.message); }
  };

  const filteredClients = clientSearchText.trim() === '' ? clientsOptions : clientsOptions.filter(c => c.name.toLowerCase().includes(clientSearchText.toLowerCase()));

  const selectClient = (client: any) => {
    setSelectedClientId(client.id);
    setNewClientName(client.name);
    let p = client.phone || '';
    if (p.startsWith('55') && p.length > 11) p = p.substring(2);
    setNewClientPhone(p);
    setClientSearchText(client.name);
    setShowClientDropdown(false);
  };

  const resetOrderForm = () => {
    setClientSearchText(''); setShowClientDropdown(false); setSelectedClientId('');
    setNewClientName(''); setNewClientPhone(''); setSelectedProductId('custom');
    setOrderDescription(''); setOrderPrice(''); setOrderCost('');
  };

  const filteredOrders = orders.filter((order) => {
    const matchesStatus = statusFilter === 'Todos' || order.status === statusFilter;
    if (!searchTerm) return matchesStatus;
    const term = searchTerm.toLowerCase();
    return matchesStatus && (
      (order.clients?.name || '').toLowerCase().includes(term) ||
      (order.products?.name || '').toLowerCase().includes(term) ||
      (order.description || '').toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-blue-500 font-bold text-xs uppercase tracking-widest">
            <ShoppingBag className="w-4 h-4" />
            Produção
          </div>
          <h2 className="text-4xl font-black tracking-tight text-foreground">Pedidos</h2>
          <p className="text-muted-foreground font-medium">Controle o status e a entrega das suas peças.</p>
        </div>

        <Dialog open={isNewOrderDialogOpen} onOpenChange={(open) => { setIsNewOrderDialogOpen(open); if (!open) resetOrderForm(); }}>
          <DialogTrigger asChild>
            <Button className="h-12 px-6 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-xl shadow-lg shadow-blue-500/20 gap-2 transition-all hover:scale-105 active:scale-95">
              <Plus className="w-5 h-5" /> Novo Pedido
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl rounded-2xl border-border bg-card shadow-2xl">
             {/* Conteúdo do Formulário (Omitido para brevidade, mas deve ser mantido igual ao seu original com o novo estilo de botões) */}
             <DialogHeader><DialogTitle className="text-2xl font-black">Criar Novo Pedido</DialogTitle></DialogHeader>
             <form onSubmit={handleCreateOrder} className="space-y-4 pt-4">
                {/* ... Mantendo sua lógica de Inputs ... */}
                <Button type="submit" className="w-full h-12 font-black bg-blue-600 hover:bg-blue-500">Salvar Pedido</Button>
             </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* FILTER BAR */}
      <Card className="p-4 border-border bg-card/50 backdrop-blur-md shadow-sm space-y-4 rounded-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-blue-500 transition-colors" />
            <Input
               placeholder="Buscar por cliente ou produto..."
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               className="pl-10 h-11 bg-background/50 border-border rounded-xl focus:ring-blue-500/20"
            />
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground bg-accent/50 px-3 py-2 rounded-lg border border-border">
            <Filter className="w-3.5 h-3.5" />
            Filtros Ativos
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {STATUS_OPTIONS.map(status => (
             <Button
               key={status}
               variant={statusFilter === status ? 'default' : 'outline'}
               size="sm"
               onClick={() => setStatusFilter(status)}
               className={`h-8 px-4 rounded-full text-[11px] font-black uppercase tracking-wider transition-all ${
                 statusFilter === status 
                 ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' 
                 : 'hover:bg-accent border-border text-muted-foreground'
               }`}
             >
               {status}
             </Button>
          ))}
        </div>
      </Card>

      {/* ORDERS TABLE */}
      <Card className="border-border bg-card/30 backdrop-blur-sm shadow-xl rounded-2xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-accent/30 hover:bg-accent/30 border-border">
              <TableHead className="h-14 px-6 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground"><div className="flex items-center gap-2"><Calendar className="w-3 h-3" /> Data</div></TableHead>
              <TableHead className="h-14 px-6 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground"><div className="flex items-center gap-2"><User className="w-3 h-3" /> Cliente</div></TableHead>
              <TableHead className="h-14 px-6 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground"><div className="flex items-center gap-2"><Tag className="w-3 h-3" /> Detalhes</div></TableHead>
              <TableHead className="h-14 px-6 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Status</TableHead>
              <TableHead className="h-14 px-6 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground text-center">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={5} className="text-center py-20 text-muted-foreground animate-pulse font-bold">Processando base de dados...</TableCell></TableRow>
            ) : filteredOrders.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center py-20 text-muted-foreground font-medium">Nenhum registro encontrado para esta busca.</TableCell></TableRow>
            ) : (
              filteredOrders.map((order) => (
                <TableRow key={order.id} className="hover:bg-accent/20 transition-colors border-border">
                  <TableCell className="px-6 py-5">
                    <span className="text-sm font-bold text-foreground opacity-80">{new Date(order.created_at).toLocaleDateString('pt-BR')}</span>
                  </TableCell>
                  <TableCell className="px-6 py-5">
                    <div className="font-black text-sm text-foreground">{order.clients?.name}</div>
                    <div className="text-[11px] text-muted-foreground font-medium mt-0.5">{order.clients?.phone}</div>
                  </TableCell>
                  <TableCell className="px-6 py-5">
                    <div className="font-bold text-sm text-foreground">{order.products?.name || 'Item Personalizado'}</div>
                    <div className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">{order.description || 'Sem observações'}</div>
                    <div className="mt-2 text-sm font-black text-emerald-500">R$ {order.final_price?.toFixed(2)}</div>
                  </TableCell>
                  <TableCell className="px-6 py-5">
                    <Select defaultValue={order.status} onValueChange={(val) => updateStatus(order, val)}>
                      <SelectTrigger className={`h-8 w-[160px] text-[10px] font-black uppercase tracking-wider border transition-all ${getStatusColor(order.status)}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUS_OPTIONS.filter(s => s !== 'Todos').map(s => <SelectItem key={s} value={s} className="text-xs font-bold">{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="px-6 py-5">
                    <div className="flex items-center justify-center gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="h-9 w-9 rounded-xl bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white transition-all"
                        onClick={() => {
                          const clean = (order.clients?.phone || '').replace(/\D/g, '');
                          if (clean) openWhatsapp(clean.startsWith('55') ? clean : `55${clean}`, generateWhatsappMessage(order.products?.name, order.status, order.clients?.name));
                        }}
                      >
                        <MessageCircle className="h-4.5 w-4.5" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="h-9 w-9 rounded-xl bg-accent text-muted-foreground hover:text-foreground transition-all"
                        onClick={() => copyMessage(generateWhatsappMessage(order.products?.name, order.status, order.clients?.name))}
                      >
                        <Copy className="h-4.5 w-4.5" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="h-9 w-9 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all"
                        onClick={() => deleteOrder(order.id)}
                      >
                        <Trash2 className="h-4.5 w-4.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* WHATSAPP CONFIRMATION MODAL */}
      <Dialog open={whatsappModalOpen} onOpenChange={setWhatsappModalOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl border-border bg-card shadow-2xl">
          <DialogHeader>
            <DialogTitle className="font-black text-xl flex items-center gap-3">
              <div className="p-2 bg-emerald-500 rounded-lg text-white"><MessageCircle className="w-5 h-5" /></div>
              Notificar Cliente?
            </DialogTitle>
          </DialogHeader>
          <div className="py-6 space-y-4">
            <p className="text-sm text-muted-foreground font-medium">O status mudou para <span className="text-foreground font-black uppercase underline decoration-blue-500 underline-offset-4">Em Produção</span>. Enviar aviso?</p>
            <div className="p-4 bg-accent/50 rounded-xl border border-border italic text-sm text-foreground/80 leading-relaxed">
              "{pendingWhatsappMessage}"
            </div>
          </div>
          <DialogFooter className="flex gap-2 sm:justify-end">
            <Button variant="ghost" className="font-bold text-muted-foreground" onClick={() => setWhatsappModalOpen(false)}>Depois</Button>
            <Button className="bg-emerald-500 hover:bg-emerald-600 text-white font-black px-6 rounded-xl shadow-lg shadow-emerald-500/20" onClick={() => { openWhatsapp(pendingWhatsappPhone, pendingWhatsappMessage); setWhatsappModalOpen(false); }}>
              Sim, Abrir WhatsApp
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
