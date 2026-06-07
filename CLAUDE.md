# CLAUDE.md — UGC Omni Engine

## ⚠️ Bối cảnh quan trọng (đọc trước khi sửa bất cứ gì)

Đây là codebase được **mirror thủ công từ Google Flow** (nơi app thực sự chạy).
Repo này KHÔNG build/deploy độc lập — nó là **source of truth để đọc, sửa lỗi, và diff**.

**Quy tắc tối thượng:**
- KHÔNG đổi kiến trúc tổng thể, KHÔNG đổi tên file/biến/hàm trừ khi được yêu cầu rõ ràng.
- KHÔNG thêm dependency mới (app chạy trong sandbox Google Flow, không có bước `npm install`).
- Mọi thay đổi phải tối thiểu (minimal diff) để dễ copy ngược lại sang Google Flow.
- Khi sửa 1 file, luôn kiểm tra các file liên quan (xem "Quan hệ file" bên dưới) để tránh hỏng chỗ khác.
- Code dùng `Flow.*` SDK (Flow.generate.text/image/video, Flow.media.select, Flow.download) — đây là API của Google Flow, KHÔNG phải thư viện npm.

## Stack
- React + TypeScript (.tsx)
- Google Flow SDK (`Flow.*`) — chạy trong sandbox, không fetch external
- Models: Gemini (LLM), Nano Banana Pro (image), Omni Flash / Veo 3.1 (video), ElevenLabs (voice, qua copy-paste thủ công)

## Hai chế độ vận hành
1. **Standard Mode** — Linear pipeline step-by-step (step 0 → 9).
2. **Line Flow Mode** — Node-based canvas (Artifact-Driven Workflow).

## Cấu trúc file & trách nhiệm
| File | Trách nhiệm |
|------|-------------|
| `src/App.tsx` | State gốc, `HistoryRecord`/`AppJob`, 2 mode (standard/line_flow), `initializeOmniChain` (factory 6 nhánh), inject CSS `.node-running`+`.wire-*`, `runStandardAnalysis`, `handleGenerateScript`, `editHistory`/`saveSnapshot`, render 9 step (case 1→9) |
| `src/components/ProductIntake.tsx` | Step 0 — nhập link + paste/upload ảnh (`Flow.upload`), profile model (giới tính/tuổi), chiến lược Child-UGC, phân tích ảnh URL (CORS-aware) |
| `src/components/ProductDeepDive.tsx` | Step 1 — hiển thị Master Brief (name, Visual DNA, core_value, features). Không gọi AI |
| `src/components/InsightMap.tsx` | Step 2 — render ma trận 4 agent (industry/marketing_seo/psychology/media_director), `safeGet` fuzzy unwrap |
| `src/components/ConceptMatrix.tsx` | Step 3 — chọn 1/6 concept (nhãn Agent A–D, suitability score, click-to-select, retry) |
| `src/components/ScriptConfig.tsx` | Step 4 — kiểu bối cảnh (1/2/3) + góc máy, sceneCount/sceneDuration, nhúng `ModelPriceTable` |
| `src/components/ScriptTimeline.tsx` | Step 5 — render timeline kịch bản; nhánh voice/no-voice; trạng thái error/empty |
| `src/components/VoiceStudio.tsx` | Step 6 — script gợi ý/custom, regenerate voice (`Flow.generate.text`), upload audio vs Omni auto-voice |
| `src/components/VisualProduction.tsx` | Step 7 — sinh ảnh từng scene (`Flow.generate.image`, ≤10 refIds), Custom Hub Model + Phụ kiện, sanitize, aspectRatio |
| `src/components/VideoProduction.tsx` | Step 8 — sinh video từng scene (`Flow.generate.video`), voice rules, audit "Check Violate", `sanitizePromptForOmni` |
| `src/components/FinalStitch.tsx` | Step 9 — gallery preview + download MP4 từng clip + Copy Full JSON (KHÔNG ghép video) |
| `src/components/ExportPanel.tsx` | Panel phải ở step 9 — xem JSON payload, Copy/Download file JSON |
| `src/components/WorkflowStepper.tsx` | Sidebar 9 bước (ẩn "Voice" khi no_voice), điều hướng theo `maxReachedStep` |
| `src/components/JobHistory.tsx` | List history (status/opMode/time) + nút edit/delete |
| `src/components/LineFlowCanvas.tsx` | Canvas Line Flow: `executeEngine`, `validateNodeData`, `getUpstreamNodes`, `sanitizePromptForOmni`, `recenter`/`addNodeAtCenter`, zoom/pan/edge |
| `src/components/NodeRenderer.tsx` | Render 1 node: `LLM_MODELS`/`IMAGE_MODELS`/`VIDEO_MODELS`, `OutputPreview` (auto-expand), border-by-status, START CHAIN/STOP |
| `src/components/UIPrimitives.tsx` | Primitives chung: `SectionLabel`, `PillButton`, `SegmentedToggle`, `RangeSlider`, `FieldDropdown`, `TextInput`, `DragNumberField` |
| `src/components/ModelPriceTable.tsx` | Bảng giá credit 4 video model (tĩnh) |
| `src/components/LoadingState.tsx` | Spinner "Expert Matrix" khi `isAnalyzing` |
| `src/components/GitDiffModal.tsx` | Modal diff (`diff.createPatch`) giữa `PREVIOUS_CODE_MAP` và code hiện tại |
| `src/types/nodes.ts` | `NodeType`, `AppNode`/`AppEdge`, `NODE_CAPABILITIES` (input/output artifact mỗi node) |
| `src/constants/previousCode.ts` | `PREVIOUS_CODE_MAP` (nguồn so sánh cho GitDiffModal) |

