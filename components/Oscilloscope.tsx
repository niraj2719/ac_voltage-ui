
import React from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { SensorData } from '../types';

interface OscilloscopeProps {
  data: SensorData[];
}

const Oscilloscope: React.FC<OscilloscopeProps> = ({ data }) => {
  return (
    <div className="h-72 w-full glass rounded-xl p-4 overflow-hidden border border-white/5">
      <div className="flex justify-between items-center mb-4 px-2">
        <h3 className="text-sm font-semibold text-yellow-500 uppercase tracking-wider">
          <i className="fas fa-plug mr-2"></i> Power Consumption Trend
        </h3>
        <span className="text-[10px] text-slate-500 font-mono">Real-time Watts</span>
      </div>
      <ResponsiveContainer width="100%" height="85%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorPower" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#eab308" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#eab308" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
          <XAxis 
            dataKey="timestamp" 
            hide 
          />
          <YAxis 
            domain={[0, 'auto']} 
            stroke="#475569" 
            fontSize={9}
            tickFormatter={(val) => `${val}W`}
            width={40}
          />
          <Tooltip 
            contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', fontSize: '11px' }}
            itemStyle={{ color: '#eab308' }}
            labelFormatter={(label) => new Date(label).toLocaleTimeString()}
          />
          <Area 
            type="monotone" 
            dataKey="power" 
            stroke="#eab308" 
            fillOpacity={1} 
            fill="url(#colorPower)" 
            strokeWidth={2}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default Oscilloscope;
