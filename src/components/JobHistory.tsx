import React from 'react';
import { HistoryRecord } from '../App';

interface JobHistoryProps {
  history: HistoryRecord[];
  onEdit: (record: HistoryRecord) => void;
  onDelete: (id: string) => void;
}

export const JobHistory: React.FC<JobHistoryProps> = ({ history, onEdit, onDelete }) => {
  if (history.length === 0) {
    return (
      <div className="p-8 rounded-2xl border border-white/5 bg-white/[0.02] text-center flex flex-col items-center gap-2 opacity-30">
        <span className="material-symbols-outlined text-3xl">history_toggle_off</span>
        <p className="text-[10px] text-white uppercase font-black tracking-widest">No Recent Activity</p>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Done':
      case 'Success': return 'bg-emerald-500 text-black shadow-[0_0_10px_rgba(16,185,129,0.3)]';
      case 'Failed': return 'bg-red-500 text-white shadow-[0_0_10px_rgba(239,68,68,0.3)]';
      case 'Pending': return 'bg-blue-500 text-white shadow-[0_0_10px_rgba(59,130,246,0.3)]';
      default: return 'bg-white/10 text-white';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Done':
      case 'Success': return 'check_circle';
      case 'Failed': return 'error';
      case 'Pending': return 'schedule';
      default: return 'help';
    }
  };

  return (
    <div className="flex flex-col gap-3 max-h-[500px] overflow-y-auto pr-2 dark-scrollbar">
      {history.map((record) => (
        <div 
          key={record.id} 
          className="group relative p-4 rounded-2xl border border-white/5 bg-white/[0.03] hover:bg-white/[0.07] hover:border-white/10 transition-all flex flex-col gap-3 shadow-lg"
        >
          <div className="flex justify-between items-start">
             <div className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-[1px] flex items-center gap-1.5 ${getStatusColor(record.status)}`}>
                <span className="material-symbols-outlined text-[11px] leading-none">{getStatusIcon(record.status)}</span>
                {record.status}
             </div>
             <span className="text-[9px] text-white/20 font-black tracking-widest font-mono">
               {new Date(record.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
             </span>
          </div>

          <div className="flex flex-col gap-1 min-w-0 pr-12">
             <h4 className="text-[11px] font-black text-white uppercase tracking-tight truncate leading-tight">
               {record.name}
             </h4>
             <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[14px] text-white/30">
                  {record.opMode === 'standard' ? 'splitscreen' : 'account_tree'}
                </span>
                <span className="text-[8px] text-white/30 font-black uppercase tracking-[2px]">{record.opMode}</span>
             </div>
          </div>

          <div className="absolute right-3 bottom-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
             <button onClick={() => onEdit(record)} className="w-8 h-8 flex items-center justify-center bg-emerald-500 text-black rounded-lg shadow-lg hover:scale-110 active:scale-95 transition-all"><span className="material-symbols-outlined text-[18px] font-black">edit</span></button>
             <button onClick={() => onDelete(record.id)} className="w-8 h-8 flex items-center justify-center bg-black/40 text-white/40 hover:text-red-500 rounded-lg transition-all border border-white/5"><span className="material-symbols-outlined text-[18px]">delete</span></button>
          </div>
        </div>
      ))}
    </div>
  );
};