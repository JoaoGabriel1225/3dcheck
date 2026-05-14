import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Array com frases de elite para o nicho 3D
const LOADING_PHRASES = [
  "AQUECENDO HOTEND A 210°C...",
  "CALIBRANDO EIXO Z COM PRECISÃO...",
  "NIVELANDO MESA VIRTUAL...",
  "FATIANDO DADOS OPERACIONAIS...",
  "SINCRONIZANDO DIMENSÕES...",
  "CARREGANDO PERFIS DE FILAMENTO...",
  "INICIANDO MOTOR DE GESTÃO...",
  "VERIFICANDO ADESÃO DA PRIMEIRA CAMADA..."
];

export default function SplashScreen() {
  // A MÁGICA AQUI: Já sorteia uma frase aleatória no instante que a tela carrega
  const [phraseIndex, setPhraseIndex] = useState(() => 
    Math.floor(Math.random() * LOADING_PHRASES.length)
  );

  // Efeito para continuar sorteando frases aleatórias a cada 2.2 segundos (caso a net esteja lenta)
  useEffect(() => {
    const interval = setInterval(() => {
      setPhraseIndex((prev) => {
        let nextIndex;
        // Garante que a próxima frase nunca seja igual à atual
        do {
          nextIndex = Math.floor(Math.random() * LOADING_PHRASES.length);
        } while (nextIndex === prev);
        return nextIndex;
      });
    }, 2200);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.8, ease: "easeInOut" } }}
      className="fixed inset-0 z-[9999] bg-[#050505] flex flex-col items-center justify-center overflow-hidden"
    >
      {/* Fundo Vivo 1: Grid Tecnológico Sutil */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#3b82f610_1px,transparent_1px),linear-gradient(to_bottom,#3b82f610_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />

      {/* Fundo Vivo 2: Glows Dinâmicos que se movem */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <motion.div 
          animate={{ opacity: [0.1, 0.3, 0.1], scale: [1, 1.2, 1], rotate: [0, 90, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="absolute w-[400px] h-[400px] md:w-[600px] md:h-[600px] bg-blue-600/20 rounded-full blur-[120px]"
        />
        <motion.div 
          animate={{ opacity: [0.05, 0.15, 0.05], scale: [1.2, 1, 1.2], rotate: [0, -90, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute w-[300px] h-[300px] md:w-[500px] md:h-[500px] bg-indigo-500/10 rounded-full blur-[100px]"
        />
      </div>

      {/* Container da Logo Viva (Levitação + Scanner) */}
      <div className="relative mb-14 z-10">
        <motion.div
          animate={{ 
            y: [0, -15, 0], 
            rotateZ: [-1, 1, -1] // Leve inclinação para dar sensação de peso real
          }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          className="relative rounded-[2rem] overflow-hidden"
        >
          <img 
            src="/icon-512.png" 
            alt="3DCheck Logo" 
            className="w-40 h-40 md:w-56 md:h-56 object-contain drop-shadow-[0_0_25px_rgba(59,130,246,0.6)]"
          />
          
          {/* Feixe de luz passando pela logo (Efeito Scanner 3D) */}
          <motion.div 
            animate={{ top: ['-20%', '120%'] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "linear", repeatDelay: 0.5 }}
            className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-blue-300 to-transparent blur-[1px] opacity-60"
          />
        </motion.div>
      </div>

      {/* Texto Dinâmico e Barra Funcional */}
      <div className="flex flex-col items-center gap-6 z-10 w-full px-6">
        
        {/* Container do Texto com efeito Blur */}
        <div className="h-6 flex items-center justify-center overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.span 
              key={phraseIndex}
              initial={{ opacity: 0, filter: "blur(4px)", scale: 0.95 }}
              animate={{ opacity: 1, filter: "blur(0px)", scale: 1 }}
              exit={{ opacity: 0, filter: "blur(4px)", scale: 1.05 }}
              transition={{ duration: 0.3 }}
              className="text-blue-400 font-black tracking-[0.4em] uppercase text-[10px] md:text-xs text-center drop-shadow-[0_0_8px_rgba(59,130,246,0.8)]"
            >
              {LOADING_PHRASES[phraseIndex]}
            </motion.span>
          </AnimatePresence>
        </div>
        
        {/* Barra de Progresso Neon */}
        <div className="h-[2px] w-56 md:w-80 bg-zinc-900 rounded-full overflow-hidden relative shadow-[0_0_15px_rgba(59,130,246,0.2)] border border-blue-900/30">
          <motion.div 
            animate={{ x: ["-100%", "200%"] }}
            transition={{ 
              duration: 1.2, 
              repeat: Infinity, 
              ease: "easeInOut" 
            }}
            className="absolute inset-0 w-1/3 bg-gradient-to-r from-transparent via-blue-400 to-transparent rounded-full shadow-[0_0_10px_#3b82f6]"
          />
        </div>
      </div>

      {/* Badge de Versão estilo Cyberpunk */}
      <div className="absolute bottom-8 z-10">
        <div className="flex items-center gap-2 bg-blue-950/40 px-4 py-2 rounded-full border border-blue-900/50 backdrop-blur-md">
          <div className="w-1.5 h-1.5 rounded-full bg-blue-400 shadow-[0_0_5px_#3b82f6] animate-pulse" />
          <span className="text-blue-200/80 font-black text-[8px] tracking-[0.3em] uppercase">
            3DCheck Core v2.0.4
          </span>
        </div>
      </div>
    </motion.div>
  );
}
