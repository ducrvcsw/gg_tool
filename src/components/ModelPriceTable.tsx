import React from 'react';

export const ModelPriceTable: React.FC = () => {
  const data = [
    {
      name: 'Omni Flash',
      duration: '4s / 8s / 10s',
      price: '7 / 12 / 15 credits',
      notes: 'Đa năng nhất, tối ưu linh hoạt theo thời lượng. Hỗ trợ tính năng Voice Sync / Lip-sync tốt nhất.'
    },
    {
      name: 'Veo 3.1 - Lite',
      duration: '8 giây',
      price: '10 credits',
      notes: 'Giải pháp tiết kiệm tài nguyên. Tốc độ nhanh, chất lượng hình ảnh ổn định.'
    },
    {
      name: 'Veo 3.1 - Fast',
      duration: '8 giây',
      price: '20 credits',
      notes: 'Tối ưu hóa cho các phân cảnh hành động. Render nhanh, xử lý chuyển động model mượt mà.'
    },
    {
      name: 'Veo 3.1 - Quality',
      duration: '8 giây',
      price: '100 credits',
      notes: 'Bản cao cấp nhất (Cinematic 4K). Cực kỳ sắc nét, bảo toàn chi tiết sản phẩm/vải.'
    }
  ];

  return (
    <div className="w-full overflow-hidden rounded-3xl border border-white/10 bg-black/40 backdrop-blur-md shadow-2xl">
      <div className="overflow-x-auto dark-scrollbar">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/10 bg-white/5">
              <th className="px-5 py-4 text-[10px] font-black uppercase tracking-widest text-emerald-400">Video Model</th>
              <th className="px-5 py-4 text-[10px] font-black uppercase tracking-widest text-white/60">Thời lượng</th>
              <th className="px-5 py-4 text-[10px] font-black uppercase tracking-widest text-white/60">Giá Credit (Pro/Plus)</th>
              <th className="px-5 py-4 text-[10px] font-black uppercase tracking-widest text-white/60">Hiệu năng & Ghi chú</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {data.map((row, i) => (
              <tr key={i} className="hover:bg-white/[0.02] transition-colors group">
                <td className="px-5 py-4">
                  <span className="text-[12px] font-black text-white group-hover:text-emerald-400 transition-colors uppercase tracking-tight">{row.name}</span>
                </td>
                <td className="px-5 py-4">
                  <span className="text-[11px] font-bold text-white/70">{row.duration}</span>
                </td>
                <td className="px-5 py-4">
                  <span className="text-[11px] font-black text-emerald-500/80">{row.price}</span>
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-[14px] text-white/20 mt-0.5">info</span>
                    <p className="text-[11px] text-white/40 leading-relaxed max-w-md">{row.notes}</p>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};