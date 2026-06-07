import React from 'react';
import { motion } from 'framer-motion';
import { PillButton } from './UIPrimitives';

export const ConceptMatrix: React.FC<{ 
  concepts: any[]; 
  onSelect: (c: any) => void;
  onRetry?: () => void;
  isAnalyzing?: boolean;
}> = ({ concepts, onSelect, onRetry, isAnalyzing }) => {
  const safeConcepts = Array.isArray(concepts) ? concepts : [];

  const getAgentLabel = (focus: string) => {
    const f = String(focus || '').toUpperCase();
    switch (f) {
      case 'A': return { label: 'Agent A: Ngành hàng', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' };
      case 'B': return { label: 'Agent B: SEO & Hook', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' };
      case 'C': return { label: 'Agent C: Tâm lý', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' };
      case 'D': return { label: 'Agent D: Media Trend', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' };
      default: return { label: 'Hybrid Strategy', color: 'bg-white/10 text-white/60 border-white/10' };
    }
  };

  const renderSafeText = (text: any) => {
    if (typeof text === 'object') return JSON.stringify(text);
    return String(text || 'N/A');
  };

  const formatSuitabilityScore = (score: any) => {
    const num = parseFloat(score);
    if (isNaN(num)) return '8';
    const finalScore = num <= 1 && num > 0 ? num * 10 : num;
    return finalScore.toFixed(1).replace(/\.0$/, '');
  };

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col gap-6 pb-10">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold uppercase tracking-tight">Lựa chọn Concept tối ưu</h2>
          <p className="text-white/40 text-sm">Hệ thống đã phân bổ hướng đi dựa trên Ma trận chuyên gia.</p>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {safeConcepts.length === 0 ? (
          <div className="p-16 text-center border-2 border-dashed border-white/5 rounded-[40px] flex flex-col items-center gap-6 bg-white/[0.02]">
             <div className="relative">
                <span className="material-symbols-outlined text-5xl text-white/10 animate-pulse">category</span>
                {isAnalyzing && (
                   <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-12 h-12 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                   </div>
                )}
             </div>
             <div className="flex flex-col gap-2">
                <p className="text-white/40 text-lg font-bold">
                  {isAnalyzing ? "AI đang tạo Concepts..." : "Dữ liệu Concept chưa được nạp"}
                </p>
                <p className="text-white/20 text-sm italic max-w-sm">
                  {isAnalyzing 
                    ? "Expert Matrix đang phối hợp để tìm ra 6 hướng Ad-Style chuyển đổi nhất." 
                    : "Đã có sự cố trong quá trình phân tích kịch bản. Vui lòng thử phân tích lại."}
                </p>
             </div>
             {!isAnalyzing && onRetry && (
               <div className="w-56 mt-2">
                 <PillButton variant="solid" icon={<span className="material-symbols-outlined text-[18px]">refresh</span>} onClick={onRetry}>
                   Phân tích lại ngay
                 </PillButton>
               </div>
             )}
          </div>
        ) : (
          safeConcepts.map((concept, idx) => {
            const agent = getAgentLabel(concept.agent_focus);
            return (
              <motion.div 
                key={idx}
                whileHover={{ x: 8, backgroundColor: 'rgba(255,255,255,0.03)' }}
                onClick={() => onSelect(concept)}
                className="group cursor-pointer p-6 rounded-3xl bg-[#111] border border-white/10 hover:border-emerald-500/40 transition-all flex items-center justify-between shadow-xl"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${agent.color}`}>
                      {agent.label}
                    </span>
                    <h3 className="text-lg font-bold group-hover:text-emerald-400 transition-colors uppercase tracking-tight">
                      {renderSafeText(concept?.name || `Concept ${idx + 1}`)}
                    </h3>
                  </div>
                  
                  <p className="text-sm text-white/60 mb-4 line-clamp-2 leading-relaxed">
                    {renderSafeText(concept?.description)}
                  </p>
                  
                  <div className="p-4 bg-white/5 rounded-2xl border border-white/5 flex flex-col gap-1.5">
                    <span className="text-[9px] text-white/30 font-black uppercase tracking-widest">Chiến lược Insight</span>
                    <p className="text-[12px] text-white/80 leading-relaxed italic">
                      "{renderSafeText(concept?.insight_rationale)}"
                    </p>
                  </div>
                </div>
                
                <div className="flex flex-col items-end gap-1 ml-8 shrink-0">
                   <span className="text-[9px] text-white/30 font-black uppercase">Điểm thích ứng</span>
                   <div className="text-4xl font-black text-white">
                     {formatSuitabilityScore(concept?.suitability_score)}
                     <span className="text-sm text-white/40 font-normal">/10</span>
                   </div>
                   <div className="mt-4 w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-emerald-400 opacity-0 group-hover:opacity-100 transition-all group-hover:bg-emerald-500 group-hover:text-black shadow-lg">
                     <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                   </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </motion.div>
  );
};