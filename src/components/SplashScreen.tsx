import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Array com as frases que vão rodar durante o carregamento
const LOADING_PHRASES = [
  "AQUECENDO O HOTEND...",
  "CALIBRANDO EIXO Z...",
  "NIVELANDO A MESA VIRTUAL...",
  "FATIANTO DADOS FINANCEIROS...",
  "SINCRONIZANDO DIMENSÕES..."
];

export default function SplashScreen() {
  const [phraseIndex, setPhraseIndex] = useState(0);

  // Efeito para rotacionar as frases a cada 2 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      setPhraseIndex((prev) => (prev + 1) % LOADING_PHRASES.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.8, ease: "easeInOut" } }}
      className="fixed inset-0 z-[9999] bg-[#050505] flex flex-col items-center justify-center overflow-hidden"
    >
      {/* Luz ambiente de fundo (Glow) */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <motion.div 
          animate={{ opacity: [0.1, 0.25, 0.1], scale: [1, 1.2, 1] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="w-[300px] h-[300px] md:w-[500px] md:h-[500px] bg-blue-600/20 rounded-full blur-[100px]"
        />
      </div>

      {/* Container da Logo com Efeito de Flutuação e Brilho */}
      <div className="relative mb-10 z-10">
        <motion.div
          animate={{ 
            y: [0, -12, 0], // Efeito de levitação
            filter: [
              "drop-shadow(0 0 15px rgba(59, 130, 246, 0.2))",
              "drop-shadow(0 0 35px rgba(59, 130, 246, 0.5))",
              "drop-shadow(0 0 15px rgba(59, 130, 246, 0.2))"
            ]
          }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        >
          <img 
            src="/icon-512.png" 
            alt="3DCheck Logo" 
            className="w-36 h-36 md:w-52 md:h-52 object-contain"
          />
        </motion.div>
      </div>

      {/* Texto Dinâmico e Barra Funcional */}
      <div className="flex flex-col items-center gap-6 z-10 w-full px-6">
        
        {/* Container fixo para o texto não empurrar a barra */}
        <div className="h-6 flex items-center justify-center overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.span 
              key={phraseIndex}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="text-blue-400 font-black tracking-[0.3em] uppercase text-[10px] md:text-xs text-center"
            >
              {LOADING_PHRASES[phraseIndex]}
            </motion.span>
          </AnimatePresence>
        </div>
        
        {/* Barra de progresso estilo "Hardware de Elite" */}
        <div className="h-[3px] w-48 md:w-72 bg-zinc-900/80 rounded-full overflow-hidden relative shadow-[0_0_10px_rgba(59,130,246,0.1)] border border-white/5">
          <motion.div 
            initial={{ x: "-100%" }}
            animate={{ x: "200%" }}
            transition={{ 
              duration: 1.5, 
              repeat: Infinity, 
              ease: "easeInOut" 
            }}
            className="absolute inset-0 w-1/2 bg-gradient-to-r from-transparent via-blue-500 to-transparent rounded-full"
          />
        </div>
      </div>

      {/* Badge de Versão no rodapé */}
      <div className="absolute bottom-8 z-10">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
          <span className="text-zinc-600 font-black text-[8px] tracking-[0.3em] uppercase">
            3DCheck Core v2.0.4
          </span>
        </div>
      </div>
    </motion.div>
  );
}
