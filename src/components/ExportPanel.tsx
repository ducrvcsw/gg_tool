import React, { useState } from 'react';
import { Flow } from 'flow-sdk';
import { PillButton, SectionLabel } from './UIPrimitives';

export const ExportPanel: React.FC<{ data: any }> = ({ data }) => {
  const [copied, setCopied] = useState(false);

  const handleDownload = async () => {
    const jsonString = JSON.stringify(data, null, 2);
    const base64 = btoa(unescape(encodeURIComponent(jsonString)));
    await Flow.download({
      base64,
      mimeType: 'application/json',
      filename: `UGC_Production_Engine_${data.ad_campaign_brief?.product_name || 'Asset'}.json`
    });
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-[300px] border-l border-white/10 p-4 shrink-0 flex flex-col gap-6 bg-[#0e0e0e] z-20 overflow-y-auto dark-scrollbar">
      <div className="flex flex-col gap-2">
        <SectionLabel>Campaign Payload</SectionLabel>
        <div className="bg-[#111] border border-white/10 rounded-xl p-3 flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-white/30 font-bold uppercase">Production Status</span>
            <span className="text-[10px] text-blue-400 font-bold">READY</span>
          </div>
          <p className="text-[12px] text-white/70 leading-snug">
            Cấu trúc JSON đã được làm giàu (Enrich) với Giai đoạn 1 & 2. Sẵn sàng cho Video Pipeline.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <SectionLabel>Automation JSON</SectionLabel>
        <div className="bg-black/50 border border-white/5 rounded-xl p-2 font-mono text-[9px] text-white/40 h-[280px] overflow-hidden relative">
          <pre className="whitespace-pre-wrap">{JSON.stringify(data, null, 2)}</pre>
          <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent" />
        </div>
      </div>

      <div className="mt-auto flex flex-col gap-2 pt-4 border-t border-white/10">
        <PillButton variant="outline" icon={<span className="material-symbols-outlined text-[18px]">{copied ? 'check' : 'content_copy'}</span>} onClick={handleCopy}>
          {copied ? 'Đã sao chép' : 'Copy JSON'}
        </PillButton>
        <PillButton variant="solid" icon={<span className="material-symbols-outlined text-[18px]">download</span>} onClick={handleDownload}>
          Xuất file Full Production
        </PillButton>
      </div>
    </div>
  );
};