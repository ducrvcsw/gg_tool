import React, { useState, useRef, useEffect } from 'react';
import { Flow } from 'flow-sdk';
import { AppNode, NodeType } from '../types/nodes';
import { PillButton, FieldDropdown } from './UIPrimitives';

const LLM_MODELS = [
  'Gemini 3.5 Flash',
  'Gemini 3.1 Pro',
  'Gemini 3.1 Flash-Lite',
  'Gemini 3 Deep Think',
  'Gemini 3.1 Flash Live / TTS',
  'Gemini 2.5 Pro',
  'Gemini 2.5 Flash / Lite'
];

const IMAGE_MODELS = ['🍌 Nano Banana Pro', '🍌 Nano Banana 2', 'Imagen 4'];

const VIDEO_MODELS = [
  'Omni Flash', 
  'Veo 3.1 - Lite', 
  'Veo 3.1 - Fast', 
  'Veo 3.1 - Quality'
];

const DURATIONS = ['4s', '6s', '8s', '10s'];

const AutoExpandingTextArea: React.FC<{
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  className?: string;
}> = ({ value, onChange, placeholder, className = '' }) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [value]);

  return (
    <textarea
      ref={textareaRef}
      className={`bg-white/5 border border-white/15 rounded-lg p-2.5 text-[10px] text-white/80 min-h-[70px] resize-none focus:border-white/30 leading-relaxed overflow-hidden ${className}`}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onMouseDown={(e) => e.stopPropagation()}
    />
  );
};

const OutputPreview: React.FC<{ node: AppNode }> = ({ node }) => {
  const [downloading, setDownloading] = useState(false);
  const result = node.data.result;
  if (!result || node.status !== 'done') return null;

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!result.url) return;
    setDownloading(true);
    try {
      const parts = result.url.split(',');
      const header = parts[0];
      const base64 = parts[1];
      const mimeType = header.split(';')[0].split(':')[1];
      const ext = mimeType.split('/')[1] || 'bin';

      await Flow.download({
        base64,
        mimeType,
        filename: `${node.label}_${Date.now()}.${ext}`
      });
    } catch (err) {
      console.error("Download failed", err);
    } finally {
      setDownloading(false);
    }
  };

  const renderTextSafe = (val: any) => {
    if (typeof val === 'object') return JSON.stringify(val);
    return String(val);
  };

  return (
    <div className="flex flex-col gap-2 mt-2 pt-2 border-t border-white/10 w-full">
      <div className="flex justify-between items-center px-1">
        <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">{result.title || 'Node Output'}</span>
        <div className="flex items-center gap-2">
           {(result.type === 'video' || result.type === 'image') && (
             <button 
               onClick={handleDownload}
               disabled={downloading}
               className="p-1 hover:bg-white/10 rounded text-white/60 hover:text-white transition-colors flex items-center justify-center"
               title="Tải về asset này"
             >
               <span className={`material-symbols-outlined text-[14px] ${downloading ? 'animate-spin' : ''}`}>
                 {downloading ? 'sync' : 'download'}
               </span>
             </button>
           )}
           <span className="text-[8px] text-white/40 font-bold uppercase tracking-widest">Active ✓</span>
        </div>
      </div>
      
      {result.type === 'video' ? (
        <div className="rounded-xl overflow-hidden border border-emerald-500/30 bg-black aspect-video relative group/out shadow-lg">
          <video src={result.url} className="w-full h-full object-cover" autoPlay loop muted playsInline />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/out:opacity-100 transition-opacity flex items-center justify-center">
             <span className="material-symbols-outlined text-white text-2xl">play_circle</span>
          </div>
        </div>
      ) : result.type === 'image' ? (
        <div className="rounded-xl overflow-hidden border border-emerald-500/30 bg-black aspect-square relative group/out shadow-lg">
          <img src={result.url} className="w-full h-full object-cover" alt="Output" />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/out:opacity-100 transition-opacity flex items-center justify-center">
             <span className="material-symbols-outlined text-white text-2xl">image</span>
          </div>
        </div>
      ) : result.type === 'concept' ? (
        <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20 flex flex-col gap-1.5 w-full">
           <div className="flex justify-between items-center">
              <span className="text-[11px] font-black text-white">{result.name}</span>
              <span className="text-[10px] font-black text-emerald-400">{result.score}</span>
           </div>
           <p className="text-[10px] text-white/50 italic leading-relaxed whitespace-pre-wrap">"{renderTextSafe(result.desc)}"</p>
        </div>
      ) : result.type === 'matrix' ? (
        <div className="flex flex-col gap-1 w-full">
           {result.items?.map((item: any, i: number) => (
             <div key={i} className="flex flex-col p-2 bg-white/5 border border-white/5 rounded-lg w-full">
                <span className="text-[8px] font-black text-white/30 uppercase tracking-widest">{item.label}</span>
                <span className="text-[10px] text-white/80 whitespace-pre-wrap">{renderTextSafe(item.val)}</span>
             </div>
           ))}
        </div>
      ) : (
        <div className="p-3 rounded-xl bg-white/5 border border-white/10 w-full">
          <p className="text-[11px] text-white/80 leading-relaxed italic whitespace-pre-wrap">"{renderTextSafe(result.text)}"</p>
        </div>
      )}
    </div>
  );
};

