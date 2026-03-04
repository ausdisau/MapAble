import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { registerObjectStorageRoutes } from "./replit_integrations/object_storage";
import {
  insertBookingSchema,
  insertJobSchema,
  insertTransportRequestSchema,
  insertMessageSchema,
} from "@shared/schema";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  registerObjectStorageRoutes(app);

  app.get("/api/me", async (_req, res) => {
    const user = await storage.getUserByRole("participant");
    if (!user) return res.status(404).json({ message: "No user found" });
    const { password, ...safeUser } = user;
    res.json(safeUser);
  });

  app.get("/api/workers", async (_req, res) => {
    const workers = await storage.getWorkers();
    res.json(workers);
  });

  app.get("/api/workers/:id", async (req, res) => {
    const worker = await storage.getWorker(req.params.id);
    if (!worker) return res.status(404).json({ message: "Worker not found" });
    res.json(worker);
  });

  app.get("/api/bookings", async (_req, res) => {
    const bookings = await storage.getBookings();
    res.json(bookings);
  });

  app.post("/api/bookings", async (req, res) => {
    const parsed = insertBookingSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.message });
    const booking = await storage.createBooking(parsed.data);
    res.status(201).json(booking);
  });

  app.get("/api/jobs", async (_req, res) => {
    const jobs = await storage.getJobs();
    res.json(jobs);
  });

  app.get("/api/jobs/:id", async (req, res) => {
    const job = await storage.getJob(req.params.id);
    if (!job) return res.status(404).json({ message: "Job not found" });
    res.json(job);
  });

  app.post("/api/jobs", async (req, res) => {
    const parsed = insertJobSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.message });
    const job = await storage.createJob(parsed.data);
    res.status(201).json(job);
  });

  app.get("/api/transport", async (_req, res) => {
    const requests = await storage.getTransportRequests();
    res.json(requests);
  });

  app.post("/api/transport", async (req, res) => {
    const parsed = insertTransportRequestSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.message });
    const request = await storage.createTransportRequest(parsed.data);
    res.status(201).json(request);
  });

  app.get("/api/messages", async (_req, res) => {
    const messages = await storage.getMessages();
    res.json(messages);
  });

  app.post("/api/messages", async (req, res) => {
    const parsed = insertMessageSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.message });
    const message = await storage.createMessage(parsed.data);
    res.status(201).json(message);
  });

  app.patch("/api/workers/:id/photo", async (req, res) => {
    const { photo } = req.body;
    if (!photo) return res.status(400).json({ message: "photo path required" });
    const worker = await storage.updateWorkerPhoto(req.params.id, photo);
    if (!worker) return res.status(404).json({ message: "Worker not found" });
    res.json(worker);
  });

  app.patch("/api/users/:id/avatar", async (req, res) => {
    const { avatar } = req.body;
    if (!avatar) return res.status(400).json({ message: "avatar path required" });
    const user = await storage.updateUserAvatar(req.params.id, avatar);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  });

  return httpServer;
}
