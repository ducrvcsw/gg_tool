import React from 'react';
import { motion } from 'framer-motion';
import { PillButton } from './UIPrimitives';

export const InsightMap: React.FC<{ data: any; onNext: () => void }> = ({ data, onNext }) => {
  // Hàm bóc tách dữ liệu AI thông minh hơn, chống N/A do sai cấu trúc JSON
  const safeGet = (obj: any, path: string, fallback: any = 'N/A') => {
    if (!obj) return fallback;
    const parts = path.split('.');
    let current = obj;
    
    // 1. Tự động unwrap các lớp lồng nhau phổ biến mà AI hay tạo ra
    const commonWrappers = ['insights', 'data', 'insight_matrix', 'matrix', 'result', 'analysis'];
    let unwrapped = true;
    let limit = 0;
    while (unwrapped && limit < 3) {
      unwrapped = false;
      for (const wrapper of commonWrappers) {
        if (current[wrapper] && !current[parts[0]]) {
          current = current[wrapper];
          unwrapped = true;
          break;
        }
      }
      limit++;
    }

    // 2. Đi sâu vào path với khả năng tìm kiếm mờ (không phân biệt hoa thường, dấu gạch dưới)
    for (const part of parts) {
      if (current === null || typeof current !== 'object') return fallback;
      
      const keys = Object.keys(current);
      const targetKey = keys.find(k => 
        k.toLowerCase().replace(/_/g, ' ').trim() === part.toLowerCase().replace(/_/g, ' ').trim()
      );
      
      if (!targetKey) return fallback;
      current = current[targetKey];
    }
    return current || fallback;
  };

  const renderSafeValue = (val: any) => {
    if (val === null || val === undefined) return 'N/A';
    if (Array.isArray(val)) return val.length > 0 ? val.join(', ') : 'N/A';
    if (typeof val === 'object') {
      try {
        return Object.entries(val).map(([k, v]) => `${k}: ${typeof v === 'object' ? JSON.stringify(v) : v}`).join(' | ');
      } catch (e) { return JSON.stringify(val); }
    }
    return String(val) || 'N/A';
  };

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center p-20 gap-4 bg-white/5 border border-dashed border-white/10 rounded-[40px] text-center">
         <span className="material-symbols-outlined text-5xl text-white/10">warning</span>
         <div className="flex flex-col gap-2">
           <p className="text-white/40 text-lg font-bold">Ma trận Insight trống</p>
           <p className="text-white/20 text-sm italic">Dữ liệu phân tích chưa sẵn sàng.</p>
         </div>
      </div>
    );
  }

  const agents = [
    { 
      id: 'industry', 
      name: 'Agent A: Ngành hàng', 
      icon: 'settings', 
      content: [
        { label: 'USP', val: renderSafeValue(safeGet(data, 'industry_expert.usp')) },
        { label: 'Nỗi đau', val: renderSafeValue(safeGet(data, 'industry_expert.pain_point')) },
        { label: 'Phân khúc', val: renderSafeValue(safeGet(data, 'industry_expert.segment')) }
      ]
    },
    { 
      id: 'marketing', 
      name: 'Agent B: SEO & Ads', 
      icon: 'trending_up', 
      content: [
        { label: 'SEO Keywords', val: renderSafeValue(safeGet(data, 'marketing_seo.keywords')) },
        { label: 'Top Hooks', val: renderSafeValue(safeGet(data, 'marketing_seo.top_hooks')) }
      ]
    },
    { 
      id: 'psychology', 
      name: 'Agent C: Tâm lý', 
      icon: 'insights', 
      content: [
        { label: 'Động lực', val: renderSafeValue(safeGet(data, 'psychology.motivations')) },
        { label: 'Rào cản', val: renderSafeValue(safeGet(data, 'psychology.barriers')) }
      ]
    },
    { 
      id: 'media', 
      name: 'Agent D: Media Ads', 
      icon: 'videocam', 
      content: [
        { label: 'Visual Trend', val: renderSafeValue(safeGet(data, 'media_director.visual_trends')) },
        { label: 'Góc máy', val: renderSafeValue(safeGet(data, 'media_director.angles')) }
      ]
    }
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-6">
      <div className="flex justify-between items-end mb-2">
        <div>
          <h2 className="text-2xl font-bold">Ma trận Insight Chuyên gia</h2>
          <p className="text-white/40 text-sm">Hệ thống Multi-Agent vừa mổ xẻ dữ liệu thị trường và sản phẩm.</p>
        </div>
        <div className="w-40">
          <PillButton variant="solid" onClick={onNext}>Tiếp tục: Concept</PillButton>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {agents.map((agent) => (
          <div key={agent.id} className="p-5 rounded-2xl bg-[#111] border border-white/10 hover:border-white/20 transition-all">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-white/5 text-white/70">
                <span className="material-symbols-outlined">{agent.icon}</span>
              </div>
              <h3 className="font-bold text-white/90">{agent.name}</h3>
            </div>
            <div className="flex flex-col gap-4">
              {agent.content.map((item, i) => (
                <div key={i} className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">{item.label}</span>
                  <div className="text-[13px] text-white/70 leading-relaxed">{item.val}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
};