
import React from 'react';

interface FirmwareModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const FirmwareModal: React.FC<FirmwareModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const code = `/************************************************
 * VoltSense Pro+ - AC Voltage & Current Monitor
 * Voltage : A0 (scaled + biased at 2.5V)
 * Current : A1 (SCT-013 + Burden Resistor)
 ************************************************/

#define VOLT_PIN A0
#define CURR_PIN A1

const float VREF = 5.0;
const int ADC_RES = 1023;

// -------- Calibration Settings --------
float VOLT_CAL = 153.3;  // Adjust to match your multimeter
float CURR_CAL = 1.00;   // Fine calibration factor
const float BURDEN = 33.0;     // Ohms (Standard for SCT-013-000)
const float CT_RATIO = 2000.0; // 100A / 0.05A turns ratio

void setup() {
  Serial.begin(9600); // GUI matches this by default
}

void loop() {
  unsigned long t0 = millis();
  float v_sum = 0, v_sumSq = 0;
  float i_sum = 0, i_sumSq = 0;
  int samples = 0;

  // Frequency variables
  int count = 0;
  bool lastState = false;
  unsigned long tStart = 0, tEnd = 0;

  // Sample for 100ms (~5-6 full cycles)
  while (millis() - t0 < 100) {
    float v_adc = analogRead(VOLT_PIN) * VREF / ADC_RES;
    float i_adc = analogRead(CURR_PIN) * VREF / ADC_RES;

    v_sum += v_adc;
    v_sumSq += v_adc * v_adc;

    i_sum += i_adc;
    i_sumSq += i_adc * i_adc;

    // Zero-crossing for frequency
    bool state = (v_adc > 2.5);
    if (state && !lastState) {
      if (count == 0) tStart = micros();
      count++;
      if (count == 10) tEnd = micros();
    }
    lastState = state;

    samples++;
  }

  // Calculate Offset (Mean)
  float v_mean = v_sum / samples;
  float i_mean = i_sum / samples;

  // Calculate RMS (Sensor Level)
  float v_rms_s = sqrt((v_sumSq / samples) - (v_mean * v_mean));
  float i_rms_s = sqrt((i_sumSq / samples) - (i_mean * i_mean));

  // Convert to Real Values
  float voltage = v_rms_s * VOLT_CAL;
  float current = (i_rms_s / BURDEN) * CT_RATIO * CURR_CAL;
  
  // Frequency Calculation
  float freq = 0;
  if (count >= 10 && tEnd > tStart) {
    freq = 1000000.0 * 9.0 / (tEnd - tStart);
  }

  // -------- Output JSON to GUI --------
  Serial.print("{\\"v\\":");
  Serial.print(voltage, 1);
  Serial.print(",\\"i\\":");
  Serial.print(current, 3);
  Serial.print(",\\"f\\":");
  Serial.print(freq, 1);
  Serial.println("}");

  delay(400); // Smooth UI updates
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
            <p className="text-xs text-slate-400">JSON-enabled sketch with Current & Frequency support</p>
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
