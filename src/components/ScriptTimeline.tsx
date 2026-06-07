import React from 'react';
import { motion } from 'framer-motion';
import { PillButton } from './UIPrimitives';

export const ScriptTimeline: React.FC<{ 
  script: any; 
  concept: any; 
  error?: string | null;
  onRetry?: () => void;
  onNext: () => void; 
}> = ({ script, concept, error, onRetry, onNext }) => {
  
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-20 gap-6 bg-red-500/5 border border-dashed border-red-500/20 rounded-[40px] text-center">
         <span className="material-symbols-outlined text-5xl text-red-500/40">error_outline</span>
         <div className="flex flex-col gap-2">
           <p className="text-red-400 text-lg font-bold">Lỗi tạo kịch bản</p>
           <p className="text-white/20 text-sm max-w-md">{error}</p>
         </div>
         <div className="w-48">
           <PillButton variant="solid" className="bg-red-500 text-white hover:bg-red-600" icon={<span className="material-symbols-outlined text-[18px]">replay</span>} onClick={onRetry}>
             Thử lại ngay
           </PillButton>
         </div>
      </div>
    );
  }

  if (!script) {
    return (
      <div className="flex flex-col items-center justify-center p-20 gap-4 bg-white/5 border border-dashed border-white/10 rounded-[40px]">
         <span className="material-symbols-outlined text-5xl text-white/10 animate-spin">sync</span>
         <div className="text-center">
           <p className="text-white/40 text-lg font-bold">Đang tải kịch bản...</p>
           <p className="text-white/20 text-sm">AI đang chuẩn bị dòng thời gian sản xuất.</p>
         </div>
      </div>
    );
  }

  const timeline = script.script_timeline || script;
  const safeTimeline = Array.isArray(timeline) ? timeline : [];
  
  if (safeTimeline.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-20 gap-6 bg-white/5 border border-dashed border-white/10 rounded-[40px] text-center">
         <span className="material-symbols-outlined text-5xl text-white/20">sentiment_dissatisfied</span>
         <div className="flex flex-col gap-2">
           <p className="text-white/40 text-lg font-bold">Không có dữ liệu kịch bản</p>
           <p className="text-white/20 text-sm">AI đã trả về nội dung rỗng. Vui lòng quay lại cấu hình và thử lại.</p>
         </div>
         <div className="w-48">
           <PillButton variant="outline" icon={<span className="material-symbols-outlined text-[18px]">arrow_back</span>} onClick={() => window.history.back()}>
             Quay lại cấu hình
           </PillButton>
         </div>
      </div>
    );
  }

  const isNoVoice = safeTimeline.every((s: any) => !s.voiceover_audio || s.voiceover_audio === "");

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }} 
      animate={{ opacity: 1, scale: 1 }} 
      className="flex flex-col gap-8 pb-12"
    >
      <div className="p-8 rounded-3xl bg-gradient-to-br from-[#1a1a1a] to-[#0e0e0e] border border-white/10 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <span className="material-symbols-outlined text-[120px]">movie_edit</span>
        </div>
        <div className="relative z-10 flex justify-between items-start">
          <div className="flex-1">
            <span className="px-3 py-1 bg-white/10 rounded-full text-[10px] font-bold text-white/60 uppercase tracking-widest mb-4 inline-block">
              {isNoVoice ? 'ACTION-FOCUSED NO VOICE SCRIPT' : 'PRODUCTION READY SCRIPT'}
            </span>
            <h2 className="text-3xl font-bold mb-2">{concept?.name || 'UGC Script'}</h2>
            <p className="text-white/50 max-w-xl">
              {isNoVoice 
                ? "Kịch bản tập trung vào hành động, biểu cảm và quy trình sử dụng sản phẩm. Phù hợp cho video ads social media hiệu suất cao." 
                : "Kịch bản chi tiết đã được tối ưu SEO và Hook chiến thắng dành cho Model UGC."}
            </p>
          </div>
          <div className="w-56 ml-6">
            <PillButton variant="solid" icon={<span className="material-symbols-outlined text-[18px]">bolt</span>} onClick={onNext}>
              {isNoVoice ? 'Sản xuất Hình ảnh' : 'Tiếp tục Voice Studio'}
            </PillButton>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {safeTimeline.map((scene: any, idx: number) => (
          <div key={idx} className="flex gap-6 items-start">
            <div className="w-20 pt-4 text-right shrink-0">
              <span className="text-xs font-bold text-white/20 font-mono tracking-tighter">{scene.timestamp || `0:${idx*5}`}</span>
            </div>
            
            <div className="relative flex-1 p-6 rounded-2xl bg-[#111] border border-white/10 group hover:border-white/20 transition-all">
              <div className="absolute -left-[13px] top-6 w-6 h-6 rounded-full bg-[#111] border border-white/10 flex items-center justify-center text-[10px] font-bold text-white/40">
                {idx + 1}
              </div>
              
              <div className={`grid grid-cols-1 ${isNoVoice ? 'md:grid-cols-1' : 'md:grid-cols-2'} gap-6`}>
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Visual Direction ({scene.camera_angle || 'N/A'})</span>
                    <p className="text-[13px] text-white/80 leading-relaxed italic border-l-2 border-emerald-500/30 pl-3">
                      {scene.visual_action || 'Chưa có mô tả hành động.'}
                    </p>
                  </div>
                  <div className="flex flex-col gap-1 bg-white/5 p-3 rounded-xl border border-white/5">
                    <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">On-Screen SEO Text / Hook Overlay</span>
                    <p className="text-[15px] font-black text-white/90 tracking-tight uppercase">
                      {scene.on_screen_text_seo || 'N/A'}
                    </p>
                  </div>
                </div>

                {!isNoVoice && (
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Voiceover Script</span>
                      <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-xl relative">
                        <span className="material-symbols-outlined text-emerald-400/30 absolute top-2 right-2 text-[16px]">mic</span>
                        <p className="text-[14px] text-white leading-relaxed">
                          {scene.voiceover_audio || 'Mô tả âm thanh...'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
};