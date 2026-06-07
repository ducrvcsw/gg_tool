import React from 'react';
import { ProductionMode } from '../App';

const allSteps = [
  { id: 'brief', icon: 'description', label: 'Deep Dive' },
  { id: 'analysis', icon: 'search', label: 'Insights' },
  { id: 'concepts', icon: 'category', label: 'Concepts' },
  { id: 'config', icon: 'tune', label: 'Options' },
  { id: 'script', icon: 'movie_edit', label: 'Script' },
  { id: 'voice', icon: 'mic', label: 'Voice' },
  { id: 'visuals', icon: 'photo_camera', label: 'Visuals' },
  { id: 'video', icon: 'videocam', label: 'Video Gen' },
  { id: 'export', icon: 'check_circle', label: 'Export' },
];

interface WorkflowStepperProps {
  currentStep: number;
  maxReachedStep: number;
  onStepClick: (step: number) => void;
  productionMode: ProductionMode;
}

export const WorkflowStepper: React.FC<WorkflowStepperProps> = ({ currentStep, maxReachedStep, onStepClick, productionMode }) => {
  const steps = allSteps.filter(s => {
    if (productionMode === 'no_voice' && s.id === 'voice') return false;
    return true;
  });

  const getAbsoluteIdx = (visualIdx: number) => {
    const stepId = steps[visualIdx].id;
    return allSteps.findIndex(s => s.id === stepId) + 1; // +1 vì step 0 là Setup
  };

  return (
    <div className="flex flex-col gap-5 pl-2">
      {steps.map((step, visualIdx) => {
        const absoluteIdx = getAbsoluteIdx(visualIdx);
        const isCompleted = absoluteIdx < currentStep;
        const isActive = absoluteIdx === currentStep;
        const canJump = absoluteIdx <= maxReachedStep;

        return (
          <button 
            key={visualIdx} 
            onClick={() => onStepClick(absoluteIdx)}
            disabled={!canJump}
            className={`flex items-center gap-4 text-left transition-all ${canJump ? 'cursor-pointer' : 'cursor-not-allowed opacity-40'}`}
          >
            <div className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
              isActive ? 'bg-white text-black font-bold shadow-lg scale-110' : 
              isCompleted ? 'bg-emerald-500 text-black border border-emerald-500/20' : 
              'bg-white/10 text-white/40 border border-white/5'
            }`}>
              <span className="material-symbols-outlined text-[14px]">
                {isCompleted ? 'check' : step.icon}
              </span>
            </div>
            <p className={`text-[10px] font-black tracking-widest uppercase ${isActive ? 'text-white' : isCompleted ? 'text-white/80' : 'text-white/40'}`}>
              {step.label}
            </p>
          </button>
        );
      })}
    </div>
  );
};