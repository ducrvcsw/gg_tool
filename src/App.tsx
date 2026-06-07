import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Flow } from 'flow-sdk';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  SectionLabel, 
  PillButton,
  SegmentedToggle,
  FieldDropdown
} from './components/UIPrimitives';
import { WorkflowStepper } from './components/WorkflowStepper';
import { ProductDeepDive } from './components/ProductDeepDive';
import { JobHistory } from './components/JobHistory';
import { ProductIntake } from './components/ProductIntake';
import { LineFlowCanvas } from './components/LineFlowCanvas';
import { InsightMap } from './components/InsightMap';
import { LoadingState } from './components/LoadingState';
import { ConceptMatrix } from './components/ConceptMatrix';
import { ScriptConfig, ScriptOption } from './components/ScriptConfig';
import { ScriptTimeline } from './components/ScriptTimeline';
import { VoiceStudio } from './components/VoiceStudio';
import { VisualProduction } from './components/VisualProduction';
import { VideoProduction } from './components/VideoProduction';
import { FinalStitch } from './components/FinalStitch';
import { ExportPanel } from './components/ExportPanel';
import { AppNode, AppEdge, NodeType } from './types/nodes';

export type JobStatus = 'idle' | 'running' | 'done' | 'fail';
export type ProductionMode = 'with_voice' | 'no_voice';
export type ChildStrategy = 'child_voice' | 'adult_voice' | 'none';
export type AspectRatio = '9:16' | '16:9' | '1:1' | '4:3' | '3:4';
export type OperationalMode = 'standard' | 'line_flow';
export type HistoryJobStatus = 'Failed' | 'Pending' | 'Success';
export type VoiceScriptMode = 'suggested' | 'own';
export type VoiceSourceMode = 'upload' | 'auto';

export interface AppJob {
  id: string;
  type: 'image' | 'video' | 'text';
  label: string;
  status: JobStatus;
  timestamp: number;
  error?: string;
  nodeId?: string;
  sceneIndex?: number;
  target?: string;
}

export interface HistoryRecord {
  id: string;
  name: string;
  opMode: OperationalMode;
  status: HistoryJobStatus;
  timestamp: number;
  state: {
    step: number;
    maxReachedStep: number;
    productionMode: ProductionMode;
    childStrategy: ChildStrategy;
    adultVoiceGender: string;
    aspectRatio: AspectRatio;
    productMedias: any[];
    productMainUrl: string;
    productResourceUrls: string[];
    modelGender: string;
    modelAge: number;
    nodes: AppNode[];
    edges: AppEdge[];
    deepDiveData?: any;
    insightsData?: any;
    conceptsData?: any[];
    selectedConcept?: any;
    scriptData?: any;
    sceneCount?: number;
    sceneDuration?: number;
    voiceScriptMode?: VoiceScriptMode;
    voiceSourceMode?: VoiceSourceMode;
    customVoiceScript?: string;
  };
}

