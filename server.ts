import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { WebSocketServer } from "ws";
import { GoogleGenAI, LiveServerMessage, Modality, Type } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Increase payload limit for base64 images
  app.use(express.json({ limit: '50mb' }));

  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY || process.env.API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });

  // API Routes
  app.post("/api/analyze-report", async (req, res) => {
    try {
      const { base64Data, prompt } = req.body;
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          {
            role: 'user',
            parts: [
              {
                inlineData: { data: base64Data, mimeType: 'image/jpeg' }
              },
              { text: prompt }
            ]
          }
        ]
      });
      res.json({ text: response.text });
    } catch (err: any) {
      console.error("Analysis Error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });

  const wss = new WebSocketServer({ server, path: '/live' });

  wss.on("connection", async (clientWs, req) => {
    const url = new URL(req.url!, `http://${req.headers.host}`);
    const loc = url.searchParams.get('loc') || "Not Available";

    try {
      const session = await ai.live.connect({
        model: "gemini-3.1-flash-live-preview",
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: `You are an emergency medical assistant. Start with "Hello, how can I help you?". Identify injuries via video/audio. Provide Red Cross instructions. If critical, use 'triggerEmergencyCall'. Coordinate: ${loc}.`,
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Kore" } },
          },
          tools: [{ functionDeclarations: [{
            name: 'triggerEmergencyCall',
            description: 'Trigger an emergency action on the user device, e.g., calling 911.',
            parameters: {
              type: Type.OBJECT,
              properties: {},
              required: []
            }
          }] }],
        },
        callbacks: {
          onmessage: (message: LiveServerMessage) => {
            const audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (audio) clientWs.send(JSON.stringify({ audio }));
            
            if (message.serverContent?.interrupted) {
              clientWs.send(JSON.stringify({ interrupted: true }));
            }
            
            if (message.serverContent?.outputTranscription?.text) {
              clientWs.send(JSON.stringify({ transcription: message.serverContent.outputTranscription.text, isUser: false }));
            }
            
            if (message.serverContent?.inputTranscription?.text) {
              clientWs.send(JSON.stringify({ transcription: message.serverContent.inputTranscription.text, isUser: true }));
            }
            
            if (message.toolCall && message.toolCall.functionCalls) {
              for (const fc of message.toolCall.functionCalls) {
                if (fc.name === 'triggerEmergencyCall') {
                  clientWs.send(JSON.stringify({ triggerEmergency: true }));
                  session.sendToolResponse({
                    functionResponses: {
                      id: fc.id,
                      name: fc.name,
                      response: { result: "ok" }
                    }
                  }).catch(() => {});
                }
              }
            }
          },
          onclose: (e: any) => {
            if (clientWs.readyState === clientWs.OPEN) {
              clientWs.send(JSON.stringify({ closed: true, reason: e?.reason || 'Live API closed' }));
              clientWs.close();
            }
          },
          onerror: (err: any) => {
            if (clientWs.readyState === clientWs.OPEN) {
              clientWs.send(JSON.stringify({ error: err?.message || 'Error from Live API' }));
              clientWs.close();
            }
          }
        }
      });

      clientWs.on("message", (data) => {
        try {
          const msg = JSON.parse(data.toString());
          if (msg.audio) {
            session.sendRealtimeInput({
              audio: { data: msg.audio, mimeType: "audio/pcm;rate=16000" }
            }).catch(() => {});
          }
          if (msg.video) {
            session.sendRealtimeInput({
              media: { data: msg.video, mimeType: "image/jpeg" }
            }).catch(() => {});
          }
        } catch (e) {}
      });

      clientWs.on("close", () => {
         // Client closed connection
      });

      clientWs.send(JSON.stringify({ connected: true }));

    } catch (err: any) {
      if (clientWs.readyState === clientWs.OPEN) {
        clientWs.send(JSON.stringify({ error: err.message }));
        clientWs.close();
      }
    }
  });
}

startServer();
