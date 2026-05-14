import React from 'react';
import { motion } from 'framer-motion';

export default function SplashScreen() {
  return (
    <motion.div 
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.8, ease: "easeInOut" } }}
      className="fixed inset-0 z-[9999] bg-[#050505] flex flex-col items-center justify-center"
    >
      {/* Container da Logo com Efeito de Brilho */}
      <div className="relative mb-8">
        <motion.div
          animate={{ 
            scale: [1, 1.05, 1],
            filter: [
              "drop-shadow(0 0 20px rgba(59, 130, 246, 0.3))",
              "drop-shadow(0 0 40px rgba(59, 130, 246, 0.6))",
              "drop-shadow(0 0 20px rgba(59, 130, 246, 0.3))"
            ]
          }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        >
          {/* Aqui chamamos a sua nova logo icon-512.png */}
          <img 
            src="/icon-512.png" 
            alt="3DCheck Logo" 
            className="w-32 h-32 md:w-48 md:h-48 object-contain"
          />
        </motion.div>
      </div>

      {/* Texto e Barra Funcional */}
      <div className="flex flex-col items-center gap-4">
        <motion.span 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-blue-500 font-black tracking-[0.4em] uppercase text-[10px] md:text-xs italic"
        >
          Sincronizando Dimensões
        </motion.span>
        
        {/* Barra de progresso infinita estilo "SaaS de Elite" */}
        <div className="h-[2px] w-40 md:w-64 bg-zinc-900 rounded-full overflow-hidden relative">
          <motion.div 
            initial={{ x: "-100%" }}
            animate={{ x: "100%" }}
            transition={{ 
              duration: 1.5, 
              repeat: Infinity, 
              ease: "easeInOut" 
            }}
            className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-600 to-transparent w-full"
          />
        </div>
      </div>

      {/* Badge de Versão no rodapé */}
      <div className="absolute bottom-10">
        <span className="text-zinc-800 font-bold text-[8px] tracking-widest uppercase">
          Build v2.0.4 - Elite Edition
        </span>
      </div>
    </motion.div>
  );
}
