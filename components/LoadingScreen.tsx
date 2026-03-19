import React from 'react';
import { motion } from 'framer-motion';

const LoadingScreen: React.FC = () => {
  return (
    <motion.div 
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed inset-0 z-[9999] bg-white flex flex-col items-center justify-center"
    >
      <div className="relative w-24 h-24">
        {/* Outer Ring */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 border-4 border-zinc-100 border-t-black rounded-full"
        />
        
        {/* Inner Logo/Icon */}
        <motion.div
          animate={{ 
            scale: [1, 1.1, 1],
            opacity: [0.8, 1, 0.8]
          }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-0 flex items-center justify-center"
        >
          <img 
            src="https://i.ibb.co/DHJSMNJN/Tabloid-3.png" 
            alt="Logo" 
            className="w-12 h-12 object-contain"
            referrerPolicy="no-referrer"
          />
        </motion.div>
      </div>
      
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-8 text-center"
      >
        <img 
          src="https://i.ibb.co/DHJSMNJN/Tabloid-3.png" 
          alt="SKWIZ" 
          className="h-6 mx-auto mb-2 object-contain grayscale brightness-0"
          referrerPolicy="no-referrer"
        />
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 mt-1">The Architect's Vision</p>
      </motion.div>
    </motion.div>
  );
};

export default LoadingScreen;
