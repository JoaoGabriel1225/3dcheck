import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom'; 
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
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
import { 
  MessageCircle, Plus, Search, Trash2, ShoppingBag, Filter, 
  Calendar, User, Tag, Package, Activity, Clock, CheckCircle2,
  Sparkles, Info, DollarSign, TrendingUp // CORREÇÃO: Adicionados os ícones que estavam faltando
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const STATUS_OPTIONS = ['Todos', 'Aguardando contato', 'Confirmado', 'Preparação', 'Pronto', 'Enviado', 'Cancelado'];
type TimeFilter = 'hoje' | 'semana' | 'mes' | 'todos';

// 50 Frases de Maker/3D para dar vida ao app
const MAKER_PHRASES = [
  "Nivelar a mesa é a meditação do maker.", "Impressora parada não gera lucro!", "PLA: o cheiro do sucesso logo cedo.",
  "Primeira camada perfeita = Dia feliz.", "Suporte é igual imposto: ninguém gosta, mas precisa.", "Fatiar é uma arte, imprimir é uma virtude.",
  "Seu limite é o volume de impressão.", "Calibre o extrusor e conquiste o mundo.", "Sticks e Stringing são o terror dos makers.",
  "Impressão 3D: onde o digital vira real.", "Cuidado: área com alta concentração de criatividade.", "O bico entupiu? Respira fundo.",
  "A aderência da mesa é o segredo do sucesso.", "Modelar, fatiar, imprimir, repetir.", "Maker que é maker tem balde de restos.",
  "Sua criatividade não precisa de suportes.", "Cada erro é um aprendizado em resina.", "Transformando filamento em sonhos.",
  "Mesa quente, coração gelado.", "Um olho no G-Code, outro no bico.", "Filamento acabando no meio da noite? Quem nunca.",
  "3DCheck: sua fábrica no seu bolso.", "Mantenha a mesa limpa e os lucros altos.", "Impressora 3D: a magia de criar átomos.",
  "Infill de 10% é para os fracos? Depende da peça.", "Paciência é a base de qualquer impressão longa.", "O PWA é leve, sua criatividade é pesada.",
  "Menos warping, mais faturamento.", "O mundo é feito de camadas.", "A próxima peça será a melhor de todas.",
  "Filamento seco é cliente satisfeito.", "Z-Offset: o ajuste fino da vida.", "Maker de verdade entende de eletrônica.",
  "Sua oficina, suas regras.", "Velocidade ou Qualidade? O dilema eterno.", "A tecnologia 3D é o futuro hoje.",
  "Imprima felicidade, entregue qualidade.", "Organização é o segredo da escala.", "Clientes amam o detalhe.",
  "Quanto mais camadas, mais história.", "Fatiador atualizado, mente em paz.", "O design é a alma da impressão.",
  "Impressão em progresso... Não toque!", "A luz acabou? Oremos pelo Retomar Impressão.", "Sua marca, sua peça, seu legado.",
  "Pense em 3D, execute em alta definição.", "Cada cliente é um novo desafio.", "Dashboard atualizado, produção garantida.",
  "Maker: o inventor dos tempos modernos.", "O sucesso está no detalhe da última camada."
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 }
};