export const NodeRenderer: React.FC<{
  node: AppNode;
  isSelected: boolean;
  onSelect: () => void;
  onConnectStart: (x: number, y: number) => void;
  onConnectEnd: () => void;
  onExecute: () => void;
  onStop: () => void;
  onDelete: () => void;
  onUpdate: (data: Partial<AppNode>) => void;
  globalData: any;
}> = ({ 
  node, isSelected, onSelect, onConnectStart, onConnectEnd, 
  onExecute, onStop, onDelete, onUpdate, globalData 
}) => {
  const [isRenaming, setIsRenaming] = useState(false);
  const [tempLabel, setTempLabel] = useState(node.label);
  const [imgInputMode, setImgInputMode] = useState<'upload' | 'link'>('upload');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isRenaming) inputRef.current?.focus();
  }, [isRenaming]);

  const handleRename = () => {
    onUpdate({ label: tempLabel });
    setIsRenaming(false);
  };

  const handleImageUpload = async () => {
    try {
      const media = await Flow.media.select({ filter: 'image' });
      onUpdate({ 
        data: { 
          ...node.data, 
          mediaId: media.mediaId, 
          base64: media.base64, 
          mimeType: media.mimeType,
          url: null
        } 
      });
    } catch (e) {
      console.error("Selection cancelled or failed", e);
    }
  };

  const isInteractive = [
    'text_node', 
    'image_node', 
    'video_node', 
    'render_node', 
    'visual_prompting', 
    'ai_researcher', 
    'insight_matrix', 
    'concept_factory',
    'branch_script',
    'consistency_engine',
    'export_stitch'
  ].includes(node.type);

  const previewSrc = node.data.url || (node.data.base64 ? `data:${node.data.mimeType};base64,${node.data.base64}` : null);

  const handleMouseDown = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('.node-controls') || target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.closest('button')) {
      return;
    }
    e.stopPropagation();
    onSelect();
  };

  const getNodeIcon = (type: NodeType) => {
    switch (type) {
      case 'product_link': return 'link';
      case 'product_image': return 'image';
      case 'product_intake': return 'input';
      case 'ai_researcher': return 'manage_search';
      case 'insight_matrix': return 'psychology';
      case 'concept_factory': return 'factory';
      case 'branch_script': return 'description';
      case 'visual_prompting': return 'auto_awesome';
      case 'consistency_engine': return 'face';
      case 'render_node': return 'movie_edit';
      case 'video_node': return 'videocam';
      case 'text_node': return 'edit_note';
      case 'export_stitch': return 'package_2';
      default: return 'hub';
    }
  };

  return (
    <div 
      className={`absolute w-[300px] h-auto bg-[#1a1a1a] rounded-[24px] border-2 transition-all pointer-events-auto ${
        isSelected ? 'border-emerald-500 shadow-[0_0_40px_rgba(16,185,129,0.25)]' : 
        node.status === 'running' ? 'border-[#00f2ff] node-running shadow-[0_0_20px_rgba(0,242,255,0.2)]' : 
        node.status === 'waiting' ? 'border-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.3)]' :
        node.status === 'error' ? 'border-[#ff4444] node-error' : 
        node.status === 'done' ? 'border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.25)]' :
        'border-white/15'
      } p-5 shadow-2xl flex flex-col gap-4 select-none group min-h-[120px]`}
      style={{ left: node.position.x, top: node.position.y, zIndex: isSelected ? 50 : 10 }}
      onMouseDown={handleMouseDown}
    >
      <div className="absolute -left-2 top-[40px] -translate-y-1/2 w-4 h-4 rounded-full bg-[#1a1a1a] border-2 border-white/30 cursor-crosshair hover:scale-125 transition-transform z-20" onMouseUp={(e) => { e.stopPropagation(); onConnectEnd(); }} />
      <div className="absolute -right-2 top-[40px] -translate-y-1/2 w-4 h-4 rounded-full bg-[#1a1a1a] border-2 border-emerald-500 cursor-crosshair hover:scale-125 transition-transform z-20" onMouseDown={(e) => { e.stopPropagation(); onConnectStart(node.position.x + 300, node.position.y + 40); }} />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
            node.status === 'running' ? 'bg-[#00f2ff] text-black shadow-lg shadow-cyan-500/20' : 
            node.status === 'waiting' ? 'bg-amber-500 text-black animate-pulse' :
            node.status === 'done' ? 'bg-emerald-500 text-black' : 'bg-white/10 text-white/60'
          }`}>
            <span className="material-symbols-outlined text-[20px]">{getNodeIcon(node.type)}</span>
          </div>
          <div className="flex flex-col flex-1 min-w-0">
            {isRenaming ? (
              <input ref={inputRef} className="bg-white/15 text-[12px] font-black uppercase text-white outline-none rounded px-1" value={tempLabel} onChange={e => setTempLabel(e.target.value)} onBlur={handleRename} onKeyDown={e => e.key === 'Enter' && handleRename()} onMouseDown={e => e.stopPropagation()} />
            ) : (
              <span className="text-[12px] font-black uppercase tracking-tight truncate cursor-text hover:text-emerald-400 text-white/90" onClick={() => setIsRenaming(true)}>{node.label}</span>
            )}
            <span className="text-[9px] font-bold text-white/40 uppercase">{node.type.replace('_', ' ')}</span>
          </div>
        </div>
        <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="text-white/20 hover:text-red-400 transition-colors">
          <span className="material-symbols-outlined text-[18px]">close</span>
        </button>
      </div>

      <div className="flex-1 bg-black/40 rounded-2xl border border-white/10 p-4 flex flex-col gap-3 backdrop-blur-sm h-auto">
         {(node.type === 'product_link' || node.type === 'product_intake') && (
            <input className="w-full bg-white/5 border border-white/15 rounded-lg p-2.5 text-[10px] text-white/80 outline-none focus:border-white/30" placeholder="Paste product link (Shopee/TikTok)..." value={node.data.value || ''} onChange={e => onUpdate({ data: { ...node.data, value: e.target.value }})} onMouseDown={e => e.stopPropagation()} />
         )}

         {(node.type === 'product_image' || node.type === 'product_intake') && (
           <div className="flex flex-col gap-3">
              <div className="aspect-video w-full rounded-xl bg-black border border-white/10 overflow-hidden flex items-center justify-center relative group/img shadow-inner">
                {previewSrc ? <img src={previewSrc} className="w-full h-full object-cover" alt="Preview" /> : <span className="material-symbols-outlined text-white/20 text-4xl">add_photo_alternate</span>}
                {previewSrc && <button onClick={(e) => { e.stopPropagation(); onUpdate({ data: { ...node.data, mediaId: null, base64: null, url: null }}); }} className="absolute top-2 right-2 p-1.5 bg-black/80 rounded-lg opacity-0 group-hover/img:opacity-100 transition-opacity text-red-400"><span className="material-symbols-outlined text-[16px]">delete</span></button>}
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex bg-white/5 p-1 rounded-xl">
                  <button onClick={(e) => { e.stopPropagation(); setImgInputMode('upload'); }} className={`flex-1 text-[9px] font-bold uppercase py-1 rounded-lg transition-all ${imgInputMode === 'upload' ? 'bg-white/15 text-white' : 'text-white/40 hover:text-white/60'}`}>Upload</button>
                  <button onClick={(e) => { e.stopPropagation(); setImgInputMode('link'); }} className={`flex-1 text-[9px] font-bold uppercase py-1 rounded-lg transition-all ${imgInputMode === 'link' ? 'bg-white/15 text-white' : 'text-white/40 hover:text-white/60'}`}>URL Link</button>
                </div>
                {imgInputMode === 'upload' ? <PillButton variant="outline" className="h-8 text-[10px] font-bold" icon={<span className="material-symbols-outlined text-[14px]">upload_file</span>} onClick={handleImageUpload}>Select Gallery</PillButton> : <input className="w-full bg-white/5 border border-white/15 rounded-lg p-2.5 text-[10px] text-white/80 outline-none focus:border-white/30" placeholder="Paste image URL..." value={node.data.url || ''} onChange={e => onUpdate({ data: { ...node.data, url: e.target.value, mediaId: null, base64: null }})} onMouseDown={e => e.stopPropagation()} />}
              </div>
           </div>
         )}

         {(node.type === 'text_node' || node.type === 'branch_script' || node.type === 'ai_researcher' || node.type === 'insight_matrix' || node.type === 'concept_factory' || node.type === 'visual_prompting' || node.type === 'consistency_engine') && (
           <div className="flex flex-col gap-2">
             <FieldDropdown label="Gemini LLM Model" value={node.model || 'Gemini 3.5 Flash'} options={LLM_MODELS} onChange={m => onUpdate({ model: m })} />
             <AutoExpandingTextArea 
               placeholder="Prompt/Idea/Strategy..." 
               value={node.data.prompt || ''} 
               onChange={val => onUpdate({ data: { ...node.data, prompt: val }})} 
             />
           </div>
         )}

         {(node.type === 'image_node') && (
            <FieldDropdown label="Image Model (4K)" value={node.model || '🍌 Nano Banana Pro'} options={IMAGE_MODELS} onChange={m => onUpdate({ model: m })} />
         )}

         {(node.type === 'video_node' || node.type === 'render_node') && (
           <div className="flex flex-col gap-2">
             <FieldDropdown label="Video Model" value={node.model || 'Omni Flash'} options={VIDEO_MODELS} onChange={m => onUpdate({ model: m })} />
             <FieldDropdown label="Duration" value={node.duration || '8s'} options={DURATIONS} onChange={d => onUpdate({ duration: d })} />
           </div>
         )}

         <OutputPreview node={node} />

         <div className="flex justify-between items-center px-1 pt-1 mt-auto">
            <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest">Execution Status</span>
            <span className={`text-[9px] font-black uppercase ${
              node.status === 'running' ? 'text-[#00f2ff] animate-pulse' : 
              node.status === 'waiting' ? 'text-amber-400' : 
              node.status === 'done' ? 'text-emerald-400' : 
              node.status === 'error' ? 'text-red-400' : 
              'text-white/20'
            }`}>
              {node.status === 'waiting' ? 'waiting in queue' : node.status}
            </span>
         </div>
         
         {isInteractive && (
           <div className="node-controls flex gap-2 mt-2">
             {node.status === 'running' ? <PillButton variant="outline" className="h-[32px] border-red-500/50 text-red-400 text-[10px] font-black px-2 hover:bg-red-500/10" icon={<span className="material-symbols-outlined text-[14px]">stop</span>} onClick={(e) => { e.stopPropagation(); onStop(); }}>STOP</PillButton> : <PillButton variant="solid" className="h-[32px] text-[10px] font-black bg-emerald-500 text-black px-2 shadow-lg shadow-emerald-500/20 active:scale-95 transition-transform" icon={<span className="material-symbols-outlined text-[14px]">play_arrow</span>} onClick={(e) => { e.stopPropagation(); onExecute(); }}>START CHAIN</PillButton>}
           </div>
         )}
      </div>
    </div>
  );
};