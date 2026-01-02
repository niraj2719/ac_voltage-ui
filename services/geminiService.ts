
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getTechnicalAdvice = async (prompt: string, context: any) => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `The user is building an AC voltage meter using an Arduino Nano and an LM358 op-amp. 
    Current Setup Context: ${JSON.stringify(context)}
    
    User Query: ${prompt}
    
    Provide technical, accurate, and safety-conscious advice. Focus on:
    1. Hardware safety (isolation, high voltage precautions).
    2. LM358 circuit configurations (differential amp, precision rectifier).
    3. Arduino code optimization for ADC sampling.
    4. Calibration math (RMS calculations).`,
    config: {
      temperature: 0.7,
      topK: 40,
      topP: 0.95,
    },
  });

  return response.text;
};

export const generateArduinoCode = async () => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: 'Generate a robust Arduino Nano sketch for reading AC voltage via an LM358 module. Include peak detection, RMS calculation, and 115,200 baud serial output of raw and processed values.',
  });
  return response.text;
};
