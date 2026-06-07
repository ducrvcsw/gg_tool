# Quy trình sync code từ Google Flow → repo mirror

> Bối cảnh: không edit code trực tiếp trong Google Flow được (chỉ prompt Gemini), và app đã compile
> nên không đọc được source .tsx lúc runtime. Mục tiêu: lấy code thật từ GG về repo này để Claude diff & sửa.

---

## ⛔ Hướng đã THẤT BẠI — "bake source vào constant" (nút Export Source)

Đã thử bắt Gemini dựng `PROJECT_SOURCE` (constant chứa toàn bộ source) + nút "Copy All Source".
Kết quả hỏng:
- Nội dung từng file là **placeholder giả** (`// (Mã nguồn ... đã được làm sạch)`), không phải code thật.
- Chỉ track **5/22 file**.

**Nguyên nhân gốc:** bắt LLM tự sao chép 6000 dòng source của chính nó vào một biến string rồi giữ
đồng bộ mãi → nó luôn gian lận (tóm tắt/stub/bỏ file). **Bỏ hẳn hướng này. Nên gỡ nút Export.**

---

## ✅ Quy trình khuyến nghị

Nguyên tắc: bắt Gemini **in code thật ra chat** (in trong câu trả lời khó cheat hơn nhồi vào constant).
Repo này là nguồn chân lý "code đang có" → Claude tự `git diff`, không cần Gemini tạo diff.

### Giai đoạn 1 — Sync đầy đủ (chỉ làm 1 lần, hoặc khi nghi lệch nhiều)

**Prompt 1.1 — lấy danh sách file:**
```
Liệt kê đường dẫn đầy đủ của TẤT CẢ file trong thư mục src/ của dự án này,
mỗi dòng một path (vd: src/App.tsx). KHÔNG in nội dung, KHÔNG bỏ sót file nào, KHÔNG thêm lời dẫn.
```

**Prompt 1.2 — in từng file (lặp lại, mỗi lần 1 file; file lớn in riêng):**
```
In NGUYÊN VĂN toàn bộ nội dung file: <DÁN_PATH>
TUYỆT ĐỐI CẤM: tóm tắt, rút gọn, thay code bằng chú thích kiểu "// (đã làm sạch)" / "// ... giữ nguyên" / "// ...",
bỏ qua bất kỳ dòng nào, cắt giữa chừng.
Chỉ in code thật trong 1 code block, dòng đầu ghi đúng path. File dài cỡ nào cũng in hết.
Nếu vướng giới hạn độ dài, in tiếp phần còn lại của ĐÚNG file này ở câu trả lời sau, không nhảy file khác.
```

### Giai đoạn 2 — Cập nhật từng lần (NGẮN, dùng thường xuyên)

Sau Giai đoạn 1, mỗi lần Gemini sửa gì chỉ cần lấy **các file vừa đổi (full)** — thường 1–3 file.

**Prompt 2 — in các file vừa thay đổi:**
```
Bạn vừa sửa code. Chỉ làm 2 việc, không giải thích thừa:
1. Liệt kê các file bạn vừa THÊM / SỬA / XÓA trong lần này.
2. In NGUYÊN VĂN toàn bộ nội dung MỚI của TỪNG file vừa thêm/sửa — đầy đủ, KHÔNG tóm tắt,
   KHÔNG "// ...", KHÔNG "đã làm sạch". Mỗi file 1 code block, dòng đầu ghi đúng path.
   File bị xóa: chỉ ghi "DELETED: <path>".
KHÔNG in các file không liên quan.
```

→ Dán output cho Claude. Claude ghi đè đúng các file đó vào repo, rồi `git diff` ra thay đổi chính xác.

### (Tùy chọn) Prompt review nhanh — chỉ để đọc, KHÔNG để áp

```
Tóm tắt thay đổi vừa làm dạng dễ đọc: với mỗi file đổi, liệt kê hàm/khối đã sửa + mô tả ngắn đổi gì.
(Vẫn phải kèm bản in đầy đủ các file thay đổi ở trên — bản tóm tắt này chỉ để review.)
```

---

## Vì sao KHÔNG dùng "nút show file vừa update" / "Gemini xuất git diff"

- **Nút in-app:** app runtime không biết Gemini vừa đổi file nào (không có metadata). Muốn có thì Gemini
  phải tự ghi vào constant → lặp lại trò stub rỗng. Tên file ghi được, nội dung thật thì không.
- **Git diff do Gemini bịa:** ngắn nhưng số dòng/context thường sai → áp nhầm. In full file thay đổi rồi
  để repo tự `git diff` mới an toàn (ghi đè không bao giờ sai).

## Chống cheat (luôn nhắc Gemini)
Không tóm tắt, không `// ...`, không `// (đã làm sạch)`, không bỏ file, không cắt giữa chừng. In code thật.

## Cách Claude áp về repo
Nhận code theo từng code block có path ở dòng đầu (hoặc delimiter `===== FILE: <path> =====`),
ghi đè đúng file → `git diff` → xử lý/sửa tiếp tại repo.