export default function UGCOmniEngine() {
  const [opMode, setOpMode] = useState<OperationalMode>('standard');
  const [step, setStep] = useState(0);
  const [maxReachedStep, setMaxReachedStep] = useState(0);
  const [credits, setCredits] = useState(1285.50);
  
  const [productionMode, setProductionMode] = useState<ProductionMode>('with_voice');
  const [childStrategy, setChildStrategy] = useState<ChildStrategy>('child_voice');
  const [adultVoiceGender, setAdultVoiceGender] = useState<string>('Nữ');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('9:16');
  const [sceneCount, setSceneCount] = useState<number>(6);
  const [sceneDuration, setSceneDuration] = useState<number>(8);
  
  const [modelGender, setModelGender] = useState('Nữ');
  const [modelAge, setModelAge] = useState(24);
  
  const [productMedias, setProductMedias] = useState<any[]>([]);
  const [productMainUrl, setProductMainUrl] = useState<string>('');
  const [productResourceUrls, setProductResourceUrls] = useState<string[]>([]);
  const [modelReferenceMedia, setModelReferenceMedia] = useState<any>(null);
  const [voiceMedia, setVoiceMedia] = useState<any>(null);
  
  const [nodes, setNodes] = useState<AppNode[]>([]);
  const [edges, setEdges] = useState<AppEdge[]>([]);
  const [jobs, setJobs] = useState<AppJob[]>([]); 
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [deepDiveData, setDeepDiveData] = useState<any>(null);
  const [insightsData, setInsightsData] = useState<any>(null);
  const [conceptsData, setConceptsData] = useState<any[]>([]);
  const [selectedConcept, setSelectedConcept] = useState<any>(null);
  const [scriptData, setScriptData] = useState<any>(null);
  const [scriptError, setScriptError] = useState<string | null>(null);

  const [voiceScriptMode, setVoiceScriptMode] = useState<VoiceScriptMode>('suggested');
  const [voiceSourceMode, setVoiceSourceMode] = useState<VoiceSourceMode>('upload');
  const [customVoiceScript, setCustomVoiceScript] = useState<string>('');

  const [history, setHistory] = useState<HistoryRecord[]>([]);
  
  const canvasRef = useRef<any>(null);

  useEffect(() => {
    if (opMode === 'standard') {
      setMaxReachedStep(prev => Math.max(prev, step));
    }
  }, [step, opMode]);

  useEffect(() => {
    if (opMode === 'line_flow' && nodes.length === 0) {
      initializeOmniChain();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opMode]);

  const initializeOmniChain = () => {
    const newNodes: AppNode[] = [];
    const newEdges: AppEdge[] = [];
    const startX = 0;
    const midY = 600;
    const gapX = 400;
    const branchGapY = 220;
    const branchStartY = midY - (branchGapY * 2.5);

    const urlNode: AppNode = { id: 'node-url', type: 'product_link', label: 'Product URL', position: { x: startX, y: midY - 120 }, status: 'idle', data: {} };
    const mediaNode: AppNode = { id: 'node-media', type: 'product_image', label: 'Product Media', position: { x: startX, y: midY + 120 }, status: 'idle', data: {} };
    const researcher: AppNode = { id: 'node-researcher', type: 'ai_researcher', label: 'AI Researcher', position: { x: gapX, y: midY }, status: 'idle', model: 'Gemini 3.5 Flash', data: { prompt: 'Phân tích sâu USP, Visual DNA và định hướng Creative Brief tập trung vào chuyển đổi.' } };
    const insight: AppNode = { id: 'node-insight', type: 'insight_matrix', label: 'Insight Matrix', position: { x: gapX * 2, y: midY }, status: 'idle', model: 'Gemini 3.5 Flash', data: { prompt: 'Xây dựng ma trận Insight 4 nhóm chuyên gia Marketing/Tâm lý.' } };
    
    const factory: AppNode = { 
      id: 'node-factory', 
      type: 'concept_factory', 
      label: 'Ad-Style Factory', 
      position: { x: gapX * 3, y: midY }, 
      status: 'idle', 
      model: 'Gemini 3.5 Flash', 
      data: { 
        prompt: 'Hãy tạo 6 Concepts quảng cáo UGC mang tính chuyển đổi cao. Trả về DUY NHẤT một mảng JSON: [{ "name": "...", "description": "...", "insight_rationale": "...", "suitability_score": "0-10" }].' 
      } 
    };

    newNodes.push(urlNode, mediaNode, researcher, insight, factory);
    const addEdge = (s: string, t: string) => newEdges.push({ id: `e-${s}-${t}`, source: s, target: t });
    addEdge('node-url', 'node-researcher');
    addEdge('node-media', 'node-researcher');
    addEdge('node-researcher', 'node-insight');
    addEdge('node-insight', 'node-factory');

    for (let i = 0; i < 6; i++) {
      const bY = branchStartY + i * branchGapY;
      const bX = gapX * 4.2; 
      const cNode: AppNode = { id: `c-${i}`, type: 'text_node', label: `Concept Angle ${i+1}`, position: { x: bX, y: bY }, status: 'idle', branchId: i, data: { prompt: `Chi tiết kịch bản gốc Concept ${i+1}` } };
      const sNode: AppNode = { id: `s-${i}`, type: 'branch_script', label: `Ad Script ${i+1}`, position: { x: bX + gapX, y: bY }, status: 'idle', branchId: i, data: { prompt: `Viết kịch bản ngắn gọn, súc tích (3 từ/giây), tập trung vào sản phẩm và chuyển đổi.` } };
      const vNode: AppNode = { id: `v-${i}`, type: 'image_node', label: `Visual Hub ${i+1}`, position: { x: bX + gapX * 2, y: bY }, status: 'idle', branchId: i, model: '🍌 Nano Banana Pro', data: { prompt: `Sản xuất hình ảnh 4K cho Concept ${i+1}` } };
      const rNode: AppNode = { id: `r-${i}`, type: 'render_node', label: `Final Render ${i+1}`, position: { x: bX + gapX * 3, y: bY }, status: 'idle', branchId: i, model: 'Omni Flash', data: {} };
      newNodes.push(cNode, sNode, vNode, rNode);
      addEdge('node-factory', `c-${i}`);
      addEdge(`c-${i}`, `s-${i}`);
      addEdge(`s-${i}`, `v-${i}`);
      addEdge(`v-${i}`, `r-${i}`);
    }
    setNodes(newNodes);
    setEdges(newEdges);
    setTimeout(() => { canvasRef.current?.recenter(); }, 400);
  };

  useEffect(() => {
    const id = 'ugc-omni-engine-css-v2';
    if (!document.getElementById(id)) {
      const style = document.createElement('style');
      style.id = id;
      style.textContent = `
        .dark-scrollbar::-webkit-scrollbar { width: 4px; }
        .dark-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .dark-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 10px; }
        .dark-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.25); }
        @keyframes flow-glow { 0% { stroke-dashoffset: 100; } 100% { stroke-dashoffset: 0; } }
        .wire-running { stroke-dasharray: 8; animation: flow-glow 1s linear infinite; stroke: #00f2ff !important; stroke-width: 4px !important; filter: drop-shadow(0 0 12px #00f2ff); }
        .wire-error { stroke: #ff4444 !important; stroke-width: 4px !important; filter: drop-shadow(0 0 12px #ff4444); }
        .wire-normal { stroke: rgba(16, 185, 129, 0.5) !important; stroke-width: 2px !important; filter: drop-shadow(0 0 8px rgba(16, 185, 129, 0.2)); transition: all 0.2s ease; }
        .wire-normal:hover { stroke: rgba(16, 185, 129, 0.9) !important; stroke-width: 3px !important; filter: drop-shadow(0 0 12px rgba(16, 185, 129, 0.4)); cursor: pointer; }
        html, body, #root { background: #0a0a0a; overflow: hidden; margin: 0; padding: 0; height: 100%; width: 100%; color: white; font-family: 'Google Sans Text', sans-serif; -webkit-font-smoothing: antialiased; }
        .canvas-bg { background-image: radial-gradient(rgba(255,255,255,0.02) 1px, transparent 0); background-size: 32px 32px; background-color: #0e0e0e; }
        @keyframes node-pulse { 0% { box-shadow: 0 0 0 0 rgba(0, 242, 255, 0.4); } 70% { box-shadow: 0 0 0 15px rgba(0, 242, 255, 0); } 100% { box-shadow: 0 0 0 0 rgba(0, 242, 255, 0); } }
        .node-running { animation: node-pulse 2s infinite; border-color: #00f2ff !important; }
        @keyframes dropdown-enter { from { opacity: 0; transform: scale(0.95) translateY(-5px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        .animate-dropdown { animation: dropdown-enter 0.15s ease-out forwards; }
      `;
      document.head.appendChild(style);
    }
  }, []);

  const currentSessionStatus = useMemo((): HistoryJobStatus => {
    if (opMode === 'standard') {
      const hasError = jobs.some(j => j.status === 'fail');
      if (hasError) return 'Failed';
      if (step === 9) return 'Success';
      return 'Pending';
    } else {
      const hasNodeError = nodes.some(n => n.status === 'error');
      if (hasNodeError) return 'Failed';
      const allNodesDone = nodes.length > 0 && nodes.every(n => n.status === 'done');
      if (allNodesDone) return 'Success';
      return 'Pending';
    }
  }, [opMode, step, nodes, jobs]);

  const addJob = useCallback((job: Omit<AppJob, 'timestamp' | 'status'>) => {
    const newJob: AppJob = { ...job, timestamp: Date.now(), status: 'running' };
    setJobs(prev => [newJob, ...prev].slice(0, 50)); 
    setCredits(prev => prev - 15.0); 
    return newJob.id;
  }, []);

  const updateJobStatus = useCallback((id: string, status: JobStatus, error?: string) => {
    setJobs(prev => {
      const updated = prev.map(j => j.id === id ? { ...j, status, error } : j);
      if (status === 'done') {
        const currentJob = updated.find(j => j.id === id);
        if (currentJob && currentJob.sceneIndex !== undefined) {
           return updated.filter(j => 
             j.id === id || 
             !(j.sceneIndex === currentJob.sceneIndex && j.target === currentJob.target && j.status === 'fail')
           );
        }
      }
      return updated;
    });
    if (status === 'fail') setCredits(prev => prev + 15.0);
  }, []);

  const handleBack = () => { if (step > 0) setStep(prev => prev - 1); };

  const resetProject = () => {
    if (opMode === 'line_flow') {
      setNodes([]); setEdges([]);
      setTimeout(initializeOmniChain, 100);
      return;
    }
    setStep(0); setMaxReachedStep(0); setJobs([]); setProductMedias([]); setProductMainUrl(''); setProductResourceUrls([]); setDeepDiveData(null); setInsightsData(null); setConceptsData([]); setSelectedConcept(null); setScriptData(null); setScriptError(null); setVoiceMedia(null); setModelReferenceMedia(null); setSceneCount(6); setSceneDuration(8);
    setModelGender('Nữ'); setModelAge(24); setChildStrategy('child_voice'); setAdultVoiceGender('Nữ');
    setVoiceScriptMode('suggested'); setVoiceSourceMode('upload'); setCustomVoiceScript('');
  };

  const saveSnapshot = (name?: string) => {
    if (history.length >= 10) return;
    const snapshotName = name || (opMode === 'standard' ? `Standard Job ${step}` : `Omni Chain Workflow`);
    const newRecord: HistoryRecord = {
      id: `h-${Date.now()}`,
      name: snapshotName,
      opMode,
      status: currentSessionStatus,
      timestamp: Date.now(),
      state: { step, maxReachedStep, productionMode, childStrategy, adultVoiceGender, aspectRatio, productMedias, productMainUrl, productResourceUrls, modelGender, modelAge, nodes, edges, deepDiveData, insightsData, conceptsData, selectedConcept, scriptData, sceneCount, sceneDuration, voiceScriptMode, voiceSourceMode, customVoiceScript }
    };
    setHistory(prev => [newRecord, ...prev]);
  };

  const editHistory = (record: HistoryRecord) => {
    setOpMode(record.opMode); setStep(record.state.step); setMaxReachedStep(record.state.maxReachedStep); 
    setProductionMode(record.state.productionMode); setChildStrategy(record.state.childStrategy || 'child_voice');
    setAdultVoiceGender(record.state.adultVoiceGender || 'Nữ');
    setAspectRatio(record.state.aspectRatio); setProductMedias(record.state.productMedias); setProductMainUrl(record.state.productMainUrl); setProductResourceUrls(record.state.productResourceUrls || []); setModelGender(record.state.modelGender || 'Nữ'); setModelAge(record.state.modelAge || 24); setNodes(record.state.nodes); setEdges(record.state.edges); setDeepDiveData(record.state.deepDiveData || null); setInsightsData(record.state.insightsData || null); setConceptsData(record.state.conceptsData || []); setSelectedConcept(record.state.selectedConcept || null); setScriptData(record.state.scriptData || null); setSceneCount(record.state.sceneCount || 6); setSceneDuration(record.state.sceneDuration || 8);
    setVoiceScriptMode(record.state.voiceScriptMode || 'suggested');
    setVoiceSourceMode(record.state.voiceSourceMode || 'upload');
    setCustomVoiceScript(record.state.customVoiceScript || '');
  };

  const safeJsonParse = (text: string, fallback: any = {}) => {
    if (!text) return fallback;
    try {
      const startBracket = text.indexOf('[');
      const startBrace = text.indexOf('{');
      
      let startChar = '';
      let endChar = '';
      let startIndex = -1;
      
      if (startBracket !== -1 && (startBrace === -1 || startBracket < startBrace)) {
        startChar = '['; endChar = ']'; startIndex = startBracket;
      } else if (startBrace !== -1) {
        startChar = '{'; endChar = '}'; startIndex = startBrace;
      }
      
      if (startIndex === -1) return fallback;
      
      let balance = 0;
      let foundEnd = -1;
      for (let i = startIndex; i < text.length; i++) {
        if (text[i] === startChar) balance++;
        else if (text[i] === endChar) {
          balance--;
          if (balance === 0) {
            foundEnd = i;
            break;
          }
        }
      }
      
      if (foundEnd === -1) return fallback;
      
      const jsonStr = text.substring(startIndex, foundEnd + 1)
        .replace(/\/\*[\s\S]*?\*\/|([^:]|^)\/\/.*$/gm, '') 
        .replace(/,(\s*[\]}])/g, '$1'); 
        
      return JSON.parse(jsonStr);
    } catch (e) {
      console.warn("safeJsonParse error", e);
      return fallback;
    }
  };

  const runStandardAnalysis = async () => {
    setIsAnalyzing(true); 
    
    const jobId = addJob({ id: `analysis-${Date.now()}`, type: 'text', label: 'Intelligence Pipeline' });
    
    try {
      const images = productMedias.map(m => ({ base64: m.base64, mimeType: m.mimeType }));
      const context = `Product Link: ${productMainUrl}\nResource Links: ${productResourceUrls.join(', ')}\nTarget Model: ${modelGender}, around ${modelAge} years old.`;
      
      // STEP 1: DEEP DIVE
      const { text: deepDiveText } = await Flow.generate.text(`BẠN LÀ CHUYÊN GIA PHÂN TÍCH SẢN PHẨM. Trích xuất JSON: { "name": "...", "core_value": "...", "features": ["..."], "technical_specs": "...", "visual_description": "..." } cho: ${context}.`, { images, thinkingLevel: 'high' });
      const parsedBrief = safeJsonParse(deepDiveText, { name: "Product", features: [] });
      setDeepDiveData(parsedBrief); 
      
      // STEP 2: INSIGHTS
      const { text: insightText } = await Flow.generate.text(`DỰA TRÊN BRIEF SẢN PHẨM: ${JSON.stringify(parsedBrief)}. Tạo Insight Matrix. Đối tượng model: ${modelGender}, ${modelAge} tuổi. Trả JSON: { "industry_expert": {"usp", "pain_point", "segment"}, "marketing_seo": {"keywords", "top_hooks"}, "psychology": {"motivations", "barriers"}, "media_director": {"visual_trends", "angles"} }`, { thinkingLevel: 'high' });
      const parsedInsights = safeJsonParse(insightText, {});
      setInsightsData(parsedInsights); 

      // STEP 3: CONCEPTS
      const { text: conceptsText } = await Flow.generate.text(`DỰA TRÊN BRIEF SẢN PHẨM: ${JSON.stringify(parsedBrief)} VÀ MA TRẬN INSIGHTS: ${JSON.stringify(parsedInsights)}. Hãy tạo 6 Concepts quảng cáo UGC mang tính chuyển đổi cao. Trả về DUY NHẤT một mảng JSON: [{ "name": "...", "agent_focus": "A|B|C|D", "description": "...", "insight_rationale": "...", "suitability_score": 0.0-1.0 }].`, { thinkingLevel: 'high' });
      
      const rawParsedConcepts = safeJsonParse(conceptsText, []);
      
      const extractConceptsArray = (obj: any): any[] => {
        if (Array.isArray(obj)) return obj;
        if (!obj || typeof obj !== 'object') return [];
        
        const keys = ['concepts', 'data', 'items', 'angles', 'suggestions'];
        for (const k of keys) if (Array.isArray(obj[k])) return obj[k];
        if (obj.name || obj.description) return [obj];
        const values = Object.values(obj);
        if (values.length > 0 && values.every(v => typeof v === 'object')) return values;
        return [];
      };

      const finalConcepts = extractConceptsArray(rawParsedConcepts);
      
      if (finalConcepts.length === 0) {
        throw new Error("AI không trả về danh sách Concept hợp lệ. Vui lòng thử lại.");
      }

      setConceptsData(finalConcepts); 
      updateJobStatus(jobId, 'done');
      
      setStep(1); 
      setMaxReachedStep(Math.max(maxReachedStep, 1));
    } catch (err) { 
      updateJobStatus(jobId, 'fail', err instanceof Error ? err.message : 'Analysis failed'); 
    } finally { 
      setIsAnalyzing(false); 
    }
  };

  const handleGenerateScript = async (config: ScriptOption) => {
    const jobId = addJob({ id: `script-${Date.now()}`, type: 'text', label: 'AI Scripting' });
    setIsAnalyzing(true);
    setScriptError(null);
    
    try {
      const totalSeconds = config.sceneCount * config.sceneDuration;
      let modePrompt = productionMode === 'no_voice' ? "Video ko nói, chỉ nhạc nền." : "Video có voice.";
      if (modelAge < 13 && productionMode === 'with_voice') {
        modePrompt = childStrategy === 'child_voice' ? `Voice TRẺ EM (${modelAge} tuổi).` : `Voice NGƯỜI LỚN (${adultVoiceGender}) KỂ CHUYỆN.`;
      }

      const productName = deepDiveData?.name || "Sản phẩm";
      const briefJson = JSON.stringify(deepDiveData || { name: productName });
      const insightsJson = JSON.stringify(insightsData || {});
      const conceptName = selectedConcept?.name || "Concept được chọn";

      const prompt = `Bạn là chuyên gia Script Creator. SẢN PHẨM: ${productName}. BRIEF: ${briefJson}. INSIGHTS: ${insightsJson}. CONCEPT: ${conceptName}. Viết kịch bản ${config.sceneCount} scenes, mỗi cảnh ${config.sceneDuration}s. Lời thoại ngắn gọn khớp ${totalSeconds} giây. Trả JSON script_timeline: [{ visual_action, camera_angle, voiceover_audio, on_screen_text_seo, ai_visual_generation_prompts }].`;

      if (!prompt || prompt.length < 10) {
        throw new Error("Dữ liệu cấu hình kịch bản bị lỗi. Vui lòng quay lại bước trước.");
      }

      const { text: scriptResult } = await Flow.generate.text(prompt, { thinkingLevel: 'high' });
      const parsedScript = safeJsonParse(scriptResult, null);
      
      if (!parsedScript) throw new Error("Không thể phân tách dữ liệu kịch bản.");

      let timelineData: any[] = [];
      if (Array.isArray(parsedScript)) timelineData = parsedScript;
      else if (parsedScript && typeof parsedScript === 'object') {
        const keys = ['script_timeline', 'timeline', 'scenes', 'data'];
        for (const k of keys) if (Array.isArray(parsedScript[k])) { timelineData = parsedScript[k]; break; }
      }

      if (timelineData.length === 0) throw new Error("Kịch bản rỗng.");
      
      setScriptData({ script_timeline: timelineData }); 
      updateJobStatus(jobId, 'done');
      
      setStep(5); 
      setMaxReachedStep(Math.max(maxReachedStep, 5));
      setSceneCount(config.sceneCount); 
      setSceneDuration(config.sceneDuration);
    } catch (err) { 
      const msg = err instanceof Error ? err.message : "Lỗi kịch bản";
      setScriptError(msg);
      updateJobStatus(jobId, 'fail', msg); 
      setStep(5); 
    } finally { 
      setIsAnalyzing(false); 
    }
  };

  const addNode = (type: NodeType, label: string) => { canvasRef.current?.addNodeAtCenter(type, label); };

  const renderStandardStep = () => {
    switch (step) {
      case 1: return <ProductDeepDive brief={deepDiveData} onNext={() => setStep(2)} />;
      case 2: return <InsightMap data={insightsData} onNext={() => setStep(3)} />;
      case 3: return <ConceptMatrix concepts={conceptsData} onSelect={(c) => { setSelectedConcept(c); setStep(4); }} onRetry={runStandardAnalysis} isAnalyzing={isAnalyzing} />;
      case 4: return <ScriptConfig onSelect={handleGenerateScript} />;
      case 5: return <ScriptTimeline script={scriptData} concept={selectedConcept} error={scriptError} onRetry={() => handleGenerateScript({ sceneCount, sceneDuration, type: 1 })} onNext={() => setStep(productionMode === 'no_voice' ? 7 : 6)} />;
      case 6: return <VoiceStudio script={scriptData?.script_timeline?.map((s: any) => s.voiceover_audio).join(' ') || ''} audioMedia={voiceMedia} onUpload={async () => setVoiceMedia(await Flow.media.select({ filter: 'audio' }))} onNext={() => setStep(7)} voiceScriptMode={voiceScriptMode} onModeChange={setVoiceScriptMode} voiceSourceMode={voiceSourceMode} onVoiceSourceModeChange={setVoiceSourceMode} customVoiceScript={customVoiceScript} onCustomScriptChange={setCustomVoiceScript} conceptName={selectedConcept?.name} modelGender={modelGender} modelAge={modelAge} childStrategy={childStrategy} adultVoiceGender={adultVoiceGender} sceneCount={sceneCount} sceneDuration={sceneDuration} onUpdateSuggestedScript={(newScript) => { if (!scriptData) return; setScriptData({ ...scriptData, script_timeline: (scriptData.script_timeline || []).map((s: any, i: number) => i === 0 ? { ...s, voiceover_audio: newScript } : { ...s, voiceover_audio: '' }) }); }} />;
      case 7: return <VisualProduction data={scriptData} productMedias={productMedias} modelReferenceMedia={modelReferenceMedia} productDescription={deepDiveData?.visual_description} onModelUpload={async () => setModelReferenceMedia(await Flow.media.select({ filter: 'image' }))} aspectRatio={aspectRatio} modelGender={modelGender} modelAge={modelAge} onUpdateData={setScriptData} onNext={() => setStep(8)} addJob={addJob} updateJob={updateJobStatus} />;
      case 8: return <VideoProduction data={scriptData} productionMode={productionMode} voiceSourceMode={voiceSourceMode} childStrategy={childStrategy} adultVoiceGender={adultVoiceGender} modelGender={modelGender} modelAge={modelAge} audioReferenceMedia={voiceMedia} aspectRatio={aspectRatio} sceneDuration={sceneDuration} onUpdateData={setScriptData} onBack={() => setStep(7)} onNext={() => setStep(9)} addJob={addJob} updateJob={updateJobStatus} />;
      case 9: return <FinalStitch data={{ ...scriptData, concept: selectedConcept, ad_campaign_brief: deepDiveData }} onBack={() => setStep(8)} />;
      default: return null;
    }
  };

  return (
    <div className="flex h-screen w-screen bg-[#0a0a0a] text-white overflow-hidden relative">
      <div className="w-[300px] border-r border-white/10 flex flex-col bg-[#0a0a0a] z-50 shrink-0">
        <div className="p-5 border-b border-white/5 flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center shadow-lg"><span className="material-symbols-outlined text-black font-black text-[20px]">hub</span></div>
              <h1 className="text-[13px] font-black uppercase tracking-tighter text-white">Omni Engine v2.1</h1>
            </div>
            <div className="flex bg-white/5 p-1 rounded-xl border border-white/5 shadow-inner">
               <button onClick={() => { setOpMode('standard'); setStep(0); }} className={`w-9 h-8 flex items-center justify-center rounded-lg transition-all ${opMode === 'standard' ? 'bg-white/10' : 'opacity-40'}`}><span className="material-symbols-outlined text-[18px]">splitscreen</span></button>
               <button onClick={() => setOpMode('line_flow')} className={`w-9 h-8 flex items-center justify-center rounded-lg transition-all ${opMode === 'line_flow' ? 'bg-white/10' : 'opacity-40'}`}><span className="material-symbols-outlined text-[18px]">account_tree</span></button>
            </div>
          </div>
          <div className="bg-[#111] rounded-2xl p-4 border border-white/5 flex flex-col gap-1 shadow-xl">
             <div className="flex justify-between items-center mb-0.5">
                <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[2px]">Pro Plus</span>
                <div className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${currentSessionStatus === 'Success' ? 'bg-emerald-500/20 text-emerald-400' : currentSessionStatus === 'Failed' ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'}`}>
                    {currentSessionStatus}
                </div>
             </div>
             <span className="text-3xl font-black tabular-nums tracking-tighter text-white">${credits.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="flex flex-col gap-3">
            <SectionLabel>Global Strategy</SectionLabel>
            <div className="flex flex-col gap-2">
              <div className="grid grid-cols-2 gap-2">
                <PillButton variant="outline" className="h-9" onClick={() => setProductionMode(prev => prev === 'with_voice' ? 'no_voice' : 'with_voice')}>{productionMode === 'with_voice' ? 'With Voice' : 'No Voice'}</PillButton>
                <PillButton variant="outline" className="h-9" onClick={() => saveSnapshot()} icon={<span className="material-symbols-outlined text-[16px]">save</span>}>Snapshot</PillButton>
              </div>
              <div className="flex flex-col gap-1.5">
                <div className="flex gap-1">
                  <FieldDropdown label="Production Ratio" value={aspectRatio} options={['9:16', '16:9', '1:1', '4:3', '3:4']} onChange={(v) => setAspectRatio(v as AspectRatio)} className="flex-1" />
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto dark-scrollbar p-5 flex flex-col gap-8">
           {opMode === 'standard' ? (
             <>
               <div className="flex flex-col gap-4">
                 <SectionLabel>Workflow Track</SectionLabel>
                 <WorkflowStepper currentStep={step} maxReachedStep={maxReachedStep} onStepClick={setStep} productionMode={productionMode} />
               </div>
               <div className="pt-6 border-t border-white/5">
                 <div className="flex justify-between items-center mb-4"><SectionLabel>Session History</SectionLabel><span className="text-[10px] text-white/30 font-bold">{history.length}/10</span></div>
                 <JobHistory history={history} onEdit={editHistory} onDelete={(id) => setHistory(h => h.filter(x => x.id !== id))} />
               </div>
             </>
           ) : (
             <div className="flex flex-col gap-6">
               <SectionLabel>Omni Node Library</SectionLabel>
               <div className="flex flex-col gap-6">
                 <div className="flex flex-col gap-2.5">
                    <span className="text-[9px] font-black text-emerald-500/60 uppercase tracking-[2px] ml-2">NHÓM INPUT</span>
                    <div className="grid grid-cols-1 gap-2">
                      <NodeLibButton onClick={() => addNode('product_link', 'product_link')} icon="link">product_link</NodeLibButton>
                      <NodeLibButton onClick={() => addNode('product_image', 'product_image')} icon="image">product_image</NodeLibButton>
                    </div>
                 </div>
                 <div className="flex flex-col gap-2.5">
                    <span className="text-[9px] font-black text-blue-400/60 uppercase tracking-[2px] ml-2">NHÓM RESEARCH</span>
                    <div className="grid grid-cols-1 gap-2">
                      <NodeLibButton onClick={() => addNode('ai_researcher', 'ai_researcher')} icon="manage_search">ai_researcher</NodeLibButton>
                      <NodeLibButton onClick={() => addNode('insight_matrix', 'insight_matrix')} icon="psychology">insight_matrix</NodeLibButton>
                      <NodeLibButton onClick={() => addNode('concept_factory', 'concept_factory')} icon="factory">concept_factory</NodeLibButton>
                    </div>
                 </div>
                 <div className="flex flex-col gap-2.5">
                    <span className="text-[9px] font-black text-orange-400/60 uppercase tracking-[2px] ml-2">NHÓM PRODUCTION</span>
                    <div className="grid grid-cols-1 gap-2">
                      <NodeLibButton onClick={() => addNode('image_node', 'image_node')} icon="photo_library">image_node</NodeLibButton>
                      <NodeLibButton onClick={() => addNode('video_node', 'video_node')} icon="videocam">video_node</NodeLibButton>
                    </div>
                 </div>
               </div>
               <div className="pt-6 border-t border-white/5"><JobHistory history={history} onEdit={editHistory} onDelete={(id) => setHistory(h => h.filter(x => x.id !== id))} /></div>
             </div>
           )}
        </div>
      </div>
      <div className="flex-1 relative bg-[#0e0e0e] flex">
        <div className="flex-1 relative flex flex-col overflow-hidden">
          {step > 0 && !isAnalyzing && (
            <motion.button onClick={handleBack} className="absolute top-6 left-6 z-[60] w-10 h-10 rounded-full bg-black/50 border border-white/10 flex items-center justify-center group shadow-2xl backdrop-blur-xl"><span className="material-symbols-outlined text-[20px] text-white/60 group-hover:text-white">arrow_back</span></motion.button>
          )}
          {!isAnalyzing && (
            <motion.button onClick={resetProject} className="absolute top-6 right-6 z-[60] px-4 h-10 rounded-full bg-black/50 border border-white/10 flex items-center justify-center gap-2 group shadow-2xl backdrop-blur-xl hover:bg-red-500/10"><span className="material-symbols-outlined text-[18px] text-white/40 group-hover:text-red-400">restart_alt</span><span className="text-[10px] font-black uppercase tracking-widest text-white/40 group-hover:text-red-400">Clean Engine</span></motion.button>
          )}
          <div className="flex-1 overflow-hidden relative">
            <AnimatePresence mode="wait">
              {opMode === 'line_flow' ? (
                <motion.div key="canvas" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full h-full">
                  <LineFlowCanvas ref={canvasRef} nodes={nodes} setNodes={setNodes} edges={edges} setEdges={setEdges} globalData={{ productMainUrl, productResourceUrls, aspectRatio, productionMode, modelGender, modelAge }} addJob={addJob} updateJob={updateJobStatus} />
                </motion.div>
              ) : isAnalyzing ? (
                <LoadingState key="loading" />
              ) : step === 0 ? (
                <motion.div key="intro" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="h-full flex flex-col items-center justify-start max-w-5xl mx-auto gap-12 text-center p-8 pt-24 overflow-y-auto w-full dark-scrollbar">
                   <div className="flex flex-col gap-2">
                     <span className="text-emerald-500 font-black uppercase tracking-[8px] text-[12px]">High-Performance UGC</span>
                     <h2 className="text-7xl font-black uppercase tracking-tighter mb-4 text-white">Omni Engine v2.1</h2>
                   </div>
                   
                   <ProductIntake 
                     medias={productMedias} 
                     onMediasChange={setProductMedias} 
                     mainUrl={productMainUrl} 
                     onMainUrlChange={setProductMainUrl} 
                     urls={productResourceUrls} 
                     onUrlsChange={setProductResourceUrls}
                     gender={modelGender}
                     onGenderChange={setModelGender}
                     age={modelAge}
                     onAgeChange={setModelAge}
                     productionMode={productionMode}
                     childStrategy={childStrategy}
                     onChildStrategyChange={setChildStrategy}
                     adultVoiceGender={adultVoiceGender}
                     onAdultVoiceGenderChange={setAdultVoiceGender}
                   />
                   
                   <div className="pt-2 pb-12">
                     <PillButton variant="solid" className="h-10 text-sm font-black w-64 shadow-2xl hover:scale-105 active:scale-95 transition-all" onClick={runStandardAnalysis} disabled={productMedias.length === 0 || isAnalyzing}>Bắt đầu Production</PillButton>
                   </div>
                </motion.div>
              ) : (
                <motion.div key="steps" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full flex flex-col p-8 pt-20 overflow-y-auto w-full dark-scrollbar">{renderStandardStep()}</motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
        {opMode === 'standard' && step === 9 && (
          <ExportPanel data={{ ...scriptData, concept: selectedConcept, ad_campaign_brief: deepDiveData }} />
        )}
      </div>
    </div>
  );
}

const NodeLibButton: React.FC<{ icon: string; children: React.ReactNode; onClick: () => void }> = ({ icon, children, onClick }) => (
  <button onClick={onClick} className="group w-full flex items-center gap-3 p-2 rounded-xl bg-white/5 border border-white/5 hover:border-white/30 hover:bg-white/10 transition-all text-left">
    <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-white/20 transition-all"><span className="material-symbols-outlined text-[16px]">{icon}</span></div>
    <span className="text-[10px] font-black uppercase tracking-tight text-white/70 group-hover:text-white truncate">{children}</span>
  </button>
);