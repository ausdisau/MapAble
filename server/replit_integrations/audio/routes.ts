import express, { type Express, type Request, type Response } from "express";
import { chatStorage } from "../chat/storage";
import { processChat } from "../../chat/engine";
import { speechToText, ensureCompatibleFormat, textToSpeechStream } from "./client";

type TtsVoice = "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer";
const ALLOWED_VOICES: TtsVoice[] = ["alloy", "echo", "fable", "onyx", "nova", "shimmer"];

// Body parser with 50MB limit for audio payloads
const audioBodyParser = express.json({ limit: "50mb" });

export function registerAudioRoutes(app: Express): void {
  // Get all conversations
  app.get("/api/conversations", async (req: Request, res: Response) => {
    try {
      const conversations = await chatStorage.getAllConversations();
      res.json(conversations);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      res.status(500).json({ error: "Failed to fetch conversations" });
    }
  });

  // Get single conversation with messages
  app.get("/api/conversations/:id", async (req: Request, res: Response) => {
    try {
      const id = String(req.params.id);
      const conversation = await chatStorage.getConversation(id);
      if (!conversation) {
        return res.status(404).json({ error: "Conversation not found" });
      }
      const messages = await chatStorage.getMessagesByConversation(id);
      res.json({ ...conversation, messages });
    } catch (error) {
      console.error("Error fetching conversation:", error);
      res.status(500).json({ error: "Failed to fetch conversation" });
    }
  });

  // Create new conversation
  app.post("/api/conversations", async (req: Request, res: Response) => {
    try {
      const { title } = req.body;
      const conversation = await chatStorage.createConversation(title || "New Chat");
      res.status(201).json(conversation);
    } catch (error) {
      console.error("Error creating conversation:", error);
      res.status(500).json({ error: "Failed to create conversation" });
    }
  });

  // Delete conversation
  app.delete("/api/conversations/:id", async (req: Request, res: Response) => {
    try {
      const id = String(req.params.id);
      await chatStorage.deleteConversation(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting conversation:", error);
      res.status(500).json({ error: "Failed to delete conversation" });
    }
  });

  // Send voice message and get a streaming audio response.
  // Auto-detects audio format and converts WebM/MP4/OGG to WAV.
  // Spoken chat runs through the SAME guardrail, safeguarding, refusal and audit
  // stack as text chat: the transcript is processed by `processChat`, which runs
  // the input classifier + required safeguarding actions, applies output
  // guardrails, persists the turn and writes a policy-pack-stamped audit log.
  // Audio is synthesised only AFTER the response text has been guardrail-approved,
  // so an unsafe response can never be spoken back to the user.
  app.post("/api/conversations/:id/messages", audioBodyParser, async (req: Request, res: Response) => {
    try {
      const conversationId = String(req.params.id);
      const { audio } = req.body;
      const requestedVoice = req.body.voice;
      const voice: TtsVoice = ALLOWED_VOICES.includes(requestedVoice) ? requestedVoice : "alloy";

      if (!audio) {
        return res.status(400).json({ error: "Audio data (base64) is required" });
      }

      const conversation = await chatStorage.getConversation(conversationId);
      if (!conversation) {
        return res.status(404).json({ error: "Conversation not found" });
      }

      // 1. Auto-detect format and convert to OpenAI-compatible format
      const rawBuffer = Buffer.from(audio, "base64");
      const { buffer: audioBuffer, format: inputFormat } = await ensureCompatibleFormat(rawBuffer);

      // 2. Transcribe user audio
      const userTranscript = await speechToText(audioBuffer, inputFormat);

      // 3. Set up SSE
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      res.write(`data: ${JSON.stringify({ type: "user_transcript", data: userTranscript })}\n\n`);

      // 4. Run the transcript through the shared MapAble Chat guardrail engine.
      //    processChat persists the user + assistant messages, runs the input
      //    classifier and safeguarding actions, applies output guardrails and
      //    writes a voice-channel audit log (transcript, guardrail actions,
      //    policy pack version). The returned content is already guardrail-safe.
      const result = await processChat(conversationId, conversation.userId, userTranscript, undefined, "voice");
      const safeText = result.content;

      // 5. Emit the guardrail-approved transcript, then synthesise its speech.
      res.write(`data: ${JSON.stringify({ type: "transcript", data: safeText })}\n\n`);

      const audioStream = await textToSpeechStream(safeText, voice);
      for await (const audioChunk of audioStream) {
        res.write(`data: ${JSON.stringify({ type: "audio", data: audioChunk })}\n\n`);
      }

      res.write(`data: ${JSON.stringify({ type: "done", transcript: safeText, warnings: result.warnings, toolsUsed: result.toolsUsed })}\n\n`);
      res.end();
    } catch (error) {
      console.error("Error processing voice message:", error);
      if (res.headersSent) {
        res.write(`data: ${JSON.stringify({ type: "error", error: "Failed to process voice message" })}\n\n`);
        res.end();
      } else {
        res.status(500).json({ error: "Failed to process voice message" });
      }
    }
  });
}
