import React, { useState, useRef, useEffect } from 'react';

export const SectionLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="flex items-center px-2">
    <span className="text-[11px] font-medium text-[rgba(218,220,224,0.9)] tracking-[1px] uppercase">
      {children}
    </span>
  </div>
);

export const PillButton: React.FC<{
  icon?: React.ReactNode; 
  children: React.ReactNode;
  variant?: 'filled' | 'outline' | 'solid'; 
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}> = ({ icon, children, variant = 'filled', onClick, disabled, className = '' }) => {
  const base = 'flex items-center gap-[6px] justify-center w-full rounded-xl font-medium tracking-[0.1px] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed';
  const variants: Record<string, string> = {
    filled: 'bg-[#2a2a2a] hover:bg-[#333] active:bg-[#1a1a1a] text-white text-[12px] border border-white/10 shadow-lg',
    outline: 'border border-white/30 hover:bg-white/10 active:bg-white/15 backdrop-blur-[40px] text-[12px] text-white',
    solid: 'bg-white hover:bg-gray-200 active:bg-gray-300 text-black text-[12px]',
  };
  return (
    <button className={`${base} ${variants[variant]} ${className}`} onClick={onClick} disabled={disabled}>
      {icon && <span className="flex items-center justify-center w-4 h-4">{icon}</span>}
      <span className="truncate">{children}</span>
    </button>
  );
};

export const SegmentedToggle: React.FC<{
  value: string; 
  items: { value: string; label: string; icon?: React.ReactNode }[];
  onChange: (val: string) => void;
}> = ({ value, items, onChange }) => (
  <div className="flex w-full items-center border border-white/15 rounded-xl overflow-hidden bg-black/30">
    {items.map((item) => (
      <button 
        key={item.value} 
        type="button" 
        onClick={() => onChange(item.value)}
        className={`flex-1 flex items-center justify-center gap-2 h-[34px] px-3 transition-all cursor-pointer ${
          value === item.value 
            ? 'bg-white text-black font-bold' 
            : 'text-white/60 hover:text-white hover:bg-white/10'
        }`}
      >
        {item.icon && <span className="flex items-center">{item.icon}</span>}
        <span className="text-[10px] uppercase tracking-wider">{item.label}</span>
      </button>
    ))}
  </div>
);

export const RangeSlider: React.FC<{
  label: string; value: number; min: number; max: number;
  step?: number; formatValue?: (val: number) => string;
  onChange: (val: number) => void;
}> = ({ label, value, min, max, step = 1, formatValue = (v) => String(v), onChange }) => (
  <div className="flex flex-col gap-2 pt-2 pb-[5px] w-full">
    <div className="flex items-center justify-between px-2 select-none">
      <span className="text-[11px] font-medium text-[rgba(218,220,224,0.9)] tracking-[0.1px] uppercase tracking-widest">{label}</span>
      <span className="text-[11px] font-medium text-white tracking-[0.1px]">{formatValue(value)}</span>
    </div>
    <div className="px-2 w-full flex items-center h-2">
      <input 
        type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))} 
        className="w-full accent-white h-1 bg-white/10 rounded-full appearance-none cursor-pointer"
      />
    </div>
  </div>
);

