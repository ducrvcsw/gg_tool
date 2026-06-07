import React from 'react';
import { motion } from 'framer-motion';

export const LoadingState: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-6">
      <div className="relative">
        <div className="w-16 h-16 border-2 border-white/10 rounded-full" />
        <motion.div 
          className="absolute inset-0 border-t-2 border-white rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
      </div>
      <div className="flex flex-col items-center gap-1">
        <h3 className="text-xl font-bold">Đang xử lý dữ liệu...</h3>
        <p className="text-white/30 text-sm animate-pulse">Khởi tạo Ma trận Chuyên gia (Expert Matrix)</p>
      </div>
      
      <div className="w-full max-w-xs h-1 bg-white/5 rounded-full overflow-hidden">
        <motion.div 
          className="h-full bg-white"
          initial={{ width: 0 }}
          animate={{ width: "100%" }}
          transition={{ duration: 3, repeat: Infinity }}
        />
      </div>
    </div>
  );
};