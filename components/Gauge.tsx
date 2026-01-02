
import React from 'react';

interface GaugeProps {
  value: number;
  label: string;
  unit: string;
  min?: number;
  max?: number;
  color?: string;
}

const Gauge: React.FC<GaugeProps> = ({ value, label, unit, min = 0, max = 300, color = "text-blue-500" }) => {
  const percentage = Math.min(Math.max(((value - min) / (max - min)) * 100, 0), 100);
  const strokeDasharray = `${percentage}, 100`;

  return (
    <div className="flex flex-col items-center justify-center p-6 glass rounded-2xl relative overflow-hidden group">
      <div className="relative w-40 h-40">
        <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
          <path
            className="stroke-slate-800"
            strokeWidth="3"
            fill="none"
            d="M18 2.0845
              a 15.9155 15.9155 0 0 1 0 31.831
              a 15.9155 15.9155 0 0 1 0 -31.831"
          />
          <path
            className={`${color} transition-all duration-500 ease-out`}
            strokeWidth="3"
            strokeDasharray={strokeDasharray}
            strokeLinecap="round"
            fill="none"
            d="M18 2.0845
              a 15.9155 15.9155 0 0 1 0 31.831
              a 15.9155 15.9155 0 0 1 0 -31.831"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-bold tracking-tighter">{value.toFixed(1)}</span>
          <span className="text-xs text-slate-400 uppercase font-medium">{unit}</span>
        </div>
      </div>
      <div className="mt-4 text-center">
        <p className="text-sm font-semibold text-slate-300 uppercase tracking-widest">{label}</p>
      </div>
      <div className={`absolute top-0 right-0 w-16 h-16 opacity-10 pointer-events-none transform translate-x-4 -translate-y-4`}>
          <i className="fas fa-bolt text-4xl"></i>
      </div>
    </div>
  );
};

export default Gauge;
