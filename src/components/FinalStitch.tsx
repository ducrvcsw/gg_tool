import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Flow } from 'flow-sdk';
import { PillButton, SectionLabel } from './UIPrimitives';

export const FinalStitch: React.FC<{ data: any; onBack: () => void }> = ({ data, onBack }) => {
  const [downloading, setDownloading] = useState<Record<number, boolean>>({});
  
  // Standardize on script_timeline
  const timeline = data?.script_timeline || data?.production_script_timeline || [];
  const concept = data.concept || {};

  const handleDownload = async (scene: any, idx: number) => {
    if (!scene.generated_video) return;
    setDownloading(p => ({ ...p, [idx]: true }));
    try {
      await Flow.download({
        base64: scene.generated_video.base64,
        mimeType: scene.generated_video.mimeType,
        filename: `UGC_${concept.name || 'Scene'}_${idx + 1}.mp4`
      });
    } catch (e) {
      console.error(e);
    } finally {
      setDownloading(p => ({ ...p, [idx]: false }));
    }
  };

  const copyProductionData = () => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    alert("Đã sao chép cấu hình Production!");
  };

  return (
    <div className="flex flex-col gap-8 max-w-4xl mx-auto pb-20">
      <div className="text-center flex flex-col items-center gap-2">
        <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-2">
          <span className="material-symbols-outlined text-3xl">task_alt</span>
        </div>
        <h2 className="text-3xl font-black uppercase tracking-tighter">Production Complete</h2>
        <p className="text-white/40 max-w-md italic">Toàn bộ phân cảnh đã được đóng gói và sẵn sàng bàn giao cho chiến dịch Marketing.</p>
      </div>

      {timeline.length === 0 ? (
        <div className="p-20 text-center border-2 border-dashed border-white/5 rounded-[40px] opacity-30">
          <p>Không tìm thấy asset nào để xuất bản.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {timeline.map((scene: any, idx: number) => (
            <div key={idx} className="p-4 rounded-3xl bg-[#111] border border-white/10 flex flex-col gap-4">
              <div className="flex justify-between items-center px-1">
                  <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Asset {idx + 1}</span>
                  <span className="text-[9px] text-emerald-400 font-bold uppercase">Ready to Use</span>
              </div>
              
              <div className="aspect-video rounded-2xl bg-black border border-white/5 overflow-hidden">
                  {scene.generated_video && (
                    <video src={`data:${scene.generated_video.mimeType};base64,${scene.generated_video.base64}`} className="w-full h-full object-cover" controls />
                  )}
              </div>

              <PillButton 
                variant="outline" 
                icon={<span className="material-symbols-outlined">{downloading[idx] ? 'sync' : 'download'}</span>} 
                onClick={() => handleDownload(scene, idx)}
                disabled={downloading[idx]}
              >
                  {downloading[idx] ? 'Downloading...' : 'Download Clip'}
              </PillButton>
            </div>
          ))}
        </div>
      )}

      <div className="mt-8 p-8 rounded-[40px] bg-white/5 border border-white/10 flex flex-col gap-6 items-center">
         <div className="flex flex-col items-center text-center gap-2">
            <SectionLabel>Campaign Management</SectionLabel>
            <p className="text-sm text-white/60">Xuất toàn bộ cấu trúc dữ liệu để lưu trữ hoặc nạp vào hệ thống hậu kỳ chuyên nghiệp.</p>
         </div>

         <div className="grid grid-cols-2 gap-4 w-full max-w-md">
            <PillButton variant="outline" icon={<span className="material-symbols-outlined">edit</span>} onClick={onBack}>Quay lại Sửa</PillButton>
            <PillButton variant="solid" icon={<span className="material-symbols-outlined">content_copy</span>} onClick={copyProductionData}>Copy Full JSON</PillButton>
         </div>
      </div>
    </div>
  );
};