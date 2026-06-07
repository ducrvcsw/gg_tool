import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPatch } from 'diff';
import { PREVIOUS_CODE_MAP } from '../constants/previousCode';

interface GitDiffModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GitDiffModal: React.FC<GitDiffModalProps> = ({ isOpen, onClose }) => {
  const [selectedFile, setSelectedFile] = useState<string>('App.tsx');
  const [diffText, setDiffText] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadDiff(selectedFile);
    }
  }, [isOpen, selectedFile]);

  const loadDiff = async (fileName: string) => {
    setLoading(true);
    try {
      const prevCode = PREVIOUS_CODE_MAP[fileName] || "";
      let currentCode = "";

      // Hack to get current code of any file in Flow sandbox
      // relative paths starting with './' usually work for fetch
      const filePath = fileName === 'App.tsx' ? './App.tsx' : `./components/${fileName.replace('components/', '')}`;
      
      try {
        const response = await fetch(filePath);
        if (response.ok) {
          currentCode = await response.text();
        } else {
          // Fallback logic if relative fetch fails
          currentCode = "Mã nguồn hiện tại chưa thể truy xuất trực tiếp qua URL.";
        }
      } catch (e) {
        currentCode = "Lỗi truy cập mã nguồn hiện tại.";
      }
      
      // Tạo patch so sánh
      const patch = createPatch(fileName, prevCode, currentCode, 'previous', 'current');
      setDiffText(patch);
    } catch (err) {
      console.error("Failed to fetch current code for diff", err);
      setDiffText("Lỗi: Không thể tải bản so sánh cho file này.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const fileList = Object.keys(PREVIOUS_CODE_MAP);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-10">
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }} 
        className="absolute inset-0 bg-black/80 backdrop-blur-md" 
        onClick={onClose} 
      />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }} 
        animate={{ opacity: 1, scale: 1, y: 0 }} 
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-6xl h-full max-h-[85vh] bg-[#111] border border-white/10 rounded-[32px] shadow-2xl flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-[#151515]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <span className="material-symbols-outlined">difference</span>
            </div>
            <div>
              <h2 className="text-xl font-black uppercase tracking-tight">Git Diff Codebase</h2>
              <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">So sánh toàn bộ hệ thống file dự án</p>
            </div>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white transition-all">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar - File Selector */}
          <div className="w-64 border-r border-white/5 bg-black/20 overflow-y-auto dark-scrollbar p-4 flex flex-col gap-2">
            <span className="text-[9px] font-black text-white/30 uppercase tracking-[2px] mb-2 px-2">Project Files</span>
            {fileList.map(fileName => (
              <button
                key={fileName}
                onClick={() => setSelectedFile(fileName)}
                className={`w-full text-left p-3 rounded-xl flex items-center gap-3 transition-all ${
                  selectedFile === fileName 
                    ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/10' 
                    : 'text-white/40 hover:bg-white/5 hover:text-white'
                }`}
              >
                <span className={`material-symbols-outlined text-[18px] ${selectedFile === fileName ? 'text-black' : 'text-white/20'}`}>
                  {fileName.endsWith('.tsx') ? 'code' : 'description'}
                </span>
                <span className="text-[11px] font-black uppercase tracking-tight truncate">{fileName}</span>
              </button>
            ))}
          </div>

          {/* Main Content - Diff View */}
          <div className="flex-1 overflow-auto p-6 font-mono text-[12px] bg-black/40 dark-scrollbar">
            {loading ? (
              <div className="h-full flex flex-col items-center justify-center gap-4 opacity-50">
                <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-[10px] font-black uppercase tracking-widest">Calculating changes...</span>
              </div>
            ) : (
              <div className="min-w-full inline-block">
                <div className="mb-4 pb-2 border-b border-white/10 flex items-center gap-2">
                  <span className="text-emerald-400 font-bold text-[10px] uppercase">Diff for:</span>
                  <span className="text-white font-mono text-[10px] bg-white/10 px-2 py-0.5 rounded">{selectedFile}</span>
                </div>
                {diffText.split('\n').map((line, i) => {
                  const isAdded = line.startsWith('+');
                  const isRemoved = line.startsWith('-');
                  const isHeader = line.startsWith('---') || line.startsWith('+++') || line.startsWith('@@');
                  
                  let bgColor = 'transparent';
                  let textColor = 'rgba(255,255,255,0.5)';
                  
                  if (isAdded && !isHeader) {
                    bgColor = 'rgba(16, 185, 129, 0.15)';
                    textColor = '#10b981';
                  } else if (isRemoved && !isHeader) {
                    bgColor = 'rgba(239, 68, 68, 0.15)';
                    textColor = '#ef4444';
                  } else if (isHeader) {
                    textColor = 'rgba(59, 130, 246, 0.8)';
                  }

                  return (
                    <div key={i} className="flex whitespace-pre px-2 py-0.5 rounded" style={{ backgroundColor: bgColor }}>
                      <span className="w-10 shrink-0 opacity-20 select-none text-right mr-6 text-[10px]">{i + 1}</span>
                      <span style={{ color: textColor }}>{line}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/5 bg-[#151515] flex justify-end">
          <button 
            onClick={onClose}
            className="px-8 h-10 bg-white text-black font-black uppercase text-[11px] rounded-xl hover:bg-emerald-400 active:scale-95 transition-all shadow-xl"
          >
            Đóng Review
          </button>
        </div>
      </motion.div>
    </div>
  );
};