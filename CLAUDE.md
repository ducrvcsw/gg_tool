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
| `src/App.tsx` | State gốc, `HistoryRecord` interface, history state, inject style `.node-error`, `editHistory`/`deleteHistory`/`saveSnapshot`, `showFullAlert` |
| `src/components/LineFlowCanvas.tsx` | `executeEngine` (chạy chain), `validateNodeData`, `getThinkingLevel`, `processingNodeId`, 6-branch factory |
| `src/components/NodeRenderer.tsx` | Render node, `LLM_MODELS`, `FieldDropdown`, `OutputPreview` (auto-expand) |
| `src/components/ConceptMatrix.tsx` | UI chọn concept (Priority, Insight Rationale, Visual Score, click-to-select) |
| `src/components/ProductDeepDive.tsx` | Stage 1 — parse URL, multimodal, Master Brief JSON |
| `src/components/VisualProduction.tsx` | Stage 6 — prompt enrichment, 10 ref images, aspectRatio |
| `src/components/FinalStitch.tsx` | Stage 7 — MediaBunny stitch, output MP4 |
| `src/types/nodes.ts` | `NODE_CAPABILITIES` (định nghĩa input/output artifact mỗi node) |

## Node types (Line Flow) — input/output artifact
- `product_link` → out: `PRODUCT_INFO`
- `product_image` → out: `PRODUCT_VISUALS`
- `ai_researcher` → in: `PRODUCT_INFO`+`PRODUCT_VISUALS`, out: `INSIGHTS`
- `insight_matrix` → in: `INSIGHTS`, out: `INSIGHTS` (ma trận 4 agent)
- `concept_factory` → in: `INSIGHTS`, out: `CONCEPT`
- `b{i}-concept` (text_node) → in/out: `CONCEPT` (display node trung gian, i=1–6)
- `branch_script` → in: `CONCEPT`, out: `SCRIPT`
- `visual_prompting` → in: `PRODUCT_VISUALS`+`SCRIPT`, out: `IMAGE_ASSET`
- `render_node` → in: `IMAGE_ASSET`+`SCRIPT`, out: `VIDEO_ASSET`

## Quan hệ file (sửa A → kiểm tra B)
- Sửa `LLM_MODELS` (NodeRenderer) → kiểm tra `getThinkingLevel` (LineFlowCanvas) khớp tên model.
- Sửa execution status / error → đụng cả `executeEngine` (LineFlowCanvas) + `.node-error` (App.tsx) + mapping `node.status==='error'` (NodeRenderer).
- Sửa node input/output → đụng `NODE_CAPABILITIES` (types/nodes.ts) + `validateNodeData` (LineFlowCanvas).
- Sửa scene structure → đụng `branch_script` output + `visual_prompting` (map qua mảng scene).

## Invariants (KHÔNG được phá)
- Chỉ báo `done` khi TOÀN BỘ chain pass. Lỗi ở bất kỳ node nào → `status:'error'` + border đỏ tại ĐÚNG node đó, dừng downstream.
- User chọn model nào → chạy đúng model đó (`node.model || 'Gemini 3.5 Flash'`), không hardcode.
- Upstream validation: node đích chỉ chạy khi mọi input artifact sẵn sàng.
- History tối đa 10 jobs; đầy → `showFullAlert`, không tự xóa.

## Quy ước commit
- Mỗi thay đổi logic = 1 commit, message mô tả "fix/feat: <gì> tại <file>".
- Commit trước khi copy sang Google Flow để có điểm revert.
