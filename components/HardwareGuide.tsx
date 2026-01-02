
import React from 'react';

const HardwareGuide: React.FC = () => {
  return (
    <div className="glass rounded-xl p-6 h-full border-l-4 border-yellow-500">
      <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
        <i className="fas fa-microchip text-yellow-500"></i>
        Hardware Interface Guide
      </h3>
      
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <div className="bg-yellow-500/20 text-yellow-500 p-2 rounded-lg text-xs font-bold">1</div>
          <div>
            <h4 className="font-semibold text-sm">Step-Down Transformer</h4>
            <p className="text-xs text-slate-400">Use a 230V/120V to 6V AC-AC transformer. <strong>NEVER</strong> connect AC mains directly to the Arduino.</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="bg-blue-500/20 text-blue-500 p-2 rounded-lg text-xs font-bold">2</div>
          <div>
            <h4 className="font-semibold text-sm">LM358 Signal Conditioning</h4>
            <p className="text-xs text-slate-400">The LM358 acts as a differential amplifier to offset the AC swing (typically biased to 2.5V) so the 0-5V ADC can read it.</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="bg-green-500/20 text-green-500 p-2 rounded-lg text-xs font-bold">3</div>
          <div>
            <h4 className="font-semibold text-sm">Arduino Nano Pinout</h4>
            <ul className="text-xs text-slate-400 list-disc ml-4 mt-1">
              <li>VCC (5V) -> LM358 VCC</li>
              <li>GND -> LM358 GND</li>
              <li>Analog Pin A0 -> LM358 Output</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
        <h5 className="text-red-400 text-xs font-bold uppercase mb-1">
          <i className="fas fa-triangle-exclamation mr-1"></i> Safety First
        </h5>
        <p className="text-[10px] text-red-300 leading-relaxed">
          High voltage AC can be fatal. Ensure all high-voltage connections are insulated. Always use a fuse in your primary circuit.
        </p>
      </div>
    </div>
  );
};

export default HardwareGuide;
