import type { Express, Request, Response } from "express";
import { chatStorage } from "./storage";
import { getUserSessions, processChat } from "../../chat-engine";
import { requireAuth } from "../../routes/shared";

export function registerChatRoutes(app: Express): void {
  // Get all conversations
  app.get("/api/conversations", requireAuth, async (req: Request, res: Response) => {
    try {
      const conversations = await chatStorage.getConversationsByUser(req.session.userId!);
      res.json(conversations);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      res.status(500).json({ error: "Failed to fetch conversations" });
    }
  });

  // Get single conversation with messages
  app.get("/api/conversations/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const id = String(req.params.id);
      const sessions = await getUserSessions(req.session.userId!);
      const owns = sessions.some((session) => session.id === id);
      if (!owns) {
        return res.status(403).json({ error: "Access denied" });
      }
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
  app.post("/api/conversations", requireAuth, async (req: Request, res: Response) => {
    try {
      const { title } = req.body;
      const conversation = await chatStorage.createConversation(title || "New Chat", req.session.userId!);
      res.status(201).json(conversation);
    } catch (error) {
      console.error("Error creating conversation:", error);
      res.status(500).json({ error: "Failed to create conversation" });
    }
  });

  // Delete conversation
  app.delete("/api/conversations/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const id = String(req.params.id);
      const sessions = await getUserSessions(req.session.userId!);
      const owns = sessions.some((session) => session.id === id);
      if (!owns) {
        return res.status(403).json({ error: "Access denied" });
      }
      await chatStorage.deleteConversation(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting conversation:", error);
      res.status(500).json({ error: "Failed to delete conversation" });
    }
  });

  // Send message and get AI response (streaming)
  app.post("/api/conversations/:id/messages", requireAuth, async (req: Request, res: Response) => {
    try {
      const conversationId = String(req.params.id);
      const { content } = req.body;
      const sessions = await getUserSessions(req.session.userId!);
      const owns = sessions.some((session) => session.id === conversationId);
      if (!owns) {
        return res.status(403).json({ error: "Access denied" });
      }

      const userId = req.session.userId!;
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      const response = await processChat(conversationId, userId, content);
      res.write(`data: ${JSON.stringify({ content: response.content })}\n\n`);

      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    } catch (error) {
      console.error("Error sending message:", error);
      // Check if headers already sent (SSE streaming started)
      if (res.headersSent) {
        res.write(`data: ${JSON.stringify({ error: "Failed to send message" })}\n\n`);
        res.end();
      } else {
        res.status(500).json({ error: "Failed to send message" });
      }
    }
  });
}

