import React, { useState, useRef, useEffect, useImperativeHandle, forwardRef, useCallback } from 'react';
import { Flow } from 'flow-sdk';
import { AppNode, AppEdge, NodeType, NODE_CAPABILITIES } from '../types/nodes';
import { NodeRenderer } from './NodeRenderer';

interface LineFlowCanvasProps {
  nodes: AppNode[];
  setNodes: React.Dispatch<React.SetStateAction<AppNode[]>>;
  edges: AppEdge[];
  setEdges: React.Dispatch<React.SetStateAction<AppEdge[]>>;
  globalData: any;
  addJob: (job: any) => string;
  updateJob: (id: string, status: any, error?: string) => void;
}

const DEFAULT_PROMPTS: Record<string, string> = {
  ai_researcher: 'Phân tích sâu USP, Visual DNA và định hướng Creative Brief tập trung vào chuyển đổi cho sản phẩm này.',
  insight_matrix: 'Xây dựng ma trận Insight 4 nhóm chuyên gia Marketing/Tâm lý dựa trên dữ liệu sản phẩm. Trả về DUY NHẤT JSON: { "industry_expert": {"usp": "...", "pain_point": "..."}, "marketing_seo": {"keywords": "...", "hooks": "..."}, "psychology": {"motivations": "...", "barriers": "..."}, "media_director": {"trends": "...", "angles": "..."} }',
  concept_factory: 'Hãy tạo 6 Concepts quảng cáo UGC mang tính chuyển đổi cao. YÊU CẦU BỐI CẢNH: mỗi concept đặt trong MỘT bối cảnh đời thường thuần Việt KHÁC NHAU (không trùng lặp) như đường phố/vỉa hè, chợ truyền thống, trung tâm thương mại, quán cà phê, quán ăn vỉa hè, công viên, phòng bếp/phòng khách gia đình, văn phòng, trường học, phố cổ, homestay; lồng ghép con người và nhịp sống Việt Nam, TRÁNH phông nền studio chung chung. Trường "description" PHẢI nêu rõ bối cảnh Việt Nam cụ thể. Trả về DUY NHẤT một mảng JSON: [{ "name": "...", "description": "...", "insight_rationale": "...", "suitability_score": "0-10" }].',
  branch_script: 'Viết kịch bản ngắn gọn, súc tích (3 từ/giây), tập trung vào sản phẩm và chuyển đổi.',
  visual_prompting: 'Mô tả chi tiết bối cảnh 4K cho cảnh quay này.',
  image_node: 'Sản xuất hình ảnh quảng cáo 4K chuyên nghiệp.',
  video_node: 'Tạo clip quảng cáo UGC chất lượng cao với Lip-sync chính xác.'
};

