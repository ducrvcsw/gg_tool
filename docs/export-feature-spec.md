# Spec — Tính năng "Export Source" (prompt cho Gemini / Google Flow)

> Mục đích: Vì không edit code trực tiếp trong Google Flow được (chỉ prompt Gemini),
> cần một nút trong app để copy TOÀN BỘ source ra clipboard/file, rồi dán về repo mirror
> này (`ugc-omni-engine`) để Claude diff & sửa.
>
> **Điểm sống còn:** invariant bảo trì ở PHẦN 2. Nếu Gemini không cập nhật `PROJECT_SOURCE`
> mỗi lần sửa file, nút export sẽ xuất code cũ. Định kỳ vẫn nên đối chứng bằng "Prompt B" (dump toàn bộ).

---

## Prompt dán vào Google Flow

```
NHIỆM VỤ: Thêm tính năng "Export Source" để tôi copy toàn bộ source code của app ra clipboard / file.

BỐI CẢNH & RÀNG BUỘC (đọc kỹ, tuân thủ tuyệt đối):
- App chạy trong sandbox Google Flow, đã compile nên KHÔNG thể fetch/đọc file .tsx nguồn lúc runtime.
  Vì vậy nguồn duy nhất tin cậy để export là một CONSTANT chứa sẵn source dạng chuỗi.
- KHÔNG thêm thư viện npm mới. Chỉ dùng React + TypeScript + Flow.* SDK + framer-motion
  và các primitive UI sẵn có trong src/components/UIPrimitives.tsx.
- Giữ nguyên kiến trúc, theme tối hiện tại. Diff tối thiểu.

PHẦN 1 — DATA (nguồn chân lý):
- Tạo file src/constants/projectSource.ts, export:
    export const PROJECT_SOURCE: Record<string, string> = { ... }
- Key là ĐƯỜNG DẪN ĐẦY ĐỦ từ gốc dự án (vd: "src/App.tsx", "src/components/NodeRenderer.tsx",
  "src/types/nodes.ts", "src/constants/projectSource.ts").
- Value là TOÀN BỘ nội dung hiện tại của file đó (đầy đủ, không rút gọn, không "// ...").
- Phải liệt kê ĐỦ TẤT CẢ file trong src/ (kể cả chính projectSource.ts).

PHẦN 2 — INVARIANT BẢO TRÌ (BẮT BUỘC, quan trọng nhất):
- Kể từ giờ, MỖI khi bạn tạo/sửa/xóa BẤT KỲ file nào, trong CÙNG lượt đó bạn PHẢI cập nhật
  entry tương ứng trong PROJECT_SOURCE cho khớp 100% với code mới.
- Nếu thêm file mới → thêm key mới. Nếu xóa file → xóa key. Không được để PROJECT_SOURCE lệch với code thật.

PHẦN 3 — UI:
- Thêm một nút "Export Source" ở sidebar trái (cạnh nút Git Diff hiện có, icon "ios_share" hoặc "download").
- Bấm vào mở một modal (dùng motion + style giống GitDiffModal):
    * Tiêu đề "Export Project Source" + hiển thị tổng số file: Object.keys(PROJECT_SOURCE).length.
    * Danh sách tất cả file; mỗi dòng có nút "Copy" riêng (copy nội dung 1 file).
    * Nút lớn "Copy All Source" → copy 1 chuỗi gộp TẤT CẢ file ra clipboard
      (dùng navigator.clipboard.writeText).
    * Nút "Download .txt" → tải chuỗi gộp đó về (dùng Flow.download với
      base64 = btoa(unescape(encodeURIComponent(dump))), mimeType 'text/plain',
      filename 'ugc-omni-source.txt'). Tham khảo cách Flow.download đã dùng trong ExportPanel.tsx.
    * Mỗi nút copy hiển thị trạng thái "Copied ✓" trong ~2 giây.

PHẦN 4 — ĐỊNH DẠNG CHUỖI GỘP (cực kỳ quan trọng, phải đúng từng ký tự để máy parse được):
- Ghép các file theo thứ tự key, mỗi file bọc bằng delimiter sau:

===== FILE: <đường-dẫn> =====
<toàn bộ nội dung file>
===== END: <đường-dẫn> =====

  (giữa các block cách nhau đúng 1 dòng trống; KHÔNG bọc trong ``` markdown).

PHẦN 5 — TIÊU CHÍ NGHIỆM THU:
- Bấm "Copy All Source" → clipboard chứa source đầy đủ của mọi file, đúng định dạng PHẦN 4.
- Số file hiển thị == số file thật trong src/.
- Không lỗi TypeScript, không thêm dependency, app vẫn chạy bình thường.
- (Tùy chọn) Có thể gỡ bỏ GitDiffModal cũ vì tính năng này thay thế hoàn toàn nhu cầu đó.
```

---

## Quy trình sync sau khi có nút export

1. Trong Google Flow: bấm **Export Source → Copy All Source** (hoặc Download .txt).
2. Dán nội dung cho Claude ở repo này.
3. Claude tách theo delimiter `===== FILE: ... =====`, ghi đè từng file, rồi `git diff` để xem thay đổi.
4. Claude sửa/diff trên repo; nếu cần đổi code, Claude soạn prompt để bạn nhờ Gemini áp lại bên GG.

## Prompt dự phòng (khi nghi nút export xuất code cũ)

**Prompt B — dump toàn bộ source thủ công:**

```
In ra TOÀN BỘ source code hiện tại của dự án, đầy đủ từng file một.
Quy tắc bắt buộc:
- Mỗi file một code block riêng; dòng đầu mỗi block ghi đường dẫn đầy đủ (vd: src/App.tsx).
- In NGUYÊN VẸN nội dung, tuyệt đối không rút gọn, không "...", không bỏ qua phần nào.
- Liệt kê đủ tất cả file trong src/. Không thêm lời dẫn giải.
```
