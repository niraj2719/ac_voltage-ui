
import React, { useState, useEffect, useRef } from 'react';
import { SensorData, ConnectionStatus, AppConfig, CalibrationStats, ChatMessage } from './types';
import Oscilloscope from './components/Oscilloscope';
import Gauge from './components/Gauge';
import HardwareGuide from './components/HardwareGuide';
import FirmwareModal from './components/FirmwareModal';
import { getTechnicalAdvice } from './services/geminiService';

const App: React.FC = () => {
  const [dataHistory, setDataHistory] = useState<SensorData[]>([]);
  const [status, setStatus] = useState<ConnectionStatus>(ConnectionStatus.DISCONNECTED);
  const [showFirmware, setShowFirmware] = useState(false);
  const [config, setConfig] = useState<AppConfig>({
    multiplier: 1.0,
    baudRate: 9600 
  });
  const [stats, setStats] = useState<CalibrationStats>({
    rms: 0,
    vpeak: 0,
    peakToPeak: 0,
    freq: 0,
    current: 0,
    power: 0
  });
  
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
    { role: 'model', text: 'System ready! I\'ve updated the UI to support Current and Power measurement based on your SCT-013 sensor. Check the Firmware section for the JSON-optimized code.' }
  ]);
  const [userInput, setUserInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const portRef = useRef<any>(null);
  const readerRef = useRef<any>(null);
  const keepReadingRef = useRef<boolean>(false);

  const handleConnect = async () => {
    if (!('serial' in navigator)) {
      alert('Web Serial API is not supported in this browser.');
      return;
    }

    try {
      setStatus(ConnectionStatus.CONNECTING);
      const port = await (navigator as any).serial.requestPort();
      await port.open({ baudRate: config.baudRate });
      portRef.current = port;
      setStatus(ConnectionStatus.CONNECTED);
      readLoop();
    } catch (err) {
      console.error(err);
      setStatus(ConnectionStatus.ERROR);
      setTimeout(() => setStatus(ConnectionStatus.DISCONNECTED), 3000);
    }
  };

  const handleDisconnect = async () => {
    keepReadingRef.current = false;
    if (readerRef.current) {
      try {
        await readerRef.current.cancel();
      } catch (e) {
        console.warn("Reader cancel error:", e);
      }
    }
  };

  const readLoop = async () => {
    keepReadingRef.current = true;
    let reader;
    let readableStreamClosed;

    try {
      const textDecoder = new TextDecoderStream();
      readableStreamClosed = portRef.current.readable.pipeTo(textDecoder.writable);
      reader = textDecoder.readable.getReader();
      readerRef.current = reader;

      let buffer = '';

      while (keepReadingRef.current) {
        const { value, done } = await reader.read();
        if (done) break;
        
        buffer += value;
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
            try {
              const parsed = JSON.parse(trimmed);
              processIncomingData(parsed);
            } catch (e) {
              console.warn("JSON Parse Error:", trimmed);
            }
          }
        }
      }
    } catch (err) {
      console.error("Serial error:", err);
      setStatus(ConnectionStatus.ERROR);
    } finally {
      if (reader) {
        try { reader.releaseLock(); } catch (e) {}
      }
      if (readableStreamClosed) {
        await readableStreamClosed.catch(() => {});
      }
      if (portRef.current) {
        try { await portRef.current.close(); } catch (e) {}
        portRef.current = null;
      }
      readerRef.current = null;
      setStatus(ConnectionStatus.DISCONNECTED);
    }
  };

  const processIncomingData = (raw: any) => {
    // Support keys from standard and updated user sketches
    const rawRMS = raw.v ?? raw.voltage ?? raw.rms ?? 0;
    const rawCurrent = raw.i ?? raw.current ?? 0;
    const rawFreq = raw.f ?? raw.freq ?? 0;
    const rawPeak = raw.vp ?? (rawRMS * 1.4142);
    
    const calibratedRMS = rawRMS * config.multiplier;
    const calibratedPeak = rawPeak * config.multiplier;
    const currentFreq = rawFreq;
    const currentAmps = rawCurrent;
    const powerWatts = calibratedRMS * currentAmps;

    const newData: SensorData = {
      timestamp: Date.now(),
      rms: calibratedRMS,
      vpeak: calibratedPeak,
      freq: currentFreq,
      current: currentAmps,
      power: powerWatts
    };

    setStats({
      rms: calibratedRMS,
      vpeak: calibratedPeak,
      peakToPeak: calibratedPeak * 2,
      freq: currentFreq,
      current: currentAmps,
      power: powerWatts
    });

    setDataHistory(prev => {
      const next = [...prev, newData];
      return next.slice(-100);
    });
  };

  const handleSendMessage = async () => {
    if (!userInput.trim()) return;
    const userMsg: ChatMessage = { role: 'user', text: userInput };
    setChatHistory(prev => [...prev, userMsg]);
    setUserInput('');
    setIsTyping(true);

    try {
      const advice = await getTechnicalAdvice(userInput, { 
        stats, 
        hardware: { divider: "200k/10k", bias: "2.5V", currentSensor: "SCT-013" }
      });
      setChatHistory(prev => [...prev, { role: 'model', text: advice }]);
    } catch (error) {
      setChatHistory(prev => [...prev, { role: 'model', text: 'AI context sync failed.' }]);
    } finally {
      setIsTyping(false);
    }
  };

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [chatHistory]);

  return (
    <div className="min-h-screen flex flex-col p-4 md:p-8 space-y-6">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-white flex items-center gap-3">
            <span className="bg-blue-600 p-2 rounded-lg shadow-lg shadow-blue-500/20"><i className="fas fa-bolt"></i></span>
            VoltSense <span className="text-blue-500">Pro+</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">Voltage, Current & Power Analyzer</p>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowFirmware(true)}
            className="px-4 py-2 rounded-lg text-xs font-bold bg-slate-800 text-blue-400 border border-blue-500/30 hover:bg-blue-500/10 transition-all flex items-center gap-2"
          >
            <i className="fas fa-code"></i> Get Firmware
          </button>

          <div className={`px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 ${
            status === ConnectionStatus.CONNECTED ? 'bg-green-500/20 text-green-400 border border-green-500/50' : 
            status === ConnectionStatus.CONNECTING ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50' :
            'bg-slate-800 text-slate-400 border border-slate-700'
          }`}>
            <span className={`w-2 h-2 rounded-full ${status === ConnectionStatus.CONNECTED ? 'bg-green-400 animate-pulse' : status === ConnectionStatus.CONNECTING ? 'bg-yellow-400 animate-bounce' : 'bg-slate-500'}`}></span>
            {status}
          </div>
          
          <button 
            onClick={status === ConnectionStatus.CONNECTED ? handleDisconnect : handleConnect}
            className={`${status === ConnectionStatus.CONNECTED ? 'bg-red-500/20 text-red-400 border-red-500/50' : 'bg-blue-600 text-white glow-blue'} px-6 py-2 rounded-lg font-bold transition-all flex items-center gap-2 border shadow-lg`}
          >
            <i className={`fas ${status === ConnectionStatus.CONNECTED ? 'fa-unlink' : 'fa-link'}`}></i>
            {status === ConnectionStatus.CONNECTED ? 'Disconnect' : 'Connect'}
          </button>
        </div>
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
            <Gauge value={stats.power} label="Real Power" unit="Watts" max={3000} color="text-yellow-400" />
            <div className="grid grid-cols-2 gap-4">
              <div className="glass p-4 rounded-xl text-center">
                <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Voltage</p>
                <p className="text-xl font-black text-blue-400">{stats.rms.toFixed(1)}V</p>
              </div>
              <div className="glass p-4 rounded-xl text-center">
                <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Current</p>
                <p className="text-xl font-black text-green-400">{stats.current.toFixed(2)}A</p>
              </div>
            </div>
            <Gauge value={stats.freq} label="Frequency" unit="Hz" min={45} max={65} color="text-green-500" />
          </div>

          <div className="glass rounded-xl p-6">
            <div className="flex justify-between items-center mb-4">
               <label className="text-xs text-slate-500 uppercase font-bold">Calibration</label>
               <div className="flex gap-2">
                 <button onClick={() => setConfig(prev => ({...prev, baudRate: 9600}))} className={`text-[10px] px-2 py-1 rounded transition-colors ${config.baudRate === 9600 ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-800 text-slate-400 hover:text-slate-200'}`}>9600</button>
                 <button onClick={() => setConfig(prev => ({...prev, baudRate: 115200}))} className={`text-[10px] px-2 py-1 rounded transition-colors ${config.baudRate === 115200 ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-800 text-slate-400 hover:text-slate-200'}`}>115200</button>
               </div>
            </div>
            <input 
              type="range" min="0.8" max="1.2" step="0.001" 
              value={config.multiplier} 
              onChange={(e) => setConfig({...config, multiplier: parseFloat(e.target.value)})}
              className="w-full accent-blue-500 mb-2 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] mono text-slate-400">
               <span>V-Factor: {config.multiplier.toFixed(3)}</span>
               <span>Baud: {config.baudRate}</span>
            </div>
          </div>
        </div>

        <div className="lg:col-span-8 space-y-6">
          <Oscilloscope data={dataHistory} />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="glass rounded-xl flex flex-col h-[450px]">
              <div className="p-4 border-b border-slate-700 bg-slate-800/30 flex justify-between items-center">
                <h3 className="text-sm font-bold text-blue-400 uppercase tracking-widest">AI Expert Assistant</h3>
                <i className="fas fa-robot text-blue-500 opacity-50"></i>
              </div>
              <div ref={scrollRef} className="flex-grow overflow-y-auto p-4 space-y-4">
                {chatHistory.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] p-3 rounded-xl text-sm shadow-lg ${msg.role === 'user' ? 'bg-blue-600' : 'bg-slate-800 border border-slate-700 text-slate-200'}`}>
                      {msg.text}
                    </div>
                  </div>
                ))}
                {isTyping && <div className="text-xs text-slate-500 animate-pulse pl-4 italic">Gemini is analyzing load behavior...</div>}
              </div>
              <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="p-4 flex gap-2 border-t border-slate-700/50">
                <input 
                  type="text" value={userInput} onChange={(e) => setUserInput(e.target.value)}
                  placeholder="Ask about power factor or circuit noise..."
                  className="flex-grow bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm focus:ring-1 focus:ring-blue-500 outline-none"
                />
                <button type="submit" className="bg-blue-600 px-4 rounded transition-colors hover:bg-blue-700">
                  <i className="fas fa-paper-plane"></i>
                </button>
              </form>
            </div>

            <div className="space-y-4">
              <div className="glass rounded-xl p-5 border-t-4 border-yellow-500">
                 <h3 className="text-xs font-bold text-slate-400 uppercase mb-4">Load Diagnostics</h3>
                 <div className="space-y-4">
                    <div className="flex justify-between items-end border-b border-slate-800 pb-2">
                       <span className="text-[11px] text-slate-500">Estimated Load</span>
                       <span className="mono text-2xl text-yellow-400 font-bold">{stats.power.toFixed(0)} W</span>
                    </div>
                    <div className="flex justify-between items-end border-b border-slate-800 pb-2">
                       <span className="text-[11px] text-slate-500">Peak Current</span>
                       <span className="mono text-sm text-slate-300">{(stats.current * 1.414).toFixed(3)} A</span>
                    </div>
                    <div className="p-3 bg-blue-500/5 rounded text-[10px] text-blue-200/70 italic leading-relaxed">
                      Info: The power calculation assumes a Unity Power Factor (purely resistive load). Use Gemini for help with Reactive loads.
                    </div>
                 </div>
              </div>
              <HardwareGuide />
            </div>
          </div>
        </div>
      </main>

      <FirmwareModal isOpen={showFirmware} onClose={() => setShowFirmware(false)} />
    </div>
  );
};

export default App;
