import type { Request, Response, NextFunction } from "express";
  import { z } from "zod";
  import { storage } from "../storage";
  import { createOrbCustomer, createOrbSubscription, orbEnabled } from "../orb";

  export const patchUserSchema = z.object({
    fullName: z.string().min(1).max(200).optional(),
    email: z.string().email().max(200).optional(),
    location: z.string().max(200).optional(),
  });

  export async function getWorkerIdForUser(userId: string): Promise<string | null> {
    const worker = await storage.getWorkerByUserId(userId);
    return worker?.id || null;
  }

  export function requireAuth(req: Request, res: Response, next: NextFunction) {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    next();
  }

  export function sanitizeUser(user: Record<string, any>) {
    const { password, qbAccessToken, qbRefreshToken, qbTokenExpiresAt, ...safe } = user;
    return safe;
  }

  export async function provisionOrbBilling(user: { id: string; fullName: string; email: string; orbCustomerId: string | null }) {
    if (user.orbCustomerId || !orbEnabled()) return;
    try {
      const orbCustomer = await createOrbCustomer(user.id, user.fullName, user.email);
      let orbSubId: string | null = null;
      try {
        const sub = await createOrbSubscription(orbCustomer.id);
        orbSubId = sub?.id || null;
      } catch (e) {
        console.error("Orb subscription creation failed:", e);
      }
      await storage.updateUserOrbIds(user.id, orbCustomer.id, orbSubId);
    } catch (e) {
      console.error("Orb customer provisioning failed:", e);
    }
  }
  