import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  PackageSearch,
  Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';

/* ================= HOOK COUNTDOWN ================= */
function useCountdown(key, days = 7) {
  const [timeLeft, setTimeLeft] = React.useState({ d: 0, h: 0, m: 0 });

  React.useEffect(() => {
    let end = localStorage.getItem(key);

    if (!end) {
      const newEnd = Date.now() + days * 86400000;
      localStorage.setItem(key, newEnd.toString());
      end = newEnd.toString();
    }

    const update = () => {
      const diff = parseInt(end) - Date.now();
      if (diff <= 0) return setTimeLeft({ d: 0, h: 0, m: 0 });

      setTimeLeft({
        d: Math.floor(diff / 86400000),
        h: Math.floor((diff % 86400000) / 3600000),
        m: Math.floor((diff % 3600000) / 60000)
      });
    };

    update();
    const interval = setInterval(update, 10000); // otimizado

    return () => clearInterval(interval);
  }, [key, days]);

  return timeLeft;
}

/* ================= HERO ================= */
function Hero({ navigate }) {
  return (
    <section className="pt-40 pb-24 text-center max-w-5xl mx-auto px-6">
      
      <div className="mb-6 inline-flex items-center gap-2 px-4 py-2 bg-blue-600/10 border border-blue-600/20 rounded-full text-blue-400 text-sm font-bold">
        <Zap size={16}/> Makers inteligentes não usam planilhas
      </div>

      <h1 className="text-5xl md:text-7xl font-black leading-tight mb-6">
        Você está <span className="text-blue-500">perdendo dinheiro</span> em cada peça mal precificada.
      </h1>

      <p className="text-xl text-zinc-300 max-w-2xl mx-auto mb-8">
        O 3DCheck calcula seu custo real automaticamente e mostra seu lucro exato em segundos.
      </p>

      <Button
        onClick={() => navigate('/register')}
        className="h-14 px-10 text-lg font-bold bg-blue-600 hover:bg-blue-500"
      >
        Calcular Meu Primeiro Preço <ArrowRight className="ml-2"/>
      </Button>

      <p className="text-sm text-zinc-500 mt-3">
        Sem cartão • Sem risco
      </p>
    </section>
  );
}

/* ================= PROVA ================= */
function Proof() {
  return (
    <section className="py-20 text-center bg-zinc-950 border-y border-zinc-800">
      
      <p className="text-zinc-400 mb-6 font-semibold">
        Mais de <span className="text-white">1.000+ makers</span> já usam
      </p>

      {/* Placeholder de produto */}
      <div className="max-w-4xl mx-auto rounded-xl overflow-hidden border border-zinc-800">
        <div className="h-[300px] bg-zinc-900 flex items-center justify-center text-zinc-600">
          [ Aqui entra print ou vídeo do sistema ]
        </div>
      </div>

      <p className="mt-6 text-zinc-400 italic">
        “Eu finalmente sei quanto realmente lucro em cada peça.”
      </p>
    </section>
  );
}

/* ================= PRICING ================= */
function Pricing({ navigate }) {
  const time = useCountdown('3dcheck_timer');

  return (
    <section className="py-24 px-6 text-center">
      
      <h2 className="text-4xl font-black mb-4">
        Pague menos que um erro de impressão.
      </h2>

      <p className="text-zinc-400 mb-10">
        Um cálculo errado já custa mais que o sistema inteiro.
      </p>

      <div className="max-w-md mx-auto bg-zinc-900 border border-zinc-800 rounded-2xl p-10">
        
        <div className="text-6xl font-black text-blue-500 mb-2">
          R$19,90
        </div>

        <p className="text-sm text-zinc-500 mb-6">por mês</p>

        <ul className="text-left space-y-3 mb-8">
          {[
            "Cálculo automático de custos",
            "Controle de lucro real",
            "Vitrine para pedidos",
            "Gestão completa"
          ].map((item, i) => (
            <li key={i} className="flex gap-2 items-center">
              <CheckCircle2 size={18} className="text-green-500"/> {item}
            </li>
          ))}
        </ul>

        <div className="mb-6 text-sm text-zinc-400">
          Oferta expira em: <br/>
          <strong>{time.d}d {time.h}h {time.m}m</strong>
        </div>

        <Button
          onClick={() => navigate('/register')}
          className="w-full h-14 bg-white text-black font-bold hover:bg-zinc-200"
        >
          Testar Gratuitamente
        </Button>

        <p className="text-xs text-zinc-500 mt-4 flex justify-center items-center gap-1">
          <ShieldCheck size={14}/> Sem fidelidade
        </p>
      </div>
    </section>
  );
}

/* ================= MAIN ================= */
export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="bg-black text-white min-h-screen">
      
      {/* HEADER */}
      <header className="fixed top-0 w-full h-20 flex items-center justify-between px-6 border-b border-zinc-800 bg-black/70 backdrop-blur z-50">
        <div className="flex items-center gap-2 font-black text-xl">
          <PackageSearch/> 3DCheck
        </div>

        <Button variant="ghost" onClick={() => navigate('/login')}>
          Entrar
        </Button>
      </header>

      <Hero navigate={navigate}/>
      <Proof/>
      <Pricing navigate={navigate}/>

      {/* FOOTER */}
      <footer className="py-10 text-center text-zinc-600 text-sm border-t border-zinc-800">
        3DCheck • Sistema de gestão para makers
      </footer>

    </div>
  );
}
