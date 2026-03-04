import {
  type User, type InsertUser,
  type Worker, type InsertWorker,
  type Booking, type InsertBooking,
  type Job, type InsertJob,
  type TransportRequest, type InsertTransportRequest,
  type Message, type InsertMessage,
  users, workers, bookings, jobs, transportRequests, messages,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByRole(role: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserAvatar(id: string, avatar: string): Promise<User | undefined>;
  getWorkers(): Promise<(Worker & { user?: User })[]>;
  getWorker(id: string): Promise<(Worker & { user?: User }) | undefined>;
  createWorker(worker: InsertWorker): Promise<Worker>;
  updateWorkerPhoto(id: string, photo: string): Promise<Worker | undefined>;
  getBookings(): Promise<Booking[]>;
  createBooking(booking: InsertBooking): Promise<Booking>;
  getJobs(): Promise<Job[]>;
  getJob(id: string): Promise<Job | undefined>;
  createJob(job: InsertJob): Promise<Job>;
  getTransportRequests(): Promise<TransportRequest[]>;
  createTransportRequest(req: InsertTransportRequest): Promise<TransportRequest>;
  getMessages(): Promise<Message[]>;
  createMessage(msg: InsertMessage): Promise<Message>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByRole(role: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.role, role));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUserAvatar(id: string, avatar: string): Promise<User | undefined> {
    const [user] = await db.update(users).set({ avatar }).where(eq(users.id, id)).returning();
    return user;
  }

  async getWorkers(): Promise<(Worker & { user?: User })[]> {
    const allWorkers = await db.select().from(workers);
    const result = await Promise.all(
      allWorkers.map(async (w) => {
        const user = await this.getUser(w.userId);
        return { ...w, user: user || undefined };
      })
    );
    return result;
  }

  async getWorker(id: string): Promise<(Worker & { user?: User }) | undefined> {
    const [worker] = await db.select().from(workers).where(eq(workers.id, id));
    if (!worker) return undefined;
    const user = await this.getUser(worker.userId);
    return { ...worker, user: user || undefined };
  }

  async createWorker(insertWorker: InsertWorker): Promise<Worker> {
    const [worker] = await db.insert(workers).values(insertWorker).returning();
    return worker;
  }

  async updateWorkerPhoto(id: string, photo: string): Promise<Worker | undefined> {
    const [worker] = await db.update(workers).set({ photo }).where(eq(workers.id, id)).returning();
    return worker;
  }

  async getBookings(): Promise<Booking[]> {
    return db.select().from(bookings);
  }

  async createBooking(insertBooking: InsertBooking): Promise<Booking> {
    const [booking] = await db.insert(bookings).values(insertBooking).returning();
    return booking;
  }

  async getJobs(): Promise<Job[]> {
    return db.select().from(jobs);
  }

  async getJob(id: string): Promise<Job | undefined> {
    const [job] = await db.select().from(jobs).where(eq(jobs.id, id));
    return job;
  }

  async createJob(insertJob: InsertJob): Promise<Job> {
    const [job] = await db.insert(jobs).values(insertJob).returning();
    return job;
  }

  async getTransportRequests(): Promise<TransportRequest[]> {
    return db.select().from(transportRequests);
  }

  async createTransportRequest(insertReq: InsertTransportRequest): Promise<TransportRequest> {
    const [req] = await db.insert(transportRequests).values(insertReq).returning();
    return req;
  }

  async getMessages(): Promise<Message[]> {
    return db.select().from(messages).orderBy(desc(messages.timestamp));
  }

  async createMessage(insertMsg: InsertMessage): Promise<Message> {
    const [msg] = await db.insert(messages).values(insertMsg).returning();
    return msg;
  }
}

export const storage = new DatabaseStorage();
