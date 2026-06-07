import React, { useState, useEffect } from 'react';
import { Flow } from 'flow-sdk';
import { PillButton, SectionLabel, SegmentedToggle, RangeSlider, FieldDropdown } from './UIPrimitives';
import { motion, AnimatePresence } from 'framer-motion';
import { ChildStrategy, ProductionMode } from '../App';

interface ProductIntakeProps {
  medias: any[];
  onMediasChange: (medias: any[]) => void;
  mainUrl: string;
  onMainUrlChange: (url: string) => void;
  urls: string[];
  onUrlsChange: (urls: string[]) => void;
  gender: string;
  onGenderChange: (v: string) => void;
  age: number;
  onAgeChange: (v: number) => void;
  productionMode: ProductionMode;
  childStrategy: ChildStrategy;
  onChildStrategyChange: (v: ChildStrategy) => void;
  adultVoiceGender: string;
  onAdultVoiceGenderChange: (v: string) => void;
}

export const ProductIntake: React.FC<ProductIntakeProps> = ({ 
  medias, onMediasChange, mainUrl, onMainUrlChange, urls, onUrlsChange,
  gender, onGenderChange, age, onAgeChange,
  productionMode, childStrategy, onChildStrategyChange,
  adultVoiceGender, onAdultVoiceGenderChange
}) => {
  const [urlInput, setUrlInput] = useState(urls.join('\n'));
  const [urlImagePreviews, setUrlImagePreviews] = useState<string[]>([]);
  const [analyzingUrl, setAnalyzingUrl] = useState<string | null>(null);
  const [urlAnalysisResults, setUrlAnalysisResults] = useState<Record<string, string>>({});
  const [corsBlockedUrls, setCorsBlockedUrls] = useState<Record<string, boolean>>({});
  const [isPasting, setIsPasting] = useState(false);

  useEffect(() => {
    const lines = urlInput.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    const imageLinks = lines.filter(link => {
      return (
        link.match(/\.(jpeg|jpg|gif|png|webp|svg)/i) || 
        link.includes('img') || 
        link.includes('photo') ||
        link.includes('susercontent.com/file') || 
        link.startsWith('data:image')
      );
    });
    setUrlImagePreviews(imageLinks);
  }, [urlInput]);

  const handlePaste = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    let foundImage = false;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          foundImage = true;
          setIsPasting(true);
          
          const reader = new FileReader();
          reader.onload = async (event) => {
            const dataUrl = event.target?.result as string;
            const base64 = dataUrl.split(',')[1];
            
            try {
              const uploaded = await Flow.upload({
                base64,
                mimeType: file.type as any,
                name: `Pasted_${new Date().toLocaleTimeString()}`
              });

              const newMedia = {
                mediaId: uploaded.mediaId,
                base64,
                mimeType: file.type,
                type: 'image',
                name: 'Pasted Image'
              };

              onMediasChange([...medias, newMedia].slice(0, 10));
            } catch (err) {
              console.error("Lỗi upload ảnh từ clipboard:", err);
            } finally {
              setIsPasting(false);
            }
          };
          reader.readAsDataURL(file);
        }
      }
    }
  };

  const fetchImageAsBase64 = async (url: string): Promise<{ base64: string, mimeType: string } | null> => {
    try {
      const response = await fetch(url, { mode: 'cors' });
      if (!response.ok) return null;
      const blob = await response.blob();
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = (reader.result as string).split(',')[1];
          resolve({ base64, mimeType: blob.type });
        };
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(blob);
      });
    } catch (e) {
      console.warn("CORS Block detected for URL:", url);
      return null;
    }
  };

  const analyzeImageUrl = async (url: string) => {
    setAnalyzingUrl(url);
    setCorsBlockedUrls(prev => ({ ...prev, [url]: false }));
    
    try {
      const imgData = await fetchImageAsBase64(url);
      if (!imgData) {
        setCorsBlockedUrls(prev => ({ ...prev, [url]: true }));
        setUrlAnalysisResults(prev => ({ ...prev, [url]: "Lỗi bảo mật (CORS): Link này bị máy chủ sàn TMĐT chặn, AI không thể nhìn thấy pixel. Hãy tải ảnh về và Upload tay để có kết quả đúng nhất." }));
        return;
      }

      const { text } = await Flow.generate.text(
        "Mô tả cực kỳ ngắn gọn sản phẩm này là gì? (Ví dụ: Túi len handmade màu hồng). Nếu không phải sản phẩm, hãy báo lỗi.",
        { 
          images: [{ base64: imgData.base64, mimeType: imgData.mimeType }],
          thinkingLevel: 'high'
        }
      );
      setUrlAnalysisResults(prev => ({ ...prev, [url]: text }));
    } catch (e) {
      setUrlAnalysisResults(prev => ({ ...prev, [url]: "Lỗi phân tích AI." }));
    } finally {
      setAnalyzingUrl(null);
    }
  };

  const handleUpload = async () => {
    try {
      const selected = await Flow.media.selectMultiple({ filter: 'image', maxCount: 10 });
      onMediasChange([...medias, ...selected].slice(0, 10)); 
    } catch (e) {
      console.error("Upload failed", e);
    }
  };

  const removeMedia = (id: string) => {
    onMediasChange(medias.filter(m => m.mediaId !== id));
  };

  const handleUrlBlur = () => {
    const lines = urlInput.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    onUrlsChange(lines);
  };

  const isChildUGC = age < 13 && productionMode === 'with_voice';

  return (
    <div className="flex flex-col gap-8 w-full">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-4 text-left">
            <SectionLabel>1. Cấu hình Input & Context</SectionLabel>
            <div className="flex flex-col gap-2">
              <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest pl-2">
                Link sản phẩm chính (Shopee, TikTok, Landing Page...)
              </p>
              <input 
                type="text"
                value={mainUrl}
                onChange={(e) => onMainUrlChange(e.target.value)}
                onPaste={handlePaste}
                placeholder="Dán link sản phẩm hoặc Paste trực tiếp ảnh tại đây..."
                className="w-full h-12 bg-[#0a0a0a] border border-white/10 hover:border-emerald-500/40 focus:border-emerald-500 rounded-2xl px-5 text-[12px] text-white/80 placeholder-white/10 outline-none transition-all shadow-xl"
              />
            </div>
          </div>

          <div className="flex flex-col gap-4 text-left">
            <SectionLabel>3. Target Model Profile (Intelligence Insight)</SectionLabel>
            <div className="p-6 rounded-3xl bg-[#0a0a0a] border border-white/10 flex flex-col gap-6 shadow-xl">
               <div className="flex flex-col gap-3">
                  <span className="text-[10px] font-black text-emerald-400/60 uppercase tracking-widest">Giới tính Model UGC</span>
                  <SegmentedToggle 
                    value={gender} 
                    onChange={onGenderChange} 
                    items={[
                      { value: 'Nữ', label: 'Nữ', icon: <span className="material-symbols-outlined text-[16px]">female</span> }, 
                      { value: 'Nam', label: 'Nam', icon: <span className="material-symbols-outlined text-[16px]">male</span> }
                    ]} 
                  />
               </div>
               <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-black text-emerald-400/60 uppercase tracking-widest mb-1 ml-2">Độ tuổi Model mục tiêu</span>
                  <RangeSlider 
                    label="Target Age" 
                    value={age} 
                    min={0.5} max={70} 
                    step={0.5}
                    onChange={onAgeChange} 
                    formatValue={(v) => `${v} tuổi`}
                  />
               </div>
               
               {/* LOGIC MỚI: Chiến lược Child UGC */}
               <AnimatePresence>
                 {isChildUGC && (
                   <motion.div 
                    initial={{ opacity: 0, height: 0 }} 
                    animate={{ opacity: 1, height: 'auto' }} 
                    exit={{ opacity: 0, height: 0 }}
                    className="flex flex-col gap-4 pt-4 mt-2 border-t border-white/5 overflow-hidden"
                   >
                     <div className="flex items-center gap-2 mb-1">
                       <span className="material-symbols-outlined text-emerald-400 text-[18px]">child_care</span>
                       <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Chiến lược Child-UGC</span>
                     </div>
                     <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 flex flex-col gap-4">
                       <div className="flex flex-col gap-2">
                         <span className="text-[9px] font-black text-white/40 uppercase">Chọn Option kịch bản & Giọng thoại</span>
                         <div className="grid grid-cols-1 gap-2">
                           <button 
                             onClick={() => onChildStrategyChange('child_voice')}
                             className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all ${childStrategy === 'child_voice' ? 'bg-emerald-500 border-emerald-500 text-black' : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'}`}
                           >
                             <span className="text-[10px] font-black uppercase">Option 1: Voice Trẻ Em</span>
                             <span className={`text-[9px] leading-tight ${childStrategy === 'child_voice' ? 'text-black/60' : 'text-white/30'}`}>Concept & Voice Script dành riêng cho trẻ em theo độ tuổi & giới tính.</span>
                           </button>
                           <button 
                             onClick={() => onChildStrategyChange('adult_voice')}
                             className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all ${childStrategy === 'adult_voice' ? 'bg-emerald-500 border-emerald-500 text-black' : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'}`}
                           >
                             <span className="text-[10px] font-black uppercase">Option 2: Người lớn kể chuyện</span>
                             <span className={`text-[9px] leading-tight ${childStrategy === 'adult_voice' ? 'text-black/60' : 'text-white/30'}`}>Concept Trẻ em + Voice Người lớn kể chuyện, miêu tả, quảng cáo để tối ưu chuyển đổi.</span>
                           </button>
                         </div>
                       </div>
                       
                       {childStrategy === 'adult_voice' && (
                         <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-2">
                           <span className="text-[9px] font-black text-white/40 uppercase">Giới tính Voice Người lớn</span>
                           <SegmentedToggle 
                            value={adultVoiceGender} 
                            onChange={onAdultVoiceGenderChange} 
                            items={[
                              { value: 'Nữ', label: 'Giọng Nữ' }, 
                              { value: 'Nam', label: 'Giọng Nam' }
                            ]} 
                          />
                         </motion.div>
                       )}
                     </div>
                   </motion.div>
                 )}
               </AnimatePresence>

               <p className="text-[9px] text-white/30 italic">
                 * Thông tin này sẽ giúp AI xây dựng Concept và viết kịch bản phù hợp với phong thái của nhân vật mục tiêu.
               </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-4 text-left">
            <SectionLabel>2. Tài nguyên Media & Assets</SectionLabel>
            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-center px-2">
                <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">
                  Xác nhận Hình ảnh ({medias.length + urlImagePreviews.length}/12)
                </span>
                <button 
                  onClick={handleUpload} 
                  className="text-emerald-400 text-[10px] font-bold uppercase hover:underline flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[14px]">add_a_photo</span> Gallery
                </button>
              </div>
              
              <div className="p-5 rounded-3xl bg-[#0a0a0a] border border-white/10 min-h-[160px] flex flex-wrap gap-2.5 content-start shadow-inner relative overflow-hidden">
                <AnimatePresence>
                  {isPasting && (
                    <motion.div 
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="absolute inset-0 z-20 bg-emerald-500/10 backdrop-blur-[2px] flex items-center justify-center rounded-3xl border-2 border-dashed border-emerald-500/40"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                        <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Magic Pasting...</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {(medias.length === 0 && urlImagePreviews.length === 0) && (
                  <div className="w-full h-28 flex flex-col items-center justify-center gap-2 opacity-20 border-2 border-dashed border-white/10 rounded-2xl">
                    <span className="material-symbols-outlined text-4xl">collections</span>
                    <span className="text-[10px] font-bold uppercase tracking-tighter">Dán link hoặc Paste ảnh trực tiếp</span>
                  </div>
                )}

                {medias.map((m) => (
                  <div key={m.mediaId} className="relative group w-20 h-20 rounded-2xl overflow-hidden border border-white/10 bg-black shadow-lg">
                    <img src={`data:${m.mimeType};base64,${m.base64}`} className="w-full h-full object-cover" alt="Asset" />
                    <button onClick={() => removeMedia(m.mediaId)} className="absolute inset-0 bg-red-500/90 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center text-white backdrop-blur-[2px]">
                      <span className="material-symbols-outlined text-[20px]">delete</span>
                    </button>
                  </div>
                ))}

                {urlImagePreviews.map((url, idx) => (
                  <div key={`url-${idx}`} className={`relative group w-20 h-20 rounded-2xl overflow-hidden border bg-black shadow-lg transition-all ${corsBlockedUrls[url] ? 'border-red-500/50' : 'border-emerald-500/30'}`}>
                    <img src={url} className={`w-full h-full object-cover ${corsBlockedUrls[url] ? 'opacity-30 grayscale' : 'opacity-100'}`} alt="URL Preview" onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/100x100/111/444?text=Link'; }} />
                    {corsBlockedUrls[url] && <div className="absolute inset-0 flex items-center justify-center"><span className="material-symbols-outlined text-red-500 text-[20px]">warning</span></div>}
                    <div className={`absolute top-1 left-1 rounded-md px-1 py-0.5 shadow-sm ${corsBlockedUrls[url] ? 'bg-red-500' : 'bg-emerald-500'}`}><span className="text-[8px] font-black text-black uppercase">{corsBlockedUrls[url] ? 'BLOCKED' : 'LINK'}</span></div>
                    <button onClick={() => analyzeImageUrl(url)} disabled={analyzingUrl === url} className="absolute bottom-1 right-1 w-6 h-6 rounded-lg bg-black/80 border border-white/20 flex items-center justify-center text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-emerald-500 hover:text-black"><span className={`material-symbols-outlined text-[14px] ${analyzingUrl === url ? 'animate-spin' : ''}`}>{analyzingUrl === url ? 'sync' : 'search'}</span></button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <textarea 
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                onBlur={handleUrlBlur}
                onPaste={handlePaste}
                placeholder="Dán link các ảnh sản phẩm hoặc Paste trực tiếp file ảnh tại đây..."
                className="w-full h-[120px] bg-[#0a0a0a] border border-white/10 hover:border-white/20 focus:border-white/40 rounded-3xl p-5 text-[12px] text-white/60 placeholder-white/10 outline-none transition-all resize-none font-mono leading-relaxed shadow-inner"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};