export const LineFlowCanvas = forwardRef<any, LineFlowCanvasProps>(({ nodes, setNodes, edges, setEdges, globalData, addJob, updateJob }, ref) => {
  const [zoom, setZoom] = useState(0.85);
  const [offset, setOffset] = useState({ x: 50, y: 50 });
  const [isPanning, setIsPanning] = useState(false);
  const [isDraggingNode, setIsDraggingNode] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [dragEdge, setDragEdge] = useState<{ sourceId: string; startPos: { x: number; y: number }; currentPos: { x: number; y: number } } | null>(null);

  const canvasRef = useRef<HTMLDivElement>(null);
  
  const nodesRef = useRef(nodes);
  const edgesRef = useRef(edges);

  useEffect(() => { nodesRef.current = nodes; }, [nodes]);
  useEffect(() => { edgesRef.current = edges; }, [edges]);

  /**
   * Nâng cấp hàm bóc tách JSON siêu bền bỉ (Robust JSON Extraction)
   * Giúp khắc phục triệt để lỗi khi AI phản hồi không đúng định dạng "DUY NHẤT JSON"
   */
  const safeJsonParse = (text: string, fallback: any = {}) => {
    if (!text) return fallback;
    try {
      // 1. Loại bỏ các block markdown code nếu có
      let jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
      
      // 2. Tìm điểm bắt đầu và kết thúc của cấu trúc JSON (mảng hoặc object)
      const firstBracket = jsonStr.indexOf('[');
      const firstBrace = jsonStr.indexOf('{');
      
      let startIndex = -1;
      let endIndex = -1;
      let startChar = '';
      let endChar = '';

      if (firstBracket !== -1 && (firstBrace === -1 || firstBracket < firstBrace)) {
        startChar = '['; endChar = ']'; startIndex = firstBracket;
      } else if (firstBrace !== -1) {
        startChar = '{'; endChar = '}'; startIndex = firstBrace;
      }

      if (startIndex === -1) return fallback;

      // 3. Sử dụng cân bằng ngoặc để tìm đúng điểm kết thúc, tránh bị nhiễu bởi văn bản sau JSON
      let balance = 0;
      for (let i = startIndex; i < jsonStr.length; i++) {
        if (jsonStr[i] === startChar) balance++;
        else if (jsonStr[i] === endChar) {
          balance--;
          if (balance === 0) {
            endIndex = i;
            break;
          }
        }
      }

      if (endIndex === -1) {
        // Fallback: Tìm ngoặc cuối cùng nếu balance không khớp
        endIndex = jsonStr.lastIndexOf(endChar);
      }
      
      if (endIndex <= startIndex) return fallback;

      const finalJson = jsonStr.substring(startIndex, endIndex + 1)
        .replace(/\/\*[\s\S]*?\*\/|([^:]|^)\/\/.*$/gm, '') // Xóa comment
        .replace(/,(\s*[\]}])/g, '$1'); // Xóa dấu phẩy thừa cuối mảng/object
        
      return JSON.parse(finalJson);
    } catch (e) {
      console.warn("safeJsonParse error", e);
      return fallback;
    }
  };

  const recenter = useCallback(() => {
    if (!canvasRef.current) return;
    const currentNodes = nodesRef.current;
    if (currentNodes.length === 0) { setOffset({ x: 50, y: 50 }); setZoom(0.85); return; }
    const rect = canvasRef.current.getBoundingClientRect();
    const minX = Math.min(...currentNodes.map(n => n.position.x));
    const maxX = Math.max(...currentNodes.map(n => n.position.x + 300));
    const minY = Math.min(...currentNodes.map(n => n.position.y));
    const maxY = Math.max(...currentNodes.map(n => n.position.y + 150));
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    const targetZoom = 0.75;
    setZoom(targetZoom);
    setOffset({ x: (rect.width / 2) - (centerX * targetZoom), y: (rect.height / 2) - (centerY * targetZoom) });
  }, []);

  useImperativeHandle(ref, () => ({
    recenter,
    addNodeAtCenter: (type: NodeType, label: string) => {
      if (!canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      const centerX = (rect.width / 2 - offset.x) / zoom - 150;
      const centerY = (rect.height / 2 - offset.y) / zoom - 60;
      const newNode: AppNode = { 
        id: `n-${Date.now()}`, 
        type, 
        label, 
        position: { x: centerX, y: centerY }, 
        status: 'idle', 
        data: { prompt: DEFAULT_PROMPTS[type] || '' } 
      };
      setNodes(prev => [...prev, newNode]);
      setSelectedNodeId(newNode.id);
    }
  }));

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
      'hot': 'premium and vibrant',
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

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0 && (e.target as HTMLElement).classList.contains('canvas-bg')) {
      setIsPanning(true);
      setSelectedNodeId(null);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setOffset(prev => ({ x: prev.x + e.movementX, y: prev.y + e.movementY }));
    } else if (isDraggingNode && selectedNodeId) {
      setNodes(prev => prev.map(n => 
        n.id === selectedNodeId 
          ? { ...n, position: { x: n.position.x + e.movementX / zoom, y: n.position.y + e.movementY / zoom } } 
          : n
      ));
    }

    if (dragEdge) {
      setDragEdge(prev => prev ? { ...prev, currentPos: { x: (e.clientX - offset.x) / zoom, y: (e.clientY - offset.y) / zoom } } : null);
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    setIsDraggingNode(false);
    setDragEdge(null);
  };

  const startConnection = (nodeId: string, x: number, y: number) => {
    setDragEdge({ sourceId: nodeId, startPos: { x, y }, currentPos: { x, y } });
  };

  const completeConnection = (targetId: string) => {
    if (dragEdge && dragEdge.sourceId !== targetId) {
      const exists = edges.some(e => e.source === dragEdge.sourceId && e.target === targetId);
      if (!exists) setEdges(prev => [...prev, { id: `e-${Date.now()}`, source: dragEdge.sourceId, target: targetId }]);
    }
    setDragEdge(null);
  };

  const getUpstreamNodes = (targetId: string, currentNodes: AppNode[], currentEdges: AppEdge[], visited: Set<string> = new Set()): AppNode[] => {
    const directParentEdges = currentEdges.filter(e => e.target === targetId);
    let result: AppNode[] = [];
    
    directParentEdges.forEach(edge => {
      if (!visited.has(edge.source)) {
        visited.add(edge.source);
        const sourceNode = currentNodes.find(n => n.id === edge.source);
        if (sourceNode) {
          const ancestors = getUpstreamNodes(edge.source, currentNodes, currentEdges, visited);
          result = [...result, ...ancestors, sourceNode];
        }
      }
    });
    
    return result.filter((node, index, self) => 
      index === self.findLastIndex((n) => n.id === node.id)
    );
  };

  const validateNodeData = (node: AppNode, currentNodes: AppNode[], currentEdges: AppEdge[], executingChain: AppNode[] = []): { isValid: boolean; error?: string } => {
    if (node.type === 'product_link' && (!node.data.value || node.data.value.trim() === '')) {
      if (globalData.productMainUrl) return { isValid: true };
      return { isValid: false, error: 'Thiếu URL sản phẩm' };
    }
    if (node.type === 'product_image' && !node.data.base64 && !node.data.url) {
      if (globalData.productMedias?.length > 0) return { isValid: true };
      return { isValid: false, error: 'Thiếu ảnh sản phẩm' };
    }
    
    const requirements = NODE_CAPABILITIES[node.type]?.inputs || [];
    if (requirements.length > 0) {
      const upstreamNodes = getUpstreamNodes(node.id, currentNodes, currentEdges);
      const providedOutputs = new Set<string>();
      
      upstreamNodes.forEach(n => {
        const actualNode = currentNodes.find(an => an.id === n.id);
        const isWillBeDone = executingChain.some(en => en.id === n.id);
        
        if (actualNode && (actualNode.status === 'done' || isWillBeDone || actualNode.type.includes('product_'))) {
          const caps = NODE_CAPABILITIES[actualNode.type];
          if (caps) caps.outputs.forEach(out => providedOutputs.add(out));
        }
      });
      
      const missing = requirements.filter(req => !providedOutputs.has(req));
      if (missing.length > 0) {
        return { isValid: false, error: `Thiếu đầu vào: ${missing.join(', ')}` };
      }
    }
    
    return { isValid: true };
  };

  const executeEngine = async (renderNodeId: string) => {
    const currentNodesSnapshot = [...nodesRef.current];
    const currentEdgesSnapshot = [...edgesRef.current];

    const upstream = getUpstreamNodes(renderNodeId, currentNodesSnapshot, currentEdgesSnapshot);
    const targetNode = currentNodesSnapshot.find(n => n.id === renderNodeId);
    if (!targetNode) return;
    
    const fullChain = [...upstream, targetNode].filter(Boolean);
    
    setNodes(prev => prev.map(n => 
      fullChain.some(cn => cn.id === n.id) && n.status !== 'done' ? { ...n, status: 'waiting' } : n
    ));
    
    const sessionResults: Record<string, any> = {};
    let processingNodeId = '';

    try {
      for (const nodeRef of fullChain) {
        const checkNode = nodesRef.current.find(n => n.id === nodeRef.id);
        // Nếu node đã xong thì bỏ qua và lấy kết quả cũ vào context
        if (checkNode?.status === 'done' && checkNode.data.result) {
           sessionResults[nodeRef.id] = checkNode.data.result;
           continue;
        }

        processingNodeId = nodeRef.id;
        
        setNodes(prev => prev.map(n => n.id === nodeRef.id ? { ...n, status: 'running' } : n));
        setEdges(prev => prev.map(e => (e.target === nodeRef.id || e.source === nodeRef.id) ? { ...e, isRunning: true } : e));

        const validationResult = validateNodeData(nodeRef, nodesRef.current, edgesRef.current, fullChain);
        if (!validationResult.isValid) {
           setNodes(prev => prev.map(n => n.id === nodeRef.id ? { ...n, status: 'waiting' } : n));
           throw new Error(validationResult.error);
        }

        const currentUpstream = getUpstreamNodes(nodeRef.id, nodesRef.current, edgesRef.current);
        const promptContext = currentUpstream
          .map(u => {
            const actualNode = nodesRef.current.find(an => an.id === u.id);
            if (!actualNode) return '';
            const res = sessionResults[u.id] || actualNode.data.result;
            
            if (actualNode.type === 'product_link') return `[Product Link]: ${actualNode.data.value || globalData.productMainUrl}`;
            if (res) {
              if (res.text) return `[${actualNode.label}] Context: ${res.text}`;
              if (res.visual_description) return `[Visual DNA]: ${res.visual_description}`;
              if (res.type === 'matrix') {
                return `[${actualNode.label} Data]:\n${res.items.map((i: any) => `- ${i.label}: ${i.val}`).join('\n')}`;
              }
              return `[${actualNode.label} Data]: ${JSON.stringify(res)}`;
            }
            return '';
          })
          .filter(s => s)
          .join('\n\n');

        let images = currentUpstream
          .map(u => nodesRef.current.find(an => an.id === u.id))
          .filter(u => u && (u.type === 'product_image' || u.type === 'product_intake') && u.data.base64)
          .map(u => ({ base64: u!.data.base64!, mimeType: u!.data.mimeType || 'image/png' }));

        if (images.length === 0 && globalData.productMedias?.length > 0) {
          images = globalData.productMedias.map((m: any) => ({ base64: m.base64, mimeType: m.mimeType }));
        }

        let nodeResult: any = null;
        const isTextTask = [
          'ai_researcher', 'insight_matrix', 'concept_factory', 
          'branch_script', 'text_node', 'visual_prompting', 'consistency_engine'
        ].includes(nodeRef.type);

        if (isTextTask) {
          const modePrompt = globalData.productionMode === 'no_voice' ? "Lưu ý: Video KHÔNG VOICE, tập trung vào hành động." : "Lưu ý: Video CÓ VOICE (Voice-over sync).";
          const taskInstruction = nodeRef.data.prompt || DEFAULT_PROMPTS[nodeRef.type] || '';
          
          const finalPrompt = `BẠN LÀ CHUYÊN GIA SẢN XUẤT NỘI DUNG MARKETING (MASTER CONTENT CREATOR).
          NHIỆM VỤ CỤ THỂ: ${taskInstruction}
          
          DỮ LIỆU ĐẦU VÀO TỪ CÁC NODE TRƯỚC (CONTEXT):
          ${promptContext}
          
          CHIẾN LƯỢC SẢN XUẤT: ${modePrompt}
          
          YÊU CẦU ĐẦU RA:
          - Trả về DUY NHẤT kết quả yêu cầu.
          - Nếu yêu cầu JSON, chỉ trả về code block JSON sạch sẽ, không kèm lời dẫn giải.
          - Đảm bảo tính nhất quán với dữ liệu từ các node upstream.`;

          const { text } = await Flow.generate.text({ prompt: finalPrompt, thinkingLevel: 'high', images: images.slice(0, 5) });
          
          if (!text || text.trim() === '') throw new Error("AI không trả về kết quả hoặc phản hồi rỗng.");

          if (nodeRef.type === 'insight_matrix') {
            const parsed = safeJsonParse(text, null);
            if (parsed && typeof parsed === 'object') {
              const items: any[] = [];
              const flatten = (obj: any, prefix = '') => {
                Object.entries(obj).forEach(([key, val]) => {
                  const label = prefix ? `${prefix}: ${key}` : key;
                  if (val && typeof val === 'object' && !Array.isArray(val)) {
                    flatten(val, label.replace(/_/g, ' '));
                  } else {
                    items.push({ 
                      label: label.replace(/_/g, ' ').toUpperCase(), 
                      val: Array.isArray(val) ? val.join(', ') : String(val) 
                    });
                  }
                });
              };
              flatten(parsed);
              nodeResult = { type: 'matrix', title: 'Expert Insight Matrix', items: items.slice(0, 12) };
            } else {
              const lines = text.split('\n').map(l => l.replace(/^[0-9*.-]\s*/, '').trim()).filter(l => l.length > 5);
              nodeResult = { type: 'matrix', title: 'Expert Insight Matrix', items: lines.slice(0, 8).map((l, i) => ({ label: `INSIGHT ${i+1}`, val: l })) };
            }
          } 
          else if (nodeRef.type === 'concept_factory') {
            const parsed = safeJsonParse(text, null);
            // Logic "Unwrap" mảng concepts từ object nếu AI bọc nó
            let conceptArray = Array.isArray(parsed) ? parsed : null;
            if (!conceptArray && parsed && typeof parsed === 'object') {
              const arrayKeys = ['concepts', 'data', 'items', 'angles', 'suggestions', 'list'];
              for (const k of arrayKeys) {
                if (Array.isArray(parsed[k])) {
                  conceptArray = parsed[k];
                  break;
                }
              }
            }

            if (conceptArray && conceptArray.length > 0) {
              const items = conceptArray.map((c: any, i: number) => ({
                label: c.name || `CONCEPT ANGLE ${i+1}`,
                val: `${c.description || ''} ${c.insight_rationale ? `\n(Insight: ${c.insight_rationale})` : ''} \nScore: ${c.suitability_score || '9.0'}/10`
              }));
              nodeResult = { type: 'matrix', title: 'Ad-Style Concept Matrix', items: items };
            } else {
              // Fallback nếu không phải JSON array hoặc unwrap thất bại
              nodeResult = { type: 'text', title: 'Creative Concepts Output', text: text };
            }
          } else {
            nodeResult = { type: 'text', title: nodeRef.label, text: text };
          }
        } 
        else if (nodeRef.type === 'image_node') {
          // Gộp mediaId từ upstream product_image nodes và globalData.productMedias
          const productMediaIds = [
            ...currentUpstream
              .filter(u => u.type === 'product_image')
              .map(u => u.data.mediaId),
            ...(globalData.productMedias || []).map((m: any) => m.mediaId)
          ].filter(Boolean).slice(0, 10);

          const gen = await Flow.generate.image({
            prompt: `UGC Commercial Photography Production. Context Details: ${promptContext}. Execution: ${nodeRef.data.prompt || DEFAULT_PROMPTS.image_node}`,
            referenceImageMediaIds: productMediaIds,
            modelDisplayName: nodeRef.model || '🍌 Nano Banana Pro',
            aspectRatio: globalData.aspectRatio || '9:16'
          });

          // Upload để lấy mediaId phục vụ chaining (video gen)
          const up = await Flow.upload({
            base64: gen.base64,
            mimeType: gen.mimeType,
            name: `scene_${nodeRef.id}`
          });

          nodeResult = {
            type: 'image',
            title: '4K Scene Asset',
            url: `data:${gen.mimeType};base64,${gen.base64}`,
            mediaId: up.mediaId
          };
        }
        else if (nodeRef.type === 'video_node' || nodeRef.type === 'render_node') {
          const selectedModel = nodeRef.model || 'Omni Flash';
          const baseVPrompt = `${promptContext}. Script/Action: ${nodeRef.data.prompt || DEFAULT_PROMPTS.video_node}`;
          const options: any = {
            modelDisplayName: selectedModel,
            aspectRatio: (globalData.aspectRatio === '16:9' || globalData.aspectRatio === '4:3') ? '16:9' : '9:16',
            durationSeconds: selectedModel.includes('Omni') ? parseInt(nodeRef.duration || '8') : 8
          };
          options.prompt = selectedModel.includes('Omni') ? `High-end cinematic advertising presentation: ${sanitizePromptForOmni(baseVPrompt)}` : baseVPrompt;
          
          // Lấy mediaId ảnh thượng nguồn gần nhất (I2V/R2V)
          const lastImageNode = [...currentUpstream].reverse().find((u: AppNode) => {
            const actual = nodesRef.current.find((an: AppNode) => an.id === u.id);
            return actual?.data.result?.type === 'image' && actual?.data.result?.mediaId;
          });

          if (lastImageNode) {
            const actualImgNode = nodesRef.current.find(an => an.id === lastImageNode.id);
            const imgMediaId = actualImgNode?.data.result?.mediaId;

            if (selectedModel.includes('Omni')) {
              options.referenceImageMediaIds = [imgMediaId];
            } else {
              options.firstFrameImageMediaId = imgMediaId;
            }
          }

          const gen = await Flow.generate.video(options);
          nodeResult = { type: 'video', title: 'AI Production Clip', url: `data:${gen.mimeType};base64,${gen.base64}` };
        }

        sessionResults[nodeRef.id] = nodeResult;

        setNodes(prev => prev.map(an => 
          an.id === nodeRef.id ? { ...an, status: 'done', data: { ...an.data, result: nodeResult } } : an
        ));
        setEdges(prev => prev.map(e => (e.target === nodeRef.id || e.source === nodeRef.id) ? { ...e, isRunning: false } : e));
      }
    } catch (err) {
      console.error("Execution error in Node Chain:", err);
      setNodes(prev => prev.map(n => n.id === processingNodeId
        ? { ...n, status: 'error', data: { ...n.data, error: (err instanceof Error ? err.message : String(err)) } }
        : n));
    } finally {
      setEdges(prev => prev.map(e => ({ ...e, isRunning: false })));
    }
  };

  const stopExecution = (id: string) => {
    setNodes(prev => prev.map(n => n.id === id ? { ...n, status: 'idle' } : n));
    setEdges(prev => prev.map(e => e.target === id || e.source === id ? { ...e, isRunning: false } : e));
  };

  return (
    <div 
      ref={canvasRef}
      className="w-full h-full relative overflow-hidden canvas-bg select-none"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={(e) => setZoom(z => Math.max(0.1, Math.min(2, z + (e.deltaY < 0 ? 0.05 : -0.05))))}
    >
      <div className="absolute inset-0 origin-top-left" style={{ transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})` }}>
        <svg className="absolute w-[10000px] h-[10000px] pointer-events-none">
          {dragEdge && (
            <path d={`M ${dragEdge.startPos.x} ${dragEdge.startPos.y} C ${dragEdge.startPos.x + 100} ${dragEdge.startPos.y}, ${dragEdge.currentPos.x - 100} ${dragEdge.currentPos.y}, ${dragEdge.currentPos.x} ${dragEdge.currentPos.y}`} stroke="#00f2ff" strokeWidth="2" strokeDasharray="5" fill="none" opacity="0.5" />
          )}
          {edges.map(edge => {
            const sNode = nodes.find(n => n.id === edge.source);
            const tNode = nodes.find(n => n.id === edge.target);
            if (!sNode || !tNode) return null;
            const sx = sNode.position.x + 300; const sy = sNode.position.y + 40;
            const tx = tNode.position.x; const ty = tNode.position.y + 40;
            const dx = tx - sx;
            return <path key={edge.id} d={`M ${sx} ${sy} C ${sx + Math.max(dx/2, 100)} ${sy}, ${tx - Math.max(dx/2, 100)} ${ty}, ${tx} ${ty}`} fill="none" className={edge.isRunning ? 'wire-running' : edge.isError ? 'wire-error' : 'wire-normal'} />;
          })}
        </svg>

        {nodes.map(node => (
          <NodeRenderer 
            key={node.id} node={node} isSelected={selectedNodeId === node.id}
            onSelect={() => { setSelectedNodeId(node.id); setIsDraggingNode(true); }}
            onConnectStart={(x, y) => startConnection(node.id, x, y)}
            onConnectEnd={() => completeConnection(node.id)}
            onExecute={() => executeEngine(node.id)}
            onStop={() => stopExecution(node.id)}
            onDelete={() => { setNodes(p => p.filter(n => n.id !== node.id)); setEdges(p => p.filter(e => e.source !== node.id && e.target !== node.id)); }}
            onUpdate={(data) => setNodes(prev => prev.map(n => node.id === n.id ? { ...n, ...data } : n))}
            globalData={globalData}
          />
        ))}
      </div>

      <div className="absolute bottom-6 right-6 flex flex-col gap-2 p-2 bg-[#111] border border-white/10 rounded-2xl shadow-2xl">
          <button onClick={() => setZoom(z => Math.min(2, z + 0.1))} className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"><span className="material-symbols-outlined text-[18px]">add</span></button>
          <button onClick={recenter} className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"><span className="material-symbols-outlined text-[18px]">crop_free</span></button>
          <button onClick={() => setZoom(z => Math.max(0.1, z - 0.1))} className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"><span className="material-symbols-outlined text-[18px]">remove</span></button>
      </div>
    </div>
  );
});