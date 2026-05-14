import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

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
  const [phraseIndex, setPhraseIndex] = useState(() => 
    Math.floor(Math.random() * LOADING_PHRASES.length)
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setPhraseIndex((prev) => {
        let nextIndex;
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
      exit={{ opacity: 0, transition: { duration: 0.5, ease: "easeOut" } }}
      className="fixed inset-0 z-[9999] bg-[#050505] flex flex-col items-center justify-center overflow-hidden"
    >
      {/* Luz ambiente de fundo (Glow leve e estático para não pesar no celular) */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[300px] h-[300px] md:w-[500px] md:h-[500px] bg-blue-600/10 rounded-full blur-[100px]" />
      </div>

      {/* Container da Logo com Efeito Leve de Levitação */}
      <div className="relative mb-10 z-10">
        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          style={{ willChange: "transform" }}
        >
          <img 
            src="/icon-512.png" 
            alt="3DCheck Logo" 
            className="w-36 h-36 md:w-48 md:h-48 object-contain"
          />
        </motion.div>
      </div>

      {/* Texto Dinâmico e Barra Funcional (Sem blur para rodar liso) */}
      <div className="flex flex-col items-center gap-6 z-10 w-full px-6">
        <div className="h-6 flex items-center justify-center overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.span 
              key={phraseIndex}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="text-blue-500 font-black tracking-[0.3em] uppercase text-[10px] md:text-xs text-center"
            >
              {LOADING_PHRASES[phraseIndex]}
            </motion.span>
          </AnimatePresence>
        </div>
        
        {/* Barra de progresso */}
        <div className="h-[2px] w-48 md:w-72 bg-zinc-900 rounded-full overflow-hidden relative">
          <motion.div 
            initial={{ x: "-100%" }}
            animate={{ x: "100%" }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-600 to-transparent w-full"
            style={{ willChange: "transform" }}
          />
        </div>
      </div>

      {/* Badge de Versão */}
      <div className="absolute bottom-10">
        <span className="text-zinc-800 font-bold text-[8px] tracking-widest uppercase">
          Build v2.0.4 - Elite Edition
        </span>
      </div>
    </motion.div>
  );
}