export default function Orders() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams(); 
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Todos');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('todos'); 
  const [randomPhrase, setRandomPhrase] = useState('');

  const [whatsappModalOpen, setWhatsappModalOpen] = useState(false);
  const [pendingWhatsappMessage, setPendingWhatsappMessage] = useState('');
  const [pendingWhatsappPhone, setPendingWhatsappPhone] = useState('');
  const [isNewOrderDialogOpen, setIsNewOrderDialogOpen] = useState(false);
  
  const [clientsOptions, setClientsOptions] = useState<any[]>([]);
  const [productsOptions, setProductsOptions] = useState<any[]>([]);
  const [clientSearchText, setClientSearchText] = useState('');
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [productSearchText, setProductSearchText] = useState('');
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  
  const [selectedClientId, setSelectedClientId] = useState('');
  const [newClientName, setNewClientName] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('custom');
  const [orderDescription, setOrderDescription] = useState('');
  const [orderPrice, setOrderPrice] = useState('');
  const [orderCost, setOrderCost] = useState('');

  useEffect(() => {
    setRandomPhrase(MAKER_PHRASES[Math.floor(Math.random() * MAKER_PHRASES.length)]);
  }, []);

  useEffect(() => {
    const statusParam = searchParams.get('status');
    if (statusParam && STATUS_OPTIONS.includes(statusParam)) {
      setStatusFilter(statusParam);
    }
  }, [searchParams]);

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

  // Cálculos de Volume Simplificados
  const totalCount = orders.length;
  const aguardandoCount = orders.filter(o => ['Aguardando contato', 'Confirmado'].includes(o.status)).length;
  const emProducaoCount = orders.filter(o => o.status === 'Preparação').length;
  const prontosCount = orders.filter(o => o.status === 'Pronto').length;

  // CORREÇÃO: O reduce estava usando 'o', corrigido para 'curr' que é o parâmetro definido
  const openOrders = orders.filter(o => !['Enviado', 'Cancelado'].includes(o.status));
  const vgvAberto = openOrders.reduce((acc, curr) => acc + (Number(curr.final_price) || 0), 0);

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
      if (phone && !['Cancelado', 'Enviado'].includes(newStatus)) {
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

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'Aguardando contato': return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
      case 'Confirmado':
      case 'Preparação': return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      case 'Pronto': return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
      case 'Enviado': return 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20';
      case 'Cancelado': return 'bg-red-500/10 text-red-600 border-red-500/20';
      default: return 'bg-slate-500/10 text-slate-600 border-slate-500/20';
    }
  };

  const selectProduct = (product: any) => {
    setSelectedProductId(product.id);
    setProductSearchText(product.name);
    setOrderDescription(product.description || '');
    setOrderPrice(product.final_price?.toString() || '');
    setOrderCost(product.cost_total?.toString() || '0');
    setShowProductDropdown(false);
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

  const filteredClients = clientSearchText.trim() === '' ? [] : clientsOptions.filter(c => c.name.toLowerCase().includes(clientSearchText.toLowerCase()));
  const filteredProducts = productSearchText.trim() === '' ? [] : productsOptions.filter(p => p.name.toLowerCase().includes(productSearchText.toLowerCase()));

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
    setProductSearchText(''); setShowProductDropdown(false);
    setNewClientName(''); setNewClientPhone(''); setSelectedProductId('custom');
    setOrderDescription(''); setOrderPrice(''); setOrderCost('');
  };

  const filteredOrders = orders.filter((order) => {
    const matchesStatus = statusFilter === 'Todos' || order.status === statusFilter;
    const orderDate = new Date(order.created_at);
    const now = new Date();
    let matchesTime = true;
    if (timeFilter === 'hoje') matchesTime = orderDate.toDateString() === now.toDateString();
    else if (timeFilter === 'semana') {
      const weekAgo = new Date(); weekAgo.setDate(now.getDate() - 7);
      matchesTime = orderDate >= weekAgo;
    } else if (timeFilter === 'mes') matchesTime = orderDate.getMonth() === now.getMonth() && orderDate.getFullYear() === now.getFullYear();

    if (!searchTerm) return matchesStatus && matchesTime;
    const term = searchTerm.toLowerCase();
    return matchesStatus && matchesTime && (
      (order.clients?.name || '').toLowerCase().includes(term) ||
      (order.products?.name || '').toLowerCase().includes(term) ||
      (order.description || '').toLowerCase().includes(term)
    );
  });

  return (
    <motion.div initial="hidden" animate="visible" variants={containerVariants} className="space-y-8 pb-10 px-1 md:px-0">
      
      {/* FRASES ALEATÓRIAS - VIDA AO APP */}
      <motion.div variants={itemVariants} className="bg-blue-600/5 border border-blue-500/10 p-4 rounded-2xl flex items-center gap-4">
        <div className="bg-blue-600 p-2 rounded-lg text-white shadow-lg shadow-blue-600/20">
          <Sparkles className="w-5 h-5" />
        </div>
        <p className="text-sm font-bold text-blue-700/80 italic leading-relaxed">
          "{randomPhrase}"
        </p>
      </motion.div>

      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-blue-500 font-bold text-xs uppercase tracking-widest">
            <ShoppingBag className="w-4 h-4" />
            Produção Operacional
          </div>
          <h2 className="text-4xl font-black tracking-tight text-foreground">Pedidos</h2>
          <p className="text-muted-foreground font-medium">Controle o status e a entrega das suas peças.</p>
        </div>

        <Dialog open={isNewOrderDialogOpen} onOpenChange={(open) => { setIsNewOrderDialogOpen(open); if (!open) resetOrderForm(); }}>
          <DialogTrigger asChild>
            <Button className="h-12 px-6 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-xl shadow-lg shadow-blue-600/20 gap-2 transition-all hover:scale-[1.02] active:scale-95">
              <Plus className="w-5 h-5" /> Novo Pedido
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl rounded-[2rem] border-border bg-card shadow-2xl p-0 overflow-hidden">
            <DialogHeader className="p-8 pb-0">
                <DialogTitle className="text-2xl font-black flex items-center gap-2">
                    <div className="p-2 bg-blue-500 rounded-lg text-white"><Plus className="w-5 h-5" /></div>
                    Criar Novo Pedido
                </DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleCreateOrder} className="p-8 pt-6 space-y-6 overflow-y-auto max-h-[80vh]">
              <div className="space-y-4">
                <Label className="text-[10px] font-black uppercase text-blue-500 tracking-[0.2em] flex items-center gap-2">
                  <User className="w-3 h-3" /> Identificação do Cliente
                </Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="relative">
                        <Input 
                            placeholder="Pesquisar ou Nome do Cliente..." 
                            value={clientSearchText}
                            onChange={(e) => {
                                setClientSearchText(e.target.value);
                                setNewClientName(e.target.value);
                                setSelectedClientId('');
                                setShowClientDropdown(true);
                            }}
                            onFocus={() => setShowClientDropdown(true)}
                            className="h-12 rounded-xl"
                        />
                        {showClientDropdown && filteredClients.length > 0 && (
                            <div className="absolute z-[60] w-full mt-2 bg-card border border-border rounded-xl shadow-xl max-h-40 overflow-y-auto">
                                {filteredClients.map(c => (
                                    <div 
                                        key={c.id} 
                                        onClick={() => selectClient(c)}
                                        className="p-3 hover:bg-accent cursor-pointer flex justify-between items-center transition-colors"
                                    >
                                        <span className="font-bold text-sm">{c.name}</span>
                                        <span className="text-[10px] opacity-50">{c.phone}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-black opacity-30">+55</span>
                        <Input 
                            placeholder="WhatsApp (com DDD)" 
                            value={newClientPhone}
                            onChange={(e) => setNewClientPhone(e.target.value.replace(/\D/g, ''))}
                            className="h-12 pl-12 rounded-xl"
                            maxLength={11}
                        />
                    </div>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-border">
                <Label className="text-[10px] font-black uppercase text-blue-500 tracking-[0.2em] flex items-center gap-2">
                  <Package className="w-3 h-3" /> Peça e Especificações
                </Label>
                <div className="relative">
                    <Input 
                        placeholder="Pesquisar produto ou item personalizado..." 
                        value={productSearchText}
                        onChange={(e) => {
                            setProductSearchText(e.target.value);
                            setOrderDescription(e.target.value);
                            setSelectedProductId('custom');
                            setShowProductDropdown(true);
                        }}
                        onFocus={() => setShowProductDropdown(true)}
                        className="h-12 rounded-xl pr-10"
                    />
                    <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground opacity-50" />
                    
                    {showProductDropdown && filteredProducts.length > 0 && (
                        <div className="absolute z-[60] w-full mt-2 bg-card border border-border rounded-xl shadow-xl max-h-40 overflow-y-auto">
                            {filteredProducts.map(p => (
                                <div 
                                    key={p.id} 
                                    onClick={() => selectProduct(p)}
                                    className="p-3 hover:bg-accent cursor-pointer flex flex-col transition-colors border-b border-border last:border-0"
                                >
                                    <span className="font-bold text-sm">{p.name}</span>
                                    <span className="text-[10px] opacity-50">Preço Sugerido: R$ {p.final_price?.toFixed(2)}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                <Textarea 
                    placeholder="Detalhes adicionais do pedido (cor, escala, material...)" 
                    value={orderDescription}
                    onChange={(e) => setOrderDescription(e.target.value)}
                    className="rounded-xl min-h-[80px]"
                />
              </div>

              <div className="space-y-4 pt-4 border-t border-border">
                <Label className="text-[10px] font-black uppercase text-blue-500 tracking-[0.2em] flex items-center gap-2">
                  <DollarSign className="w-3 h-3" /> Resumo Financeiro
                </Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <Label className="text-[9px] font-bold uppercase opacity-60 ml-1">Preço Total Acordado (R$)</Label>
                        <Input 
                            type="text"
                            placeholder="0,00" 
                            value={orderPrice}
                            onChange={(e) => setOrderPrice(e.target.value)}
                            className="h-12 rounded-xl font-black text-emerald-500 text-lg"
                        />
                    </div>
                </div>
              </div>

              <DialogFooter className="pt-4">
                <Button type="submit" className="w-full h-16 bg-blue-600 hover:bg-blue-500 text-white font-black text-xl rounded-2xl shadow-xl shadow-blue-500/20 transition-all active:scale-95">
                  SALVAR PEDIDO
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* NOVOS 4 CARDS DE VOLUME - SIMPLICIDADE E OPERAÇÃO */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <motion.div variants={itemVariants}>
            <Card className="bg-card/50 border-border overflow-hidden relative border-l-4 border-l-slate-400">
              <CardContent className="p-4 md:p-6">
                <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Total Pedidos</p>
                <h3 className="text-xl md:text-3xl font-black mt-1">{totalCount} <span className="text-xs text-muted-foreground">UN.</span></h3>
                <Package className="absolute right-4 bottom-4 w-10 h-10 opacity-5" />
              </CardContent>
            </Card>
          </motion.div>
          <motion.div variants={itemVariants}>
            <Card className="bg-card/50 border-border overflow-hidden relative border-l-4 border-l-amber-500">
              <CardContent className="p-4 md:p-6">
                <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Aguardando</p>
                <h3 className="text-xl md:text-3xl font-black mt-1">{aguardandoCount} <span className="text-xs text-muted-foreground">UN.</span></h3>
                <Clock className="absolute right-4 bottom-4 w-10 h-10 opacity-5" />
              </CardContent>
            </Card>
          </motion.div>
          <motion.div variants={itemVariants}>
            <Card className="bg-card/50 border-border overflow-hidden relative border-l-4 border-l-blue-500">
              <CardContent className="p-4 md:p-6">
                <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Em Produção</p>
                <h3 className="text-xl md:text-3xl font-black mt-1">{emProducaoCount} <span className="text-xs text-muted-foreground">UN.</span></h3>
                <Activity className="absolute right-4 bottom-4 w-10 h-10 opacity-5" />
              </CardContent>
            </Card>
          </motion.div>
          <motion.div variants={itemVariants}>
            <Card className="bg-card/50 border-border overflow-hidden relative border-l-4 border-l-emerald-500">
              <CardContent className="p-4 md:p-6">
                <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Prontos</p>
                <h3 className="text-xl md:text-3xl font-black mt-1">{prontosCount} <span className="text-xs text-muted-foreground">UN.</span></h3>
                <CheckCircle2 className="absolute right-4 bottom-4 w-10 h-10 opacity-5" />
              </CardContent>
            </Card>
          </motion.div>
      </div>

      {/* FILTER BAR */}
      <Card className="p-4 border-border bg-card/50 backdrop-blur-md shadow-sm space-y-4 rounded-2xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-blue-500 transition-colors" />
            <Input
                placeholder="Buscar por cliente ou produto..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-11 bg-background/50 border-border rounded-xl"
            />
          </div>
          <div className="flex items-center bg-muted/30 p-1 rounded-xl border border-border self-start">
            {(['hoje', 'semana', 'mes', 'todos'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTimeFilter(t)}
                className={`px-3 py-1.5 text-[10px] font-black uppercase transition-all rounded-lg ${timeFilter === t ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
              >
                {t === 'todos' ? 'Total' : t}
              </button>
            ))}
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2 pt-2 border-t border-border/50 overflow-x-auto hide-scrollbar">
          {STATUS_OPTIONS.map(status => (
             <Button
                key={status}
                variant={statusFilter === status ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter(status)}
                className={`h-8 px-4 rounded-full text-[10px] font-black uppercase tracking-wider transition-all whitespace-nowrap ${
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

      {/* NOVO FORMATO: CARDS PARA CELULAR / TABELA PARA DESKTOP */}
      <div className="space-y-4">
        {/* VIEW MOBILE: CARDS */}
        <div className="grid grid-cols-1 gap-4 md:hidden">
          <AnimatePresence mode="popLayout">
            {loading ? (
              <p className="text-center py-10 font-bold text-muted-foreground animate-pulse">CARREGANDO...</p>
            ) : filteredOrders.length === 0 ? (
              <p className="text-center py-10 text-muted-foreground">Nenhum pedido encontrado.</p>
            ) : (
              filteredOrders.map((order) => (
                <motion.div
                  key={order.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-card border border-border rounded-3xl p-5 space-y-4 shadow-sm"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-1">{new Date(order.created_at).toLocaleDateString('pt-BR')}</p>
                      <h4 className="font-black text-foreground uppercase text-sm">{order.clients?.name}</h4>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase border ${getStatusColor(order.status)}`}>
                      {order.status}
                    </div>
                  </div>
                  
                  <div className="bg-muted/30 p-3 rounded-2xl flex items-center gap-3">
                    <Package className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs font-bold text-foreground leading-none">{order.products?.name || 'Personalizado'}</p>
                      <p className="text-[10px] text-muted-foreground mt-1 italic line-clamp-1">{order.description || 'Sem obs.'}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <span className="text-lg font-black text-emerald-500">R$ {order.final_price?.toFixed(2)}</span>
                    <div className="flex gap-2">
                      <Button 
                        size="icon" variant="ghost" className="h-10 w-10 rounded-2xl bg-emerald-500/10 text-emerald-500"
                        onClick={() => {
                          const clean = (order.clients?.phone || '').replace(/\D/g, '');
                          if (clean) openWhatsapp(clean.startsWith('55') ? clean : `55${clean}`, generateWhatsappMessage(order.products?.name, order.status, order.clients?.name));
                        }}
                      >
                        <MessageCircle className="w-5 h-5" />
                      </Button>
                      <Select defaultValue={order.status} onValueChange={(val) => updateStatus(order, val)}>
                        <SelectTrigger className="h-10 w-10 p-0 rounded-2xl bg-accent flex justify-center border-none">
                          <Activity className="w-4 h-4" />
                        </SelectTrigger>
                        <SelectContent>
                          {STATUS_OPTIONS.filter(s => s !== 'Todos').map(s => <SelectItem key={s} value={s} className="text-xs font-bold">{s}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <Button 
                        size="icon" variant="ghost" className="h-10 w-10 rounded-2xl bg-red-500/10 text-red-500"
                        onClick={() => deleteOrder(order.id)}
                      >
                        <Trash2 className="w-5 h-5" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>

        {/* VIEW DESKTOP: TABELA */}
        <Card className="hidden md:block border-border bg-card/30 backdrop-blur-sm shadow-xl rounded-2xl overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-accent/30 hover:bg-accent/30 border-border border-b">
                <TableHead className="h-14 px-6 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Data</TableHead>
                <TableHead className="h-14 px-6 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Cliente</TableHead>
                <TableHead className="h-14 px-6 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Pedido</TableHead>
                <TableHead className="h-14 px-6 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Status</TableHead>
                <TableHead className="h-14 px-6 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground text-center">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <AnimatePresence mode="popLayout">
                {loading ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-20 text-muted-foreground animate-pulse font-black uppercase tracking-widest">Sincronizando Operação...</TableCell></TableRow>
                ) : filteredOrders.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-20 text-muted-foreground font-medium">Nenhum pedido encontrado.</TableCell></TableRow>
                ) : (
                  filteredOrders.map((order) => (
                    <motion.tr layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} key={order.id} className="hover:bg-blue-500/5 transition-colors border-border border-b last:border-0">
                      <TableCell className="px-6 py-5">
                        <span className="text-xs font-bold text-foreground opacity-80">{new Date(order.created_at).toLocaleDateString('pt-BR')}</span>
                      </TableCell>
                      <TableCell className="px-6 py-5">
                        <div className="font-black text-sm text-foreground uppercase tracking-tight">{order.clients?.name}</div>
                        <div className="text-[10px] text-muted-foreground font-medium mt-0.5">{order.clients?.phone}</div>
                      </TableCell>
                      <TableCell className="px-6 py-5">
                        <div className="font-bold text-sm text-foreground">{order.products?.name || 'Personalizado'}</div>
                        <div className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5 italic">{order.description || 'Sem obs.'}</div>
                        <div className="mt-2 text-xs font-black text-emerald-500">R$ {order.final_price?.toFixed(2)}</div>
                      </TableCell>
                      <TableCell className="px-6 py-5">
                        <Select defaultValue={order.status} onValueChange={(val) => updateStatus(order, val)}>
                          <SelectTrigger className={`h-8 w-[150px] text-[9px] font-black uppercase tracking-wider border transition-all ${getStatusColor(order.status)}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {STATUS_OPTIONS.filter(s => s !== 'Todos').map(s => <SelectItem key={s} value={s} className="text-xs font-bold">{s}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="px-6 py-5 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Button 
                            variant="ghost" size="icon" className="h-9 w-9 rounded-xl bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white transition-all"
                            onClick={() => {
                              const clean = (order.clients?.phone || '').replace(/\D/g, '');
                              if (clean) openWhatsapp(clean.startsWith('55') ? clean : `55${clean}`, generateWhatsappMessage(order.products?.name, order.status, order.clients?.name));
                            }}
                          >
                            <MessageCircle className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" size="icon" className="h-9 w-9 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all"
                            onClick={() => deleteOrder(order.id)}
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
        </Card>
      </div>

      {/* WHATSAPP MODAL */}
      <Dialog open={whatsappModalOpen} onOpenChange={setWhatsappModalOpen}>
        <DialogContent className="sm:max-w-md rounded-[2rem] border-border bg-card shadow-2xl">
          <DialogHeader>
            <DialogTitle className="font-black text-xl flex items-center gap-3">
              <div className="p-2 bg-emerald-500 rounded-lg text-white"><MessageCircle className="w-5 h-5" /></div>
              Notificar Cliente?
            </DialogTitle>
          </DialogHeader>
          <div className="py-6 space-y-4">
            <p className="text-sm text-muted-foreground font-medium leading-relaxed">Deseja avisar ao cliente sobre a atualização do pedido?</p>
            <div className="p-4 bg-accent/50 rounded-xl border border-border italic text-xs text-foreground/80 leading-relaxed">
              "{pendingWhatsappMessage}"
            </div>
          </div>
          <DialogFooter className="flex gap-2 sm:justify-end">
            <Button variant="ghost" className="font-bold text-muted-foreground" onClick={() => setWhatsappModalOpen(false)}>Depois</Button>
            <Button className="bg-emerald-500 hover:bg-emerald-600 text-white font-black px-6 rounded-xl shadow-lg shadow-emerald-500/20" onClick={() => { openWhatsapp(pendingWhatsappPhone, pendingWhatsappMessage); setWhatsappModalOpen(false); }}>
              Enviar WhatsApp
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
