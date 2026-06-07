import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flow } from 'flow-sdk';
import { PillButton, SectionLabel, FieldDropdown } from './UIPrimitives';
import { JobStatus, AspectRatio, ProductionMode, VoiceSourceMode, ChildStrategy } from '../App';

const VIDEO_MODELS = [
  'Omni Flash', 
  'Veo 3.1 - Lite', 
  'Veo 3.1 - Fast', 
  'Veo 3.1 - Quality'
];

interface VideoProductionProps {
  data: any; 
  productionMode: ProductionMode;
  voiceSourceMode: VoiceSourceMode;
  childStrategy: ChildStrategy;
  adultVoiceGender: string;
  modelGender: string;
  modelAge: number;
  audioReferenceMedia: any;
  aspectRatio: AspectRatio;
  sceneDuration: number;
  onUpdateData: (d: any) => void; 
  onNext: () => void; 
  onBack: () => void;
  addJob: (job: { id: string; type: 'video'; label: string; sceneIndex: number; target: string }) => string;
  updateJob: (id: string, status: JobStatus, error?: string) => void;
}

export const VideoProduction: React.FC<VideoProductionProps> = ({ 
  data, 
  productionMode, 
  voiceSourceMode, 
  childStrategy, 
  adultVoiceGender, 
  modelGender, 
  modelAge, 
  audioReferenceMedia, 
  aspectRatio, 
  sceneDuration, 
  onUpdateData, 
  onNext, 
  onBack, 
  addJob, 
  updateJob 
}) => {
  const [loading, setLoading] = useState<Record<number, boolean>>({});
  const [downloading, setDownloading] = useState<Record<number, boolean>>({});
  const [auditing, setAuditing] = useState<Record<number, boolean>>({});
  const [auditResults, setAuditResults] = useState<Record<number, { reason: string, suggestion: string } | null>>({});
  const [selectedModel, setSelectedModel] = useState(VIDEO_MODELS[0]);
  
  const timeline = Array.isArray(data?.script_timeline) 
    ? data.script_timeline 
    : (data?.script_timeline?.script_timeline || data?.production_script_timeline || []);

  const getAspectClass = (ratio: AspectRatio) => {
    switch (ratio) {
      case '16:9': return 'aspect-video';
      case '9:16': return 'aspect-[9/16]';
      case '1:1': return 'aspect-square';
      case '4:3': return 'aspect-[4/3]';
      case '3:4': return 'aspect-[3/4]';
      default: return 'aspect-[9/16]';
    }
  };

  const sanitizePromptForOmni = (rawPrompt: string) => {
    let p = rawPrompt.toLowerCase();
    const replacements: Record<string, string> = {
      'vietnamese girl': 'professional asian talent',
      'vietnamese woman': 'professional asian talent',
      'girl': 'brand ambassador',
      'woman': 'commercial subject',
      'lady': 'professional figure',
      'female': 'commercial subject',
      'sexy': 'sophisticated',
      'hot': 'vibrant and premium',
      'attractive': 'aesthetic',
      'beautiful': 'high-end',
      'pretty': 'polished',
      'cute': 'cinematic',
      'skin': 'complexion',
      'body': 'figure',
      'wearing': 'presented in',
      'naked': 'minimalist',
      'underclothing': 'apparel'
    };
    Object.entries(replacements).forEach(([bad, good]) => {
      const reg = new RegExp(`\\b${bad}\\b`, 'g');
      p = p.replace(reg, good);
    });
    return p;
  };

  const handleAuditPrompt = async (idx: number) => {
    const scene = timeline[idx];
    if (!scene) return;
    
    setAuditing(p => ({ ...p, [idx]: true }));
    setAuditResults(p => ({ ...p, [idx]: null }));

    try {
      const basePrompt = scene.ai_video_generation_command?.video_prompt || scene.visual_action || "";
      const modelInfo = selectedModel;
      
      const { text } = await Flow.generate.text(
        `BẠN LÀ CHUYÊN GIA KIỂM DUYỆT AI (AI SAFETY AUDITOR). 
        Nhiệm vụ: Kiểm tra Prompt tạo video sau đây có khả năng vi phạm chính sách an toàn (Safety Policy) của model "${modelInfo}" hay không.
        
        PROMPT CẦN KIỂM TRA: "${basePrompt}"
        
        Các lỗi thường gặp: Từ ngữ gợi dục (sexy, hot, skin, body), bạo lực, trẻ em trong bối cảnh nhạy cảm, hoặc bản quyền.
        
        YÊU CẦU TRẢ VỀ JSON:
        {
          "reason": "Giải thích ngắn gọn lý do tại sao prompt này có thể bị chặn bởi ${modelInfo} (Tiếng Việt)",
          "suggestion": "Prompt mới đã được làm sạch, thay thế các từ nhạy cảm bằng thuật ngữ chuyên môn thương mại (Tiếng Anh), vẫn giữ nguyên ý tưởng gốc."
        }`,
        { thinkingLevel: 'medium' }
      );

      // Simple JSON extractor
      const start = text.indexOf('{');
      const end = text.lastIndexOf('}');
      if (start !== -1 && end !== -1) {
        const jsonStr = text.substring(start, end + 1);
        const parsed = JSON.parse(jsonStr);
        setAuditResults(p => ({ ...p, [idx]: parsed }));
      } else {
        throw new Error("Không thể phân tích kết quả kiểm tra.");
      }
    } catch (e) {
      console.error(e);
      setAuditResults(p => ({ ...p, [idx]: { reason: "Lỗi kết nối kiểm tra.", suggestion: "" } }));
    } finally {
      setAuditing(p => ({ ...p, [idx]: false }));
    }
  };

  const applyAuditSuggestion = (idx: number) => {
    const suggestion = auditResults[idx]?.suggestion;
    if (!suggestion) return;

    const newTimeline = [...timeline];
    if (newTimeline[idx].ai_video_generation_command) {
      newTimeline[idx].ai_video_generation_command.video_prompt = suggestion;
    } else {
      newTimeline[idx].visual_action = suggestion;
    }
    
    onUpdateData({ ...data, script_timeline: newTimeline });
    setAuditResults(p => ({ ...p, [idx]: null }));
  };

  const handleDownload = async (scene: any, idx: number) => {
    if (!scene.generated_video) return;
    setDownloading(p => ({ ...p, [idx]: true }));
    try {
      await Flow.download({
        base64: scene.generated_video.base64,
        mimeType: scene.generated_video.mimeType,
        filename: `UGC_Scene_${idx + 1}_${Date.now()}.mp4`
      });
    } catch (e) {
      console.error(e);
    } finally {
      setDownloading(p => ({ ...p, [idx]: false }));
    }
  };

  const generateVideo = async (idx: number) => {
    const key = idx;
    const jobId = `${Date.now()}-video-${idx}`;
    setLoading(p => ({ ...p, [key]: true }));
    
    addJob({
      id: jobId,
      type: 'video',
      label: `Generating Clip ${idx + 1}`,
      sceneIndex: idx,
      target: 'video'
    });

    try {
      const scene = timeline[idx];
      if (!scene) throw new Error("Dữ liệu phân cảnh bị thiếu.");
      
      const videoRatio: '16:9' | '9:16' = (aspectRatio === '16:9' || aspectRatio === '4:3') ? '16:9' : '9:16';
      
      let voiceRule = "";
      if (productionMode === 'with_voice') {
        if (voiceSourceMode === 'auto') {
          let voiceProfile = "";
          if (modelAge <= 13) {
            voiceProfile = childStrategy === 'child_voice' 
              ? `CHILD VOICE (${modelAge}yo Vietnamese child), natural, innocent, cute tone.` 
              : `ADULT STORYTELLER VOICE (${adultVoiceGender} Vietnamese), warm, persuasive tone, talking about a child.`;
          } else {
            voiceProfile = `UGC AUTHENTIC VOICE (${modelGender} Vietnamese, around ${modelAge}yo), energetic, relatable, highly engaging tone.`;
          }

          voiceRule = ` MANDATORY VOICE SYNC: The subject is speaking VIETNAMESE. 
            VOICE CHARACTERISTICS: ${voiceProfile} 
            SCRIPT: "${scene.voiceover_audio || "Sản phẩm tuyệt vời"}". 
            Sync lips perfectly to Vietnamese phonetics and UGC conversational rhythm.`;
        } else {
          voiceRule = " IMPORTANT: The subject is speaking VIETNAMESE. Sync lips perfectly to the provided audio phonetics.";
        }
      } else {
        voiceRule = " Rule: The subject is SILENT. No dialogue. Focus on expressions and product usage. Background should feature upbeat cinematic background music.";
      }

      const isOmni = selectedModel.includes('Omni');
      const visualMediaId = scene.generated_assets?.scene_image?.mediaId;

      if (!visualMediaId) {
        throw new Error("Phân cảnh chưa có hình ảnh tham chiếu (Visual Scene). Vui lòng tạo Visual trước.");
      }

      let baseVPrompt = scene.ai_video_generation_command?.video_prompt || scene.visual_action || "High-end commercial video";
      
      const options: any = {
        modelDisplayName: selectedModel,
        aspectRatio: videoRatio,
        durationSeconds: isOmni ? (sceneDuration || 8) : 8 
      };

      if (isOmni) {
        const sanitized = sanitizePromptForOmni(baseVPrompt);
        options.prompt = `High-end cinematic advertising showcase: ${sanitized}. Commercial studio lighting, 8k professional photorealistic quality, brand presentation aesthetic. ${voiceRule}`;
      } else {
        options.prompt = `UGC Commercial: ${baseVPrompt}. High fidelity product details. ${voiceRule}`;
      }

      if (productionMode === 'with_voice') {
        if (voiceSourceMode === 'upload' && audioReferenceMedia) {
          if (selectedModel === 'Veo 3.1 - Quality') {
            throw new Error("Model 'Veo 3.1 - Quality' hiện không hỗ trợ Voice Sync. Vui lòng chọn Omni hoặc Veo Lite/Fast.");
          }
          options.audioReferenceMediaIds = [audioReferenceMedia.mediaId];
          options.referenceImageMediaIds = [visualMediaId];
        } else if (voiceSourceMode === 'auto') {
          options.referenceImageMediaIds = [visualMediaId];
        } else {
          options.firstFrameImageMediaId = visualMediaId;
        }
      } else {
        if (isOmni) {
          options.referenceImageMediaIds = [visualMediaId];
        } else {
          options.firstFrameImageMediaId = visualMediaId;
        }
      }

      const res = await Flow.generate.video(options);

      const newTimeline = [...timeline];
      newTimeline[idx] = { ...newTimeline[idx], generated_video: res };
      onUpdateData({ ...data, script_timeline: newTimeline });
      updateJob(jobId, 'done');
    } catch (e) {
      const errMsg = e instanceof Error ? e.message : "Video Generation Failed";
      const isPolicy = errMsg.toLowerCase().includes('policy') || errMsg.toLowerCase().includes('violation');
      const finalMsg = isPolicy
        ? "Omni Safety Filter: Prompt bị chặn do chứa từ khóa nhạy cảm. Hãy dùng tính năng 'Check Violate' để làm sạch prompt."
        : errMsg;
      
      updateJob(jobId, 'fail', finalMsg);
    } finally {
      setLoading(p => ({ ...p, [key]: false }));
    }
  };

  const generateAllVideos = async () => {
    const promises = timeline.map((_: any, i: number) => {
        // Chỉ chạy các scene có visual assets
        if (timeline[i]?.generated_assets?.scene_image) {
            return generateVideo(i);
        }
        return Promise.resolve();
    });
    await Promise.all(promises);
  };

  const allReady = timeline.length > 0 && timeline.every((s: any) => s.generated_video);
  const isAnyLoading = Object.values(loading).some(v => v);

  if (timeline.length === 0) return (
    <div className="flex flex-col items-center justify-center p-20 gap-4 bg-white/5 border border-dashed border-white/10 rounded-[40px]">
       <span className="material-symbols-outlined text-5xl text-white/10">videocam</span>
       <div className="text-center">
         <p className="text-white/40 text-lg font-bold">Dữ liệu kịch bản rỗng</p>
         <p className="text-white/20 text-sm">Hãy hoàn tất bước Visual (Tạo ảnh) trước khi tiến hành tạo video.</p>
       </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center hover:bg-white/5 transition-colors"><span className="material-symbols-outlined">arrow_back</span></button>
          <div className="flex flex-col">
            <h2 className="text-2xl font-black uppercase tracking-tight">AI Video Factory</h2>
            <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest">
              {productionMode === 'with_voice' 
                ? (voiceSourceMode === 'auto' ? "Omni Flash Voice Auto: ACTIVE (Tiếng Việt)" : `Voice Sync: ${audioReferenceMedia?.name || 'Staged'}`)
                : "No Voice (Music Only)"
              } | Target Ratio: {aspectRatio}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <PillButton 
            variant="outline" 
            className="w-48 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
            icon={<span className="material-symbols-outlined text-[18px]">temp_preferences_custom</span>}
            onClick={generateAllVideos}
            disabled={isAnyLoading}
          >
            Generate All Videos
          </PillButton>
          <PillButton variant="solid" disabled={!allReady} onClick={onNext} className="w-48">Tiếp tục: Export</PillButton>
        </div>
      </div>

      <div className="flex items-center gap-4 bg-[#111] p-4 rounded-2xl border border-white/5 shadow-xl">
        <div className="w-64">
          <FieldDropdown label="Video Generation Model" value={selectedModel} options={VIDEO_MODELS} onChange={setSelectedModel} />
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-[9px] font-black text-white/30 uppercase tracking-[1.5px]">Engine Consistency</span>
          <p className="text-[10px] text-white/60">
            {voiceSourceMode === 'auto' 
              ? "Tự động tạo giọng tiếng Việt UGC khớp kịch bản, giới tính và độ tuổi."
              : "Sử dụng Audio Reference để thực hiện Lip-sync chuẩn xác."
            }
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {timeline.map((scene: any, idx: number) => (
          <div key={idx} className="p-4 rounded-3xl bg-[#111] border border-white/10 flex flex-col gap-4">
            <div className="flex justify-between items-center px-1">
              <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Scene {idx+1} ({selectedModel.includes('Omni') ? sceneDuration : 8}s)</span>
              {scene.generated_video && (
                <div className="flex items-center gap-2">
                   <button 
                     onClick={() => handleDownload(scene, idx)}
                     disabled={downloading[idx]}
                     className="p-1 hover:bg-white/10 rounded-lg text-emerald-400 transition-colors"
                     title="Tải video này"
                   >
                     <span className={`material-symbols-outlined text-[18px] ${downloading[idx] ? 'animate-spin' : ''}`}>
                       {downloading[idx] ? 'sync' : 'download'}
                     </span>
                   </button>
                   <span className="text-[9px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded font-black">READY</span>
                </div>
              )}
            </div>

            <div className={`bg-black rounded-2xl border border-white/5 relative overflow-hidden flex items-center justify-center ${getAspectClass(aspectRatio)}`}>
              {scene.generated_video ? (
                 <video 
                   src={`data:${scene.generated_video.mimeType};base64,${scene.generated_video.base64}`} 
                   className={`w-full h-full object-cover transition-opacity duration-700 ${loading[idx] ? 'opacity-30' : 'opacity-100'}`} 
                   autoPlay loop muted playsInline
                 />
              ) : (
                <div className="relative w-full h-full">
                  {scene.generated_assets?.scene_image && <img src={`data:${scene.generated_assets.scene_image.mimeType};base64,${scene.generated_assets.scene_image.base64}`} className="w-full h-full object-cover opacity-20" />}
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                     <span className="material-symbols-outlined text-4xl text-white/20">movie_edit</span>
                     <span className="text-[10px] font-bold uppercase text-white/10">Awaiting Render</span>
                  </div>
                </div>
              )}
              <AnimatePresence>
                {loading[idx] && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-blue-500/10 backdrop-blur-[4px] z-10 flex flex-col items-center justify-center gap-3">
                     <div className="w-10 h-10 border-2 border-blue-400/20 border-t-blue-400 rounded-full animate-spin" />
                     <span className="text-[10px] font-black text-blue-400 tracking-widest uppercase">Rendering...</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            <div className="flex flex-col gap-2">
              <PillButton variant={scene.generated_video ? "outline" : "solid"} onClick={() => generateVideo(idx)} disabled={loading[idx] || !scene.generated_assets?.scene_image}>
                {scene.generated_video ? 'Tạo lại Clip' : 'Khởi tạo Clip'}
              </PillButton>
              
              <button 
                onClick={() => handleAuditPrompt(idx)}
                disabled={auditing[idx] || loading[idx]}
                className="flex items-center justify-center gap-1.5 text-[9px] font-black uppercase text-white/40 hover:text-emerald-400 transition-colors py-1 disabled:opacity-30"
              >
                <span className={`material-symbols-outlined text-[14px] ${auditing[idx] ? 'animate-spin' : ''}`}>
                  {auditing[idx] ? 'sync' : 'security'}
                </span>
                {auditing[idx] ? 'Checking...' : 'Check Violate Prompt'}
              </button>
            </div>

            <AnimatePresence>
              {auditResults[idx] && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  exit={{ opacity: 0, y: 10 }}
                  className="mt-2 p-3 rounded-xl bg-orange-500/10 border border-orange-500/20 flex flex-col gap-2"
                >
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-orange-400 text-[16px]">info</span>
                    <span className="text-[10px] font-black text-orange-400 uppercase">Audit Result</span>
                  </div>
                  <p className="text-[10px] text-white/70 leading-relaxed italic">"{auditResults[idx]?.reason}"</p>
                  {auditResults[idx]?.suggestion && (
                    <div className="mt-1 flex flex-col gap-2">
                       <div className="p-2 bg-black/40 rounded-lg border border-white/5">
                          <span className="text-[8px] font-black text-white/30 uppercase block mb-1">Safe Suggestion</span>
                          <p className="text-[9px] text-emerald-400 font-mono leading-tight">{auditResults[idx]?.suggestion}</p>
                       </div>
                       <PillButton variant="filled" className="h-7 text-[9px] bg-emerald-500 text-black hover:bg-emerald-400" onClick={() => applyAuditSuggestion(idx)}>Apply Fix</PillButton>
                    </div>
                  )}
                  <button onClick={() => setAuditResults(p => ({ ...p, [idx]: null }))} className="text-[8px] text-white/20 uppercase font-black hover:text-white self-center">Đóng</button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  );
};