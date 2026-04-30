import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
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
import { MessageCircle, Copy, Plus } from 'lucide-react';

export default function Orders() {
  const { profile } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Auto trigger WhatsApp modal state
  const [whatsappModalOpen, setWhatsappModalOpen] = useState(false);
  const [pendingWhatsappMessage, setPendingWhatsappMessage] = useState('');
  const [pendingWhatsappPhone, setPendingWhatsappPhone] = useState('');

  // New Order State
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

  const fetchOrders = async () => {
    if (!profile) return;
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id, description, status, final_price, created_at,
          clients(name, phone),
          products(name)
        `)
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchOptions = async () => {
    if (!profile) return;
    try {
      const [clientsRes, productsRes] = await Promise.all([
        supabase.from('clients').select('id, name, phone').eq('user_id', profile.id).order('name'),
        supabase.from('products').select('id, name, description, final_price').eq('user_id', profile.id).order('name')
      ]);
      if (clientsRes.data) setClientsOptions(clientsRes.data);
      if (productsRes.data) setProductsOptions(productsRes.data);
    } catch (err: any) {
      console.error('Error fetching options', err);
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchOptions();
  }, [profile]);

  const generateWhatsappMessage = (productName: string, status: string, clientName: string) => {
    return `Olá ${clientName || ''}, seu pedido de ${productName || 'impressão 3D'} está agora em: ${status}.`;
  };

  const updateStatus = async (order: any, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', order.id);

      if (error) throw error;
      toast.success('Status atualizado!');
      fetchOrders();

      const phone = order.clients?.phone;
      if (phone) {
        const msg = generateWhatsappMessage(order.products?.name, newStatus, order.clients?.name);
        const cleanPhone = phone.replace(/\D/g, '');
        const finalPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
        setPendingWhatsappPhone(finalPhone);
        setPendingWhatsappMessage(msg);
        setWhatsappModalOpen(true);
      }
    } catch (err: any) {
      toast.error('Erro ao atualizar status', err.message);
    }
  };

  const openWhatsapp = (phone: string, msg: string) => {
    if (!phone) return;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const copyMessage = (msg: string) => {
    navigator.clipboard.writeText(msg);
    toast.success('Mensagem copiada!');
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'Aguardando contato': return 'bg-amber-100/60 text-amber-900 font-bold hover:bg-amber-100 dark:bg-amber-500/20 dark:text-amber-500';
      case 'Confirmado':
      case 'Preparação': return 'bg-blue-100/60 text-blue-900 font-bold hover:bg-blue-100 dark:bg-blue-500/20 dark:text-blue-500';
      case 'Pronto':
      case 'Enviado': return 'bg-emerald-100/60 text-emerald-900 font-bold hover:bg-emerald-100 dark:bg-emerald-500/20 dark:text-emerald-500';
      case 'Cancelado': return 'bg-red-100/60 text-red-900 font-bold hover:bg-red-100 dark:bg-red-500/20 dark:text-red-500';
      default: return 'bg-muted font-bold text-foreground';
    }
  };

  const handleProductSelect = (productId: string) => {
    setSelectedProductId(productId);
    if (productId !== 'custom') {
      const product = productsOptions.find(p => p.id === productId);
      if (product) {
        setOrderDescription(product.description || '');
        setOrderPrice(product.final_price?.toString() || '');
      }
    }
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    
    try {
      let finalClientId = selectedClientId;
      if (!finalClientId) {
        // Create new client
        const cleanPhone = newClientPhone.replace(/\D/g, '');
        if (cleanPhone.length < 10) {
          toast.error('Telefone inválido. Inclua o DDD.');
          return;
        }
        const fullPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;

        const { data: newClient, error: clientErr } = await supabase
          .from('clients')
          .insert({
            user_id: profile.id,
            name: newClientName || clientSearchText,
            phone: fullPhone
          })
          .select()
          .single();
        if (clientErr) throw clientErr;
        finalClientId = newClient.id;
      }

      if (!finalClientId) {
        toast.error('Selecione ou crie um cliente!');
        return;
      }

      const { error: orderErr } = await supabase
        .from('orders')
        .insert({
          user_id: profile.id,
          client_id: finalClientId,
          product_id: selectedProductId === 'custom' ? null : selectedProductId,
          status: 'Aguardando contato',
          description: orderDescription,
          final_price: parseFloat(orderPrice) || 0
        });

      if (orderErr) throw orderErr;
      toast.success('Pedido criado com sucesso!');
      setIsNewOrderDialogOpen(false);
      resetOrderForm();
      fetchOptions();
      fetchOrders();
    } catch (err: any) {
      toast.error('Erro ao criar pedido: ' + err.message);
    }
  };

  const filteredClients = clientSearchText.trim() === '' 
    ? clientsOptions 
    : clientsOptions.filter(c => c.name.toLowerCase().includes(clientSearchText.toLowerCase()));

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
    setClientSearchText('');
    setShowClientDropdown(false);
    setSelectedClientId('');
    setNewClientName('');
    setNewClientPhone('');
    setSelectedProductId('custom');
    setOrderDescription('');
    setOrderPrice('');
  };

  return (
    <div className="space-y-8 max-w-6xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-foreground">Pedidos</h2>
          <p className="text-muted-foreground font-medium mt-1">Gerencie e atualize o status das impressões.</p>
        </div>

        <Dialog open={isNewOrderDialogOpen} onOpenChange={(open) => {
          setIsNewOrderDialogOpen(open);
          if (!open) resetOrderForm();
        }}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-primary-foreground font-bold hover:opacity-90 shadow-sm gap-2">
              <Plus className="w-5 h-5" /> Novo Pedido
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto rounded-xl">
            <DialogHeader>
              <DialogTitle className="font-extrabold text-foreground">Adicionar Pedido</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateOrder} className="space-y-6 pt-4">
              <div className="space-y-4">
                <Label className="font-bold text-foreground">Informações do Cliente</Label>
                <div className="relative">
                  <Label htmlFor="client-search" className="text-xs font-bold uppercase text-foreground">Buscar Cliente *</Label>
                  <Input 
                     id="client-search" 
                     value={clientSearchText} 
                     onChange={e => {
                        setClientSearchText(e.target.value);
                        setSelectedClientId('');
                        setShowClientDropdown(true);
                        setNewClientName(e.target.value);
                     }}
                     onFocus={() => setShowClientDropdown(true)}
                     placeholder="Digite o nome do cliente..."
                     autoComplete="off"
                  />
                  {showClientDropdown && clientSearchText && (
                     <div className="absolute z-10 w-full mt-1 bg-background border border-border rounded-md shadow-lg max-h-48 overflow-y-auto">
                        {filteredClients.length > 0 ? (
                           filteredClients.map(c => (
                              <div key={c.id} className="p-3 cursor-pointer hover:bg-muted text-sm border-b border-border last:border-0" onClick={() => selectClient(c)}>
                                 <span className="font-bold text-foreground">{c.name}</span> <br/> <span className="text-muted-foreground text-xs">{c.phone}</span>
                              </div>
                           ))
                        ) : (
                           <div className="p-3 text-sm text-foreground">
                              Nenhum cliente encontrado.{' '}
                              <span className="text-primary font-bold cursor-pointer hover:underline" onClick={() => { setShowClientDropdown(false); setNewClientName(clientSearchText); }}>
                                Criar novo cliente "{clientSearchText}"
                              </span>
                           </div>
                        )}
                        {filteredClients.length > 0 && selectedClientId === '' && (
                           <div className="p-3 border-t border-border cursor-pointer text-sm text-primary font-bold hover:bg-muted" onClick={() => { setShowClientDropdown(false); setNewClientName(clientSearchText); }}>
                              + Criar novo cliente: "{clientSearchText}"
                           </div>
                        )}
                     </div>
                  )}
                </div>

                {(!selectedClientId && clientSearchText) && (
                  <div className="grid sm:grid-cols-2 gap-4 mt-4 p-4 bg-muted/30 rounded-lg border border-border">
                    <div className="space-y-2">
                      <Label htmlFor="new-client-name" className="text-xs font-bold uppercase text-foreground">Nome do Novo Cliente *</Label>
                      <Input id="new-client-name" value={newClientName} onChange={e => setNewClientName(e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="new-client-phone" className="text-xs font-bold uppercase text-foreground">WhatsApp / Telefone *</Label>
                      <Input id="new-client-phone" value={newClientPhone} onChange={e => setNewClientPhone(e.target.value)} required placeholder="(11) 99999-9999" />
                    </div>
                  </div>
                )}
                {selectedClientId && (
                  <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg flex items-center justify-between">
                     <div className="text-sm">
                        <span className="font-bold text-foreground">Cliente Selecionado: </span>
                        <span className="text-muted-foreground">{clientSearchText} ({newClientPhone})</span>
                     </div>
                     <Button type="button" variant="ghost" size="sm" onClick={() => { setSelectedClientId(''); setClientSearchText(''); setNewClientPhone(''); }} className="h-auto p-1 text-muted-foreground hover:text-destructive">Alterar</Button>
                  </div>
                )}
              </div>

              <div className="space-y-4 pt-4 border-t border-border">
                <Label className="font-bold text-foreground">Informações do Pedido</Label>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-foreground">Produto</Label>
                  <Select value={selectedProductId} onValueChange={handleProductSelect}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="custom">Pedido Personalizado (Sem produto)</SelectItem>
                      {productsOptions.map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="order-desc" className="text-xs font-bold uppercase text-foreground">Descrição / Combinações</Label>
                  <Textarea id="order-desc" value={orderDescription} onChange={e => setOrderDescription(e.target.value)} placeholder="Cor, estilo, tamanho ou link do bixo." />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="order-price" className="text-xs font-bold uppercase text-foreground">Preço Acordado (R$)</Label>
                  <Input id="order-price" type="number" step="0.01" value={orderPrice} onChange={e => setOrderPrice(e.target.value)} placeholder="150.00" />
                </div>
              </div>
              
              <Button type="submit" className="w-full font-bold">Salvar Pedido</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="rounded-xl border border-border shadow-sm overflow-x-auto bg-card">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted hover:bg-muted">
              <TableHead className="py-4 px-5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground whitespace-nowrap">Data</TableHead>
              <TableHead className="py-4 px-5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground whitespace-nowrap">Cliente</TableHead>
              <TableHead className="py-4 px-5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground min-w-[200px]">Produto/Descrição</TableHead>
              <TableHead className="py-4 px-5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Status</TableHead>
              <TableHead className="py-4 px-5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground text-center">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8">Carregando...</TableCell></TableRow>
            ) : orders.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Nenhum pedido encontrado.</TableCell></TableRow>
            ) : (
              orders.map((order) => (
                <TableRow key={order.id} className="hover:bg-muted/50 border-border">
                  <TableCell className="py-4 px-5 align-top whitespace-nowrap">{new Date(order.created_at).toLocaleDateString()}</TableCell>
                  <TableCell className="py-4 px-5 align-top">
                    <div className="font-bold text-foreground">{order.clients?.name || 'Sem nome'}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{order.clients?.phone || 'Sem telefone'}</div>
                  </TableCell>
                  <TableCell className="py-4 px-5 align-top">
                    <div className="font-medium text-foreground">{order.products?.name || 'Pedido Personalizado'}</div>
                    <div className="text-xs text-muted-foreground line-clamp-2 mt-0.5" title={order.description}>{order.description}</div>
                  </TableCell>
                  <TableCell className="py-4 px-5 align-top">
                    <Select defaultValue={order.status} onValueChange={(val) => updateStatus(order, val)}>
                      <SelectTrigger className={`h-8 w-full sm:w-[150px] text-[11px] border-0 rounded-md shadow-sm focus:ring-0 ${getStatusColor(order.status)}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Aguardando contato">Aguardando contato</SelectItem>
                        <SelectItem value="Confirmado">Confirmado</SelectItem>
                        <SelectItem value="Preparação">Preparação</SelectItem>
                        <SelectItem value="Pronto">Pronto</SelectItem>
                        <SelectItem value="Enviado">Enviado</SelectItem>
                        <SelectItem value="Cancelado">Cancelado</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="py-4 px-5 align-top text-center w-[120px]">
                    <div className="flex items-center justify-center gap-1 flex-wrap sm:flex-nowrap">
                      <Button 
                        variant="secondary" 
                        size="sm"
                        className="h-8 w-8 p-0 bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#25D366] shrink-0" 
                        title="Enviar via WhatsApp"
                        onClick={() => {
                          const clean = (order.clients?.phone || '').replace(/\D/g, '');
                          if (clean) {
                            openWhatsapp(
                              clean.startsWith('55') ? clean : `55${clean}`, 
                              generateWhatsappMessage(order.products?.name, order.status, order.clients?.name)
                            );
                          } else {
                            toast.error('Cliente sem telefone válido');
                          }
                        }}
                      >
                        <MessageCircle className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="secondary" 
                        size="sm"
                        className="h-8 w-8 p-0 bg-background hover:bg-muted text-muted-foreground shrink-0" 
                        title="Copiar mensagem"
                        onClick={() => copyMessage(
                          generateWhatsappMessage(order.products?.name, order.status, order.clients?.name)
                        )}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={whatsappModalOpen} onOpenChange={setWhatsappModalOpen}>
        <DialogContent className="sm:max-w-md rounded-xl">
          <DialogHeader>
            <DialogTitle className="font-extrabold flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-[#25D366]" />
              Deseja avisar o cliente no WhatsApp?
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground mb-4 font-medium">A seguinte mensagem será enviada:</p>
            <div className="p-3 bg-muted rounded-md text-sm border border-border text-foreground">
              "{pendingWhatsappMessage}"
            </div>
          </div>
          <DialogFooter className="flex gap-2 sm:justify-end">
            <Button variant="secondary" onClick={() => setWhatsappModalOpen(false)}>Não</Button>
            <Button className="bg-[#25D366] hover:bg-[#25D366]/90 text-white font-bold" onClick={() => {
              openWhatsapp(pendingWhatsappPhone, pendingWhatsappMessage);
              setWhatsappModalOpen(false);
            }}>
              Sim, enviar agora
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}