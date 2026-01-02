
export interface SensorData {
  timestamp: number;
  rms: number;
  vpeak: number;
  freq: number;
}

export interface CalibrationStats {
  rms: number;
  vpeak: number;
  peakToPeak: number;
  freq: number;
}

export interface AppConfig {
  multiplier: number;
  baudRate: number;
}

export enum ConnectionStatus {
  DISCONNECTED = 'DISCONNECTED',
  CONNECTING = 'CONNECTING',
  CONNECTED = 'CONNECTED',
  ERROR = 'ERROR'
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}
