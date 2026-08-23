import { GoogleGenAI, Modality } from '@google/genai';
const ai = new GoogleGenAI({ apiKey: 'AQ.Ab8RN6I-31imDZ8IVCwXuJX-8Keo19hnnACndIV1b8bmZWAauA' });
const p = ai.live.connect({
  model: 'gemini-3.1-flash-live-preview',
  config: { responseModalities: [Modality.AUDIO] },
  callbacks: {
    onopen: () => { console.log('OPEN'); },
    onmessage: (m) => { console.log('MSG', m); },
    onclose: (e) => { console.log('CLOSE', e.reason); }
  }
});
