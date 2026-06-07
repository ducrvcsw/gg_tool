import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flow } from 'flow-sdk';
import { PillButton, SectionLabel, SegmentedToggle, TextInput } from './UIPrimitives';
import { VoiceScriptMode, VoiceSourceMode, ChildStrategy } from '../App';

interface VoiceStudioProps {
  script: string;
  onUpdateSuggestedScript: (newScript: string) => void;
  voiceScriptMode: VoiceScriptMode;
  onModeChange: (mode: VoiceScriptMode) => void;
  voiceSourceMode: VoiceSourceMode;
  onVoiceSourceModeChange: (mode: VoiceSourceMode) => void;
  customVoiceScript: string;
  onCustomScriptChange: (script: string) => void;
  conceptName?: string;
  audioMedia: any;
  onUpload: () => void;
  onNext: () => void;
  modelGender: string;
  modelAge: number;
  childStrategy: ChildStrategy;
  adultVoiceGender: string;
  sceneCount: number;
  sceneDuration: number;
}

export const VoiceStudio: React.FC<VoiceStudioProps> = ({ 
  script, 
  onUpdateSuggestedScript,
  voiceScriptMode,
  onModeChange,
  voiceSourceMode,
  onVoiceSourceModeChange,
  customVoiceScript,
  onCustomScriptChange,
  conceptName,
  audioMedia, 
  onUpload, 
  onNext,
  modelGender,
  modelAge,
  childStrategy,
  adultVoiceGender,
  sceneCount,
  sceneDuration
}) => {
  const [copied, setCopied] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCopy = () => {
    const textToCopy = voiceScriptMode === 'suggested' ? script : customVoiceScript;
    if (!textToCopy) return;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRegenerate = async () => {
    setIsRegenerating(true);
    setError(null);
    try {
      const totalSeconds = sceneCount * sceneDuration;
      const adStylesList = `
      - Review / Unboxing (Trải nghiệm thực tế)
      - Before & After (Lột xác)
      - Storytelling Ads (Drama ngắn/Kể chuyện)
      - Lookbook (Phối đồ thẩm mỹ)
      - Problem - Solution (Khắc phục nỗi đau)
      - Challenge (Thử thách độc lạ)
      - POV (Góc nhìn chủ thể)
      - Truth about (Vạch trần sự thật)
      - Top List (Danh sách bắt trend)
      - ASMR / Aesthetic (Thanh thị giác đỉnh cao)`;

      let strategyContext = "";
      if (modelAge <= 13) {
        if (childStrategy === 'child_voice') {
          strategyContext = `CHIẾN LƯỢC CHILD-UGC: Giọng TRẺ EM (${modelAge} tuổi). Lời thoại ngây ngô, tự nhiên.`;
        } else {
          strategyContext = `CHIẾN LƯỢC CHILD-UGC: Giọng NGƯỜI LỚN (${adultVoiceGender}) kể về bé (${modelAge} tuổi). Ấm áp, truyền cảm.`;
        }
      } else {
        strategyContext = `MODEL: ${modelGender}, ~${modelAge} tuổi. Phù hợp phong cách sống hiện đại.`;
      }

      const { text } = await Flow.generate.text(
        `Bạn là chuyên gia biên kịch Voice-over cho video quảng cáo chuyển đổi cao.
        Dựa trên concept '${conceptName || 'UGC Commercial'}', hãy viết lại một bản MASTER SCRIPT hoàn hảo.

        PHONG CÁCH QUẢNG CÁO (Mixing linh hoạt):
        ${adStylesList}

        ${strategyContext}

        YÊU CẦU KỸ THUẬT NGHIÊM NGẶT:
        - TỔNG THỜI LƯỢNG VOICE: CHÍNH XÁC ${totalSeconds} GIÂY.
        - Tốc độ đọc: 3 từ/giây. Tổng cộng khoảng ${totalSeconds * 3} từ.
        - Ngắn gọn nhưng phải HAY, LÔI CUỐN, đầy đủ Hook và CTA.
        - Tập trung vào sản phẩm, thu hút ngay từ 3 giây đầu.
        - Ngôn ngữ: Tiếng Việt.

        Chỉ trả về nội dung lời thoại, không kèm tiêu đề hay ghi chú thừa.`,
        { thinkingLevel: 'high' }
      );
      onUpdateSuggestedScript(text.trim());
    } catch (err) {
      setError("Không thể tạo lại kịch bản. Vui lòng thử lại.");
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleNext = () => {
    if (voiceScriptMode === 'own' && (!customVoiceScript || customVoiceScript.trim() === '')) {
      setError("Vui lòng nhập nội dung kịch bản thoại của riêng bạn trước khi tiếp tục.");
      return;
    }
    if (voiceScriptMode === 'suggested' && (!script || script.trim() === '')) {
      setError("Kịch bản thoại gợi ý đang trống.");
      return;
    }
    
    if (voiceSourceMode === 'upload' && !audioMedia) {
      setError("Vui lòng tải lên file Audio Voiceover hoặc chuyển sang chế độ Omni Flash Voice Auto.");
      return;
    }

    setError(null);
    onNext();
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-8">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-black uppercase tracking-tight">Voice Studio</h2>
          <p className="text-white/40 text-sm">Chuẩn bị kịch bản thoại và nạp Audio tham chiếu cho Video Production.</p>
        </div>
        <div className="w-48">
          <PillButton variant="solid" onClick={handleNext}>
            Tiếp tục: Tạo Ảnh
          </PillButton>
        </div>
      </div>

      {error && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-[11px] font-bold flex items-center gap-3">
          <span className="material-symbols-outlined text-[18px]">error</span>
          {error}
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-4">
            <SectionLabel>Script Strategy</SectionLabel>
            <SegmentedToggle 
              value={voiceScriptMode} 
              onChange={(m) => { onModeChange(m as VoiceScriptMode); setError(null); }}
              items={[
                { value: 'suggested', label: 'Suggested Script', icon: <span className="material-symbols-outlined text-[16px]">smart_toy</span> },
                { value: 'own', label: 'Custom Script', icon: <span className="material-symbols-outlined text-[16px]">edit_note</span> }
              ]}
            />
          </div>

          <div className="flex flex-col gap-4 p-6 rounded-3xl bg-[#111] border border-white/10 shadow-2xl relative min-h-[400px]">
            <div className="absolute top-6 right-6 flex items-center gap-2">
              <button 
                onClick={handleCopy}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${copied ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20' : 'bg-white/5 text-white hover:bg-white/10 border border-white/5'}`}
              >
                <span className="material-symbols-outlined text-[14px]">{copied ? 'check' : 'content_copy'}</span>
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
            
            <SectionLabel>
              {voiceScriptMode === 'suggested' ? 'Master Script (Suggested)' : 'Your Creative Script'}
            </SectionLabel>

            <AnimatePresence mode="wait">
              {voiceScriptMode === 'suggested' ? (
                <motion.div key="suggested" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col flex-1 gap-4">
                  <div className="flex-1 bg-black/40 rounded-2xl border border-white/5 p-5 font-mono text-[13px] text-white/80 leading-relaxed overflow-y-auto dark-scrollbar whitespace-pre-wrap relative group">
                    {isRegenerating && (
                      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-10 rounded-2xl">
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                          <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Regenerating...</span>
                        </div>
                      </div>
                    )}
                    {script || "Kịch bản thoại chưa được khởi tạo. Hãy quay lại bước Script."}
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <p className="text-[9px] text-white/20 italic uppercase tracking-widest font-black">AI Gemini 3.5 Flash Engine</p>
                    <button 
                      onClick={handleRegenerate}
                      disabled={isRegenerating}
                      className="flex items-center gap-2 text-emerald-400 text-[10px] font-black uppercase tracking-wider hover:text-emerald-300 transition-colors disabled:opacity-40"
                    >
                      <span className="material-symbols-outlined text-[16px]">autorenew</span>
                      Regenerate New Version
                    </button>
                  </div>
                </motion.div>
              ) : (
                <motion.div key="own" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col flex-1">
                  <TextInput 
                    value={customVoiceScript}
                    onChange={onCustomScriptChange} 
                    placeholder="Nhập kịch bản thoại cá nhân hóa của bạn tại đây..." 
                    className="flex-1 min-h-[300px] text-[13px] !bg-emerald-500/5 !border-emerald-500/20 focus:!border-emerald-500/50"
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-4">
            <SectionLabel>Voice Source Mode</SectionLabel>
            <SegmentedToggle 
              value={voiceSourceMode} 
              onChange={(m) => { onVoiceSourceModeChange(m as VoiceSourceMode); setError(null); }}
              items={[
                { value: 'upload', label: 'Upload File', icon: <span className="material-symbols-outlined text-[16px]">upload</span> },
                { value: 'auto', label: 'Omni Flash Voice Auto', icon: <span className="material-symbols-outlined text-[16px]">bolt</span> }
              ]}
            />
          </div>

          <AnimatePresence mode="wait">
            {voiceSourceMode === 'upload' ? (
              <motion.div 
                key="upload-ui"
                initial={{ opacity: 0, scale: 0.95 }} 
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="p-8 rounded-3xl bg-emerald-500/5 border border-emerald-500/10 flex flex-col items-center justify-center text-center gap-6 min-h-[300px]"
              >
                <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${audioMedia ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/30' : 'bg-white/5 text-white/20 animate-pulse'}`}>
                  <span className="material-symbols-outlined text-4xl">{audioMedia ? 'check_circle' : 'mic'}</span>
                </div>
                <div className="flex flex-col gap-2">
                  <h3 className="text-lg font-bold">{audioMedia ? 'Audio Staged Successfully' : 'Upload Voiceover Record'}</h3>
                  <p className="text-white/40 text-[12px] max-w-xs">Tải lên file âm thanh (.mp3, .wav) để hệ thống bắt đầu quy trình Lip-Sync Video Gen.</p>
                </div>
                
                <div className="w-full max-w-xs">
                  <PillButton variant="outline" icon={<span className="material-symbols-outlined">upload</span>} onClick={onUpload}>
                    {audioMedia ? 'Change File' : 'Select Audio File'}
                  </PillButton>
                </div>

                {audioMedia && (
                  <div className="p-5 w-full rounded-2xl bg-[#111] border border-emerald-500/20 flex items-center gap-4 shadow-xl mt-4">
                    <div className="w-12 h-12 rounded-xl bg-emerald-500 text-black flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined">settings_voice</span>
                    </div>
                    <div className="flex-1 overflow-hidden text-left">
                      <p className="text-[12px] font-black text-white truncate uppercase">{audioMedia?.name || "Audio File"}</p>
                      <audio src={`data:${audioMedia.mimeType};base64,${audioMedia.base64}`} controls className="h-8 w-32" />
                    </div>
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div 
                key="auto-ui"
                initial={{ opacity: 0, scale: 0.95 }} 
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="p-8 rounded-3xl bg-emerald-500/5 border border-emerald-500/20 flex flex-col items-center justify-center text-center gap-6 min-h-[300px]"
              >
                <div className="w-20 h-20 rounded-full bg-emerald-500 text-black flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.3)] animate-pulse">
                  <span className="material-symbols-outlined text-5xl">bolt</span>
                </div>
                <div className="flex flex-col gap-2">
                  <h3 className="text-lg font-bold">Omni Flash Voice Auto: ON</h3>
                  <p className="text-white/40 text-[12px] max-w-sm">Hệ thống sẽ tự động tạo Voice tiếng Việt phù hợp với kịch bản, độ tuổi ({modelAge}), giới tính ({modelGender}) và phong cách UGC mà bạn đã chọn.</p>
                </div>
                <div className="grid grid-cols-2 gap-3 w-full">
                   <div className="p-3 rounded-xl bg-white/5 border border-white/5 flex flex-col gap-1 items-start">
                      <span className="text-[9px] font-black text-white/30 uppercase tracking-widest">Language</span>
                      <span className="text-[11px] font-bold text-emerald-400">TIẾNG VIỆT</span>
                   </div>
                   <div className="p-3 rounded-xl bg-white/5 border border-white/5 flex flex-col gap-1 items-start">
                      <span className="text-[9px] font-black text-white/30 uppercase tracking-widest">Profile Match</span>
                      <span className="text-[11px] font-bold text-emerald-400">{modelGender} | {modelAge}y</span>
                   </div>
                </div>
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 w-full text-left">
                  <span className="text-[9px] font-black text-emerald-400 uppercase tracking-[2px] mb-1 block">Tone Chiến lược</span>
                  <p className="text-[11px] text-white/70 leading-relaxed">
                    {modelAge <= 13 
                      ? (childStrategy === 'child_voice' ? "Tone Trẻ em: Hồn nhiên, vui tươi, sinh động." : `Tone Kể chuyện: Ấm áp, thuyết phục từ giọng người lớn (${adultVoiceGender}).`)
                      : "Tone UGC: Chân thực, gần gũi, năng lượng cao, lôi cuốn."
                    }
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};