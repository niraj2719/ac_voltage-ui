
import React from 'react';

interface FirmwareModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const FirmwareModal: React.FC<FirmwareModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const code = `/************ AC Voltage + Frequency Analyzer ************/
// Optimized for VoltSense Pro GUI
#define AC_PIN A0

const float VREF = 5.0;
const int ADC_RES = 1023;

// 🔧 CALIBRATION: Adjust this to match your physical meter
float CAL_FACTOR = 153.3;   // Example for 230V step-down

// Global to capture peak from the RMS sampling loop
float lastVPeak = 0;

void setup() {
  Serial.begin(115200); // 115200 is recommended for responsive UI
}

void loop() {
  float vrms_sensor = measureRMS();
  float vrms_actual = vrms_sensor * CAL_FACTOR;
  float vpeak_actual = lastVPeak * CAL_FACTOR;
  float freq = measureFrequency();

  // Send JSON string to GUI
  Serial.print("{\\"rms\\":");
  Serial.print(vrms_actual, 1);
  Serial.print(",\\"vpeak\\":");
  Serial.print(vpeak_actual, 1);
  Serial.print(",\\"freq\\":");
  Serial.print(freq, 1);
  Serial.println("}");

  delay(200); // UI Refresh Interval
}

/************ RMS + PEAK MEASUREMENT ************/
float measureRMS() {
  unsigned long t0 = millis();
  float sum = 0, sumSq = 0;
  int n = 0;
  float maxRaw = 0;

  while (millis() - t0 < 100) {   // Sample 5 cycles @50Hz
    float rawADC = analogRead(AC_PIN);
    float v = rawADC * VREF / ADC_RES;
    
    sum += v;
    sumSq += v * v;
    
    // Track max for peak calculation
    if (v > maxRaw) maxRaw = v;
    
    n++;
  }

  float mean = sum / n; // Auto DC Offset Removal
  lastVPeak = (maxRaw - mean); // Peak voltage relative to bias
  
  return sqrt((sumSq / n) - (mean * mean));
}

/************ FREQUENCY MEASUREMENT ************/
float measureFrequency() {
  const int crossings = 10;   // More = more stable
  int count = 0;
  bool lastState = false;
  unsigned long tStart = 0, tEnd = 0;

  // Use a timeout to prevent infinite loops if signal is missing
  unsigned long timeout = millis();

  while (count < crossings && (millis() - timeout < 500)) {
    float v = analogRead(AC_PIN) * VREF / ADC_RES;
    bool state = (v > 2.5);   // Mid-level crossing (Assuming 2.5V bias)

    if (state && !lastState) {
      if (count == 0) tStart = micros();
      count++;
      if (count == crossings) tEnd = micros();
    }
    lastState = state;
  }

  if (count < crossings) return 0.0; // No signal detected

  float period_us = (tEnd - tStart) / (float)(crossings - 1);
  return 1000000.0 / period_us;
}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(code);
    alert("Code copied to clipboard!");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="glass w-full max-w-3xl rounded-2xl flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-slate-700 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-white">Arduino Firmware</h2>
            <p className="text-xs text-slate-400">Integrated your logic with GUI enhancements</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <i className="fas fa-times text-xl"></i>
          </button>
        </div>
        
        <div className="flex-grow overflow-auto p-6 bg-slate-950 font-mono text-sm">
          <pre className="text-blue-300">
            {code}
          </pre>
        </div>

        <div className="p-6 border-t border-slate-700 flex justify-end gap-3">
          <button 
            onClick={copyToClipboard}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-bold transition-all flex items-center gap-2"
          >
            <i className="fas fa-copy"></i> Copy Code
          </button>
          <button 
            onClick={onClose}
            className="bg-slate-800 text-white px-6 py-2 rounded-lg font-bold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default FirmwareModal;