export const FieldDropdown: React.FC<{
  label: string; value: string; options: string[];
  onChange: (val: string) => void; className?: string;
}> = ({ label, value, options, onChange, className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button type="button" onClick={() => setIsOpen(!isOpen)}
        className="w-full text-left border border-white/15 hover:border-white/30 bg-black/50 transition-colors rounded-xl flex flex-col gap-0 justify-center pb-1.5 pl-3 pr-2 pt-[3px] select-none focus:outline-none">
        <p className="text-[9px] font-black text-white/50 uppercase tracking-[0.5px]">{label}</p>
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-white truncate">{value}</span>
          <span className={`material-symbols-outlined text-[16px] text-white/40 transition-transform ${isOpen ? 'rotate-180' : ''}`}>keyboard_arrow_down</span>
        </div>
      </button>
      {isOpen && (
        <div className="absolute z-[100] top-[calc(100%+4px)] left-0 w-full bg-[#1a1a1a] border border-white/20 rounded-xl overflow-hidden shadow-2xl backdrop-blur-md animate-dropdown">
          <div className="max-h-40 overflow-y-auto dark-scrollbar">
            {options.map((opt) => (
              <button key={opt} type="button"
                className={`w-full text-left px-3 py-2 text-[10px] font-bold uppercase tracking-wider hover:bg-white/10 transition-colors ${value === opt ? 'bg-white/15 text-emerald-400' : 'text-white/80'}`}
                onClick={() => { onChange(opt); setIsOpen(false); }}>
                {opt}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export const TextInput: React.FC<{
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
      value={value} 
      onChange={(e) => onChange(e.target.value)} 
      placeholder={placeholder}
      className={`border border-white/15 hover:border-white/30 focus:border-white/50 rounded-xl w-full px-3 py-2.5 resize-none bg-black/40 text-[11px] font-medium text-white placeholder-white/20 tracking-[0.1px] focus:outline-none transition-colors overflow-hidden ${className}`} 
      onMouseDown={(e) => e.stopPropagation()}
    />
  );
};

export const DragNumberField: React.FC<{
  label: string; value: number; min?: number; max?: number;
  step?: number; suffix?: string; onChange: (val: number) => void; className?: string;
}> = ({ label, value, min = 0, max = 99, step = 1, suffix = '', onChange, className = '' }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(String(value));
  const inputRef = useRef<HTMLInputElement>(null);
  const dragRef = useRef<{ startY: number; startVal: number; moved: boolean } | null>(null);

  const commitEdit = (raw: string) => {
    const parsed = parseFloat(raw);
    if (!isNaN(parsed)) onChange(Math.min(max, Math.max(min, Math.round(parsed / step) * step)));
    setIsEditing(false);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isEditing) return;
    e.preventDefault();
    dragRef.current = { startY: e.clientY, startVal: value, moved: false };
    const handleMouseMove = (ev: MouseEvent) => {
      if (!dragRef.current) return;
      if (Math.abs(ev.clientY - dragRef.current.startY) > 3) dragRef.current.moved = true;
      if (dragRef.current.moved) {
        const delta = dragRef.current.startY - ev.clientY;
        const newVal = Math.round((dragRef.current.startVal + delta * step) / step) * step;
        onChange(Math.min(max, Math.max(min, newVal)));
        document.body.style.cursor = 'ns-resize';
      }
    };
    const handleMouseUp = () => {
      const wasDrag = dragRef.current?.moved;
      dragRef.current = null;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      if (!wasDrag) {
        setEditValue(String(value));
        setIsEditing(true);
        setTimeout(() => inputRef.current?.select(), 0);
      }
    };
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <div className={`border border-white/15 hover:border-white/30 bg-black/50 rounded-xl flex flex-col gap-0.5 justify-center pb-2 pl-3 pr-1 pt-[5px] select-none transition-colors ${isEditing ? '' : 'cursor-ns-resize'} ${className}`}
      onMouseDown={handleMouseDown}>
      <p className="text-[9px] font-black text-white/50 uppercase tracking-[0.5px]">{label}</p>
      <div className="flex items-center justify-between">
        {isEditing ? (
          <input ref={inputRef} type="text" value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') commitEdit(editValue); if (e.key === 'Escape') setIsEditing(false); }}
            onBlur={() => commitEdit(editValue)}
            className="bg-transparent text-[11px] font-bold text-white tracking-[0.1px] outline-none w-full border-none p-0 m-0" autoFocus />
        ) : (
          <>
            <span className="text-[11px] font-bold text-white tracking-[0.1px] cursor-text">{value}{suffix}</span>
            <div className="flex flex-col items-center mr-1.5 -gap-px text-white/20">
              <span className="material-symbols-outlined text-[14px]">unfold_more</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};