## Node types (Line Flow) — input/output artifact
(khớp đúng `NODE_CAPABILITIES` trong `src/types/nodes.ts`)

**INPUT**
- `product_link` → out: `PRODUCT_INFO`
- `product_image` → out: `PRODUCT_VISUALS`
- `product_intake` → out: `PRODUCT_INFO` + `PRODUCT_VISUALS`

**RESEARCH**
- `ai_researcher` → in: `PRODUCT_INFO`+`PRODUCT_VISUALS`, out: `USP_BLUEPRINT`
- `insight_matrix` → in: `USP_BLUEPRINT`, out: `INSIGHTS`
- `concept_factory` → in: `INSIGHTS`, out: `CREATIVE_ANGLES`

**CREATIVE**
- `branch_script` → in: `CREATIVE_ANGLES`, out: `SCENE_SCRIPT`
- `text_node` → in: (none), out: `RAW_TEXT`
- `visual_prompting` → in: `PRODUCT_VISUALS`+`SCENE_SCRIPT`, out: `ENRICHED_PROMPT`
- `consistency_engine` → in: `PRODUCT_VISUALS`, out: `VISUAL_DNA`

**PRODUCTION**
- `image_node` → in: `SCENE_SCRIPT`, out: `IMAGE_ASSET`
- `video_node` → in: `SCENE_SCRIPT`+`IMAGE_ASSET`, out: `VIDEO_ASSET`
- `render_node` → in: `IMAGE_ASSET`+`VIDEO_ASSET`, out: `FINAL_CLIP`
- `export_stitch` → in: `FINAL_CLIP`, out: `PRODUCTION_PAYLOAD`

**Chuỗi mặc định `initializeOmniChain` (App.tsx):**
node-url(`product_link`) + node-media(`product_image`) → node-researcher(`ai_researcher`) → node-insight(`insight_matrix`) → node-factory(`concept_factory`) → 6 nhánh, mỗi nhánh: `c-{i}`=`text_node` ("Concept Angle") → `s-{i}`=`branch_script` → `v-{i}`=`image_node` ("Visual Hub") → `r-{i}`=`render_node`. (i=0..5)
> Node library (App.tsx) chỉ tạo được: product_link, product_image, ai_researcher, insight_matrix, concept_factory, image_node, video_node.

## Quan hệ file (sửa A → kiểm tra B)
- Sửa model list (`LLM_MODELS`/`IMAGE_MODELS`/`VIDEO_MODELS` ở NodeRenderer) → kiểm tra default model trong `executeEngine` (LineFlowCanvas: '🍌 Nano Banana Pro', 'Omni Flash') và `initializeOmniChain` (App.tsx: 'Gemini 3.5 Flash', '🍌 Nano Banana Pro', 'Omni Flash') khớp tên chuỗi.
- Sửa execution status / error → đụng `executeEngine` (LineFlowCanvas) + border-by-status trong NodeRenderer (running/waiting/error/done) + CSS `.node-running`/`.wire-*` inject ở App.tsx.
- Sửa node input/output → đụng `NODE_CAPABILITIES` (types/nodes.ts) + `validateNodeData`/`getUpstreamNodes` (LineFlowCanvas).
- Sửa chuỗi 6 nhánh mặc định → đụng `initializeOmniChain` (App.tsx).
- Sửa scene structure (`scriptData.script_timeline[]`) → đụng `handleGenerateScript` (App.tsx) + ScriptTimeline + VisualProduction (`generated_assets.scene_image`) + VideoProduction (`generated_video`) + FinalStitch/ExportPanel.
- Sửa kiểu/prop dùng chung (`JobStatus`/`AspectRatio`/`ProductionMode`/...) → khai báo ở App.tsx, được import ngược bởi nhiều component.

## Invariants (KHÔNG được phá)
- Chỉ báo `done` khi TOÀN BỘ chain pass. Lỗi ở bất kỳ node nào → `status:'error'` + border đỏ tại ĐÚNG node đó, dừng downstream.
- User chọn model nào → chạy đúng model đó (`node.model || 'Gemini 3.5 Flash'`), không hardcode.
- Upstream validation: node đích chỉ chạy khi mọi input artifact sẵn sàng.
- History tối đa 10 jobs; đầy → `showFullAlert`, không tự xóa.

## Quy ước commit
- Mỗi thay đổi logic = 1 commit, message mô tả "fix/feat: <gì> tại <file>".
- Commit trước khi copy sang Google Flow để có điểm revert.
