import React from 'react';
import { motion } from 'framer-motion';
import { PillButton, SectionLabel } from './UIPrimitives';

interface ProductBrief {
  name: string;
  core_value: string;
  features: string[];
  technical_specs: string;
  visual_description?: any;
}

export const ProductDeepDive: React.FC<{ brief: ProductBrief; onNext: () => void }> = ({ brief, onNext }) => {
  // Hàm xử lý an toàn cho việc render nội dung từ AI (tránh lỗi render Object trong JSX)
  const renderSafeContent = (content: any) => {
    if (!content) return null;
    if (typeof content === 'string') return content;
    if (typeof content === 'object') {
      return Object.entries(content).map(([key, val]) => (
        <div key={key} className="mb-1">
          <span className="font-black text-emerald-400/80 mr-1">{key}:</span>
          <span>{typeof val === 'object' ? JSON.stringify(val) : String(val)}</span>
        </div>
      ));
    }
    return String(content);
  };

  if (!brief) {
    return (
      <div className="flex flex-col items-center justify-center p-20 gap-4 bg-white/5 border border-dashed border-white/10 rounded-[40px] text-center">
         <span className="material-symbols-outlined text-5xl text-white/10">warning</span>
         <div className="flex flex-col gap-2">
           <p className="text-white/40 text-lg font-bold">Dữ liệu phân tích trống</p>
           <p className="text-white/20 text-sm italic">Vui lòng quay lại bước đầu tiên và nhấn "Bắt đầu Production" để nạp dữ liệu.</p>
         </div>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col gap-8 pb-10">
      <div className="flex justify-between items-end mb-2">
        <div>
          <h2 className="text-3xl font-black uppercase tracking-tight">Product Deep Dive</h2>
          <p className="text-white/40 text-sm">Phân tích chuyên sâu (Pro-Level) về cấu trúc vật liệu và đặc tính thị giác.</p>
        </div>
        <div className="w-48">
          <PillButton variant="solid" onClick={onNext}>Xác nhận: Xem Insights</PillButton>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="p-8 rounded-[40px] bg-white/5 border border-white/10 flex flex-col gap-6 shadow-2xl">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Sản phẩm nhận diện</span>
              <h3 className="text-4xl font-black tracking-tighter uppercase">{brief.name || "Sản phẩm"}</h3>
            </div>
            
            <div className="flex flex-col gap-3">
              <SectionLabel>Visual DNA Blueprint (Fidelity Lock)</SectionLabel>
              <div className="p-6 rounded-3xl bg-black/40 border border-emerald-500/30 relative overflow-hidden">
                <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2 py-1 bg-emerald-500/20 rounded-lg">
                  <span className="material-symbols-outlined text-[14px] text-emerald-400">verified</span>
                  <span className="text-[9px] font-black text-emerald-400 uppercase">Pro Analysis</span>
                </div>
                <div className="text-[15px] font-medium text-white/90 leading-relaxed">
                  {renderSafeContent(brief.visual_description) || "AI đang tổng hợp mô tả thị giác từ hình ảnh thực tế..."}
                </div>
                <div className="mt-4 pt-4 border-t border-white/5">
                   <p className="text-[10px] text-emerald-400/60 italic">
                     * Đây là đoạn text cưỡng chế AI ở các bước sau phải vẽ đúng vật liệu (ví dụ: len, sớ vải, nhựa bóng...).
                   </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="flex flex-col gap-3">
                 <SectionLabel>Core Value Proposition</SectionLabel>
                 <div className="p-5 rounded-2xl bg-white/5 border border-white/5">
                   <p className="text-[14px] font-medium text-white/70 italic leading-relaxed">
                     "{brief.core_value || 'N/A'}"
                   </p>
                 </div>
               </div>

               <div className="flex flex-col gap-3">
                 <SectionLabel>Đặc điểm nổi bật</SectionLabel>
                 <div className="flex flex-col gap-2">
                   {(brief.features || []).map((feat, i) => (
                     <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
                        <span className="material-symbols-outlined text-emerald-400 text-sm">check_circle</span>
                        <span className="text-[12px] text-white/80">{feat}</span>
                     </div>
                   ))}
                   {(!brief.features || brief.features.length === 0) && <p className="text-[11px] text-white/20">Không có dữ liệu đặc điểm.</p>}
                 </div>
               </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4">
           <div className="p-6 rounded-3xl bg-[#111] border border-white/10 flex flex-col gap-4">
              <SectionLabel>Expert Context Log</SectionLabel>
              <div className="flex flex-col gap-3">
                 <div className="flex gap-3">
                    <div className="w-1 h-10 bg-emerald-500 rounded-full" />
                    <p className="text-[11px] text-white/40 leading-tight">
                      Đã sử dụng Gemini Pro để soi kỹ từng pixel bề mặt (vân len, kiểu dệt).
                    </p>
                 </div>
                 <div className="flex gap-3">
                    <div className="w-1 h-10 bg-white/10 rounded-full" />
                    <p className="text-[11px] text-white/40 leading-tight">
                      Phân tích chất liệu thủ công để đưa vào Surgical Prompt ở bước Image Gen.
                    </p>
                 </div>
              </div>
           </div>
           
           <div className="p-6 rounded-3xl border border-white/10 bg-gradient-to-br from-emerald-500/10 to-transparent flex flex-col gap-3 items-center text-center">
              <span className="material-symbols-outlined text-3xl text-emerald-400">palette</span>
              <p className="text-[10px] font-bold text-white/70 uppercase">Material Fidelity</p>
              <p className="text-[11px] text-white/40">Blueprint này đảm bảo AI không nhầm lẫn giữa nơ len và ruy băng lụa.</p>
           </div>
        </div>
      </div>
    </motion.div>
  );
};