import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PillButton, SectionLabel, DragNumberField, FieldDropdown } from './UIPrimitives';
import { ModelPriceTable } from './ModelPriceTable';

export interface ScriptOption {
  type: 1 | 2 | 3;
  angleLabel?: string;
  sceneCount: number;
  sceneDuration: number;
}

const CAMERA_ANGLES = [
  { id: 'closeup', label: 'Close-up (Cận cảnh)', icon: 'zoom_in', desc: 'Tập trung chi tiết mặt hoặc sản phẩm' },
  { id: 'medium', label: 'Medium (Trung cảnh)', icon: 'person', desc: 'Từ thắt lưng trở lên, phổ biến cho UGC' },
  { id: 'wide', label: 'Wide (Toàn cảnh)', icon: 'width', desc: 'Toàn bộ chủ thể và bối cảnh' },
  { id: 'high', label: 'High Angle (Góc cao)', icon: 'north_east', desc: 'Nhìn từ trên xuống, tạo cảm giác flatlay' },
  { id: 'low', label: 'Low Angle (Góc thấp)', icon: 'south_west', desc: 'Nhìn từ dưới lên, heroic style' },
  { id: 'pov', label: 'POV (Góc nhìn chủ thể)', icon: 'visibility', desc: 'Như thể người xem là nhân vật' },
];

const DURATIONS = ['4s', '6s', '8s', '10s'];

export const ScriptConfig: React.FC<{ onSelect: (opt: ScriptOption) => void }> = ({ onSelect }) => {
  const [selectedType, setSelectedType] = useState<1 | 2 | 3 | null>(null);
  const [selectedAngle, setSelectedAngle] = useState<string | null>(null);
  const [sceneCount, setSceneCount] = useState<number>(6);
  const [sceneDuration, setSceneDuration] = useState<number>(8);

  const handleConfirm = () => {
    if (!selectedType) return;
    if (selectedType === 2 && !selectedAngle) return;

    const angleObj = CAMERA_ANGLES.find(a => a.id === selectedAngle);
    onSelect({
      type: selectedType,
      angleLabel: angleObj?.label,
      sceneCount,
      sceneDuration
    });
  };

  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col gap-8 pb-20">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black uppercase tracking-tight">Cấu hình Kịch bản</h2>
          <p className="text-white/40 text-sm">Xác định cấu trúc bối cảnh và phong cách quay chụp cho kịch bản AI.</p>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        <SectionLabel>1. Phong cách bối cảnh</SectionLabel>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <OptionCard 
            active={selectedType === 1} 
            onClick={() => setSelectedType(1)}
            icon="layers"
            title="Đa bối cảnh & Góc máy"
            desc="Nhiều địa điểm, vị trí và góc quay linh hoạt. Phù hợp video lifestyle, travel."
          />
          <OptionCard 
            active={selectedType === 2} 
            onClick={() => setSelectedType(2)}
            icon="videocam"
            title="1 Địa điểm & 1 Góc máy"
            desc="Cố định duy nhất một bối cảnh và góc nhìn. Phù hợp talking head, review tĩnh."
          />
          <OptionCard 
            active={selectedType === 3} 
            onClick={() => setSelectedType(3)}
            icon="vibration"
            title="1 Địa điểm & Đa góc máy"
            desc="Chỉ một bối cảnh nhưng thay đổi góc quay (Cận, Trung, Toàn) liên tục."
          />
        </div>
      </div>

      <div className="flex flex-col gap-6 p-6 rounded-3xl bg-[#111] border border-white/10">
        <SectionLabel>2. Cấu trúc kịch bản</SectionLabel>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className="flex flex-col gap-2">
            <h4 className="text-sm font-bold text-white/90">Thông số kỹ thuật video</h4>
            <p className="text-[11px] text-white/40 leading-relaxed">
              Tùy chỉnh số lượng cảnh quay và thời lượng cho mỗi clip. Các thông số này giúp AI tối ưu hóa nhịp điệu (Pacing) của kịch bản.
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <DragNumberField 
              label="Tổng số phân cảnh" 
              value={sceneCount} 
              min={3} max={12} 
              onChange={setSceneCount} 
              suffix=" Scenes"
            />
            <FieldDropdown 
              label="Thời lượng mỗi cảnh (AI Video Engine)" 
              value={`${sceneDuration}s`} 
              options={DURATIONS} 
              onChange={(v) => setSceneDuration(parseInt(v))} 
            />
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {selectedType === 2 && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }} 
            animate={{ opacity: 1, height: 'auto' }} 
            exit={{ opacity: 0, height: 0 }}
            className="flex flex-col gap-4 p-6 rounded-3xl bg-[#111] border border-white/10 overflow-hidden"
          >
            <SectionLabel>3. Lựa chọn góc máy cố định</SectionLabel>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {CAMERA_ANGLES.map((angle) => (
                <button
                  key={angle.id}
                  onClick={() => setSelectedAngle(angle.id)}
                  className={`p-4 rounded-2xl border flex flex-col items-center text-center gap-2 transition-all ${
                    selectedAngle === angle.id ? 'bg-emerald-500/20 border-emerald-500' : 'bg-white/5 border-white/10 hover:border-white/20'
                  }`}
                >
                  <span className={`material-symbols-outlined ${selectedAngle === angle.id ? 'text-emerald-400' : 'text-white/30'}`}>{angle.icon}</span>
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold uppercase">{angle.label}</span>
                  </div>
                </button>
              ))}
            </div>
            {selectedAngle && (
              <p className="text-[10px] text-emerald-400 font-medium italic mt-2">
                * Toàn bộ kịch bản sẽ được AI viết theo góc máy {CAMERA_ANGLES.find(a => a.id === selectedAngle)?.label}.
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col gap-6 mt-4">
        <SectionLabel>3. ĐỊNH VỊ CẤU HÌNH & CHI PHÍ DÒNG VIDEO MODEL (GOOGLE FLOW)</SectionLabel>
        <ModelPriceTable />
      </div>

      <div className="flex justify-center mt-4">
        <PillButton 
          variant="solid" 
          className="w-full max-w-xs h-12" 
          disabled={!selectedType || (selectedType === 2 && !selectedAngle)}
          onClick={handleConfirm}
        >
          Xác nhận & Tạo kịch bản
        </PillButton>
      </div>
    </motion.div>
  );
};

const OptionCard: React.FC<{ active: boolean; onClick: () => void; icon: string; title: string; desc: string }> = ({ active, onClick, icon, title, desc }) => (
  <button 
    onClick={onClick}
    className={`p-6 rounded-[32px] border transition-all text-left flex flex-col gap-4 relative overflow-hidden h-full ${
      active ? 'bg-emerald-500/10 border-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.1)]' : 'bg-[#111] border-white/10 hover:border-white/20'
    }`}
  >
    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${active ? 'bg-emerald-500 text-black' : 'bg-white/5 text-white/40'}`}>
      <span className="material-symbols-outlined text-2xl">{icon}</span>
    </div>
    <div className="flex flex-col gap-2">
      <h3 className={`font-bold text-lg ${active ? 'text-white' : 'text-white/70'}`}>{title}</h3>
      <p className="text-xs text-white/40 leading-relaxed">{desc}</p>
    </div>
    {active && (
      <div className="absolute top-4 right-4 text-emerald-400">
        <span className="material-symbols-outlined text-2xl">check_circle</span>
      </div>
    )}
  </button>
);