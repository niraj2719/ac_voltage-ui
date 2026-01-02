
import React from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { SensorData } from '../types';

interface OscilloscopeProps {
  data: SensorData[];
}

const Oscilloscope: React.FC<OscilloscopeProps> = ({ data }) => {
  return (
    <div className="h-64 w-full glass rounded-xl p-4 overflow-hidden">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-semibold text-blue-400 uppercase tracking-wider">
          <i className="fas fa-chart-line mr-2"></i> RMS Voltage Trend
        </h3>
        <span className="text-xs text-slate-400">Historical Stability (V)</span>
      </div>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorRms" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
          <XAxis 
            dataKey="timestamp" 
            hide 
          />
          <YAxis 
            domain={['auto', 'auto']} 
            stroke="#94a3b8" 
            fontSize={10}
            tickFormatter={(val) => `${Math.round(val)}V`}
          />
          <Tooltip 
            contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }}
            itemStyle={{ color: '#60a5fa' }}
            labelFormatter={(label) => new Date(label).toLocaleTimeString()}
          />
          <Area 
            type="monotone" 
            dataKey="rms" 
            stroke="#3b82f6" 
            fillOpacity={1} 
            fill="url(#colorRms)" 
            strokeWidth={2}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default Oscilloscope;
