export type NodeType = 
  // NHÓM INPUT
  | 'product_link' 
  | 'product_image'
  | 'product_intake'
  // NHÓM RESEARCH & STRATEGY
  | 'ai_researcher' 
  | 'insight_matrix' 
  | 'concept_factory' 
  // NHÓM CREATIVE CONTENT
  | 'branch_script' 
  | 'text_node'
  | 'visual_prompting'
  | 'consistency_engine' 
  // NHÓM PRODUCTION
  | 'image_node'
  | 'video_node'
  | 'render_node'
  | 'export_stitch';

export interface NodePosition {
  x: number;
  y: number;
}

export interface AppNode {
  id: string;
  type: NodeType;
  position: NodePosition;
  label: string;
  data: any;
  status: 'idle' | 'running' | 'done' | 'error' | 'waiting';
  model?: string;
  duration?: string;
  effort?: 'low' | 'medium' | 'high';
  branchId?: number; 
}

export interface AppEdge {
  id: string;
  source: string;
  target: string;
  isRunning?: boolean;
  isError?: boolean;
}

/**
 * Định nghĩa khả năng của từng loại Node theo Master Blueprint.
 * Phân tách rõ rệt Input và Output Artifacts.
 */
export const NODE_CAPABILITIES: Record<string, { inputs: string[], outputs: string[] }> = {
  // INPUT
  product_link: { inputs: [], outputs: ['PRODUCT_INFO'] },
  product_image: { inputs: [], outputs: ['PRODUCT_VISUALS'] },
  product_intake: { inputs: [], outputs: ['PRODUCT_INFO', 'PRODUCT_VISUALS'] },
  
  // RESEARCH
  ai_researcher: { inputs: ['PRODUCT_INFO', 'PRODUCT_VISUALS'], outputs: ['USP_BLUEPRINT'] },
  insight_matrix: { inputs: ['USP_BLUEPRINT'], outputs: ['INSIGHTS'] },
  concept_factory: { inputs: ['INSIGHTS'], outputs: ['CREATIVE_ANGLES'] },
  
  // CREATIVE
  branch_script: { inputs: ['CREATIVE_ANGLES'], outputs: ['SCENE_SCRIPT'] },
  text_node: { inputs: [], outputs: ['RAW_TEXT'] },
  visual_prompting: { inputs: ['PRODUCT_VISUALS', 'SCENE_SCRIPT'], outputs: ['ENRICHED_PROMPT'] },
  consistency_engine: { inputs: ['PRODUCT_VISUALS'], outputs: ['VISUAL_DNA'] },
  
  // PRODUCTION
  // Cập nhật image_node để chấp nhận SCENE_SCRIPT phù hợp với default chain (branch_script -> image_node)
  image_node: { inputs: ['SCENE_SCRIPT'], outputs: ['IMAGE_ASSET'] },
  video_node: { inputs: ['SCENE_SCRIPT', 'IMAGE_ASSET'], outputs: ['VIDEO_ASSET'] },
  render_node: { inputs: ['IMAGE_ASSET', 'VIDEO_ASSET'], outputs: ['FINAL_CLIP'] },
  export_stitch: { inputs: ['FINAL_CLIP'], outputs: ['PRODUCTION_PAYLOAD'] },
};