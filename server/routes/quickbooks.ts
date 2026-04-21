import type { Express } from "express";
import crypto from "crypto";
import { storage } from "../storage";
import { qbEnabled, getQbAuthUrl, exchangeQbCode, pushInvoiceToQb, pullPaymentsFromQb, syncAllInvoices, handleQbWebhook } from "../quickbooks";
import { requireAuth } from "./shared";

export function registerQuickBooksRoutes(app: Express) {
  app.get("/api/quickbooks/config", (_req, res) => {
    res.json({ enabled: qbEnabled() });
  });

  app.get("/api/quickbooks/status", requireAuth, async (req, res) => {
    const user = await storage.getUser(req.session.userId!);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({
      connected: !!(user.qbAccessToken && user.qbRealmId),
      realmId: user.qbRealmId || null,
      connectedAt: user.qbConnectedAt || null,
      enabled: qbEnabled(),
    });
  });

  app.get("/api/quickbooks/connect", requireAuth, (req, res) => {
    if (!qbEnabled()) {
      return res.status(503).json({ message: "QuickBooks integration is not configured" });
    }
    const state = `${req.session.userId}:${crypto.randomBytes(16).toString("hex")}`;
    req.session.qbOAuthState = state;
    const authUrl = getQbAuthUrl(state);
    res.json({ authUrl });
  });

  app.get("/api/quickbooks/callback", async (req, res) => {
    const { code, state, realmId } = req.query as { code: string; state: string; realmId: string };

    if (!code || !state || !realmId) {
      return res.redirect("/settings?qb_error=missing_params");
    }

    if (!req.session.userId || !req.session.qbOAuthState || req.session.qbOAuthState !== state) {
      return res.redirect("/settings?qb_error=invalid_state");
    }

    const userId = req.session.userId;
    req.session.qbOAuthState = undefined;

    try {
      const tokens = await exchangeQbCode(code);
      const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);

      await storage.updateUserQbTokens(userId, {
        qbAccessToken: tokens.access_token,
        qbRefreshToken: tokens.refresh_token,
        qbRealmId: realmId,
        qbTokenExpiresAt: expiresAt,
        qbConnectedAt: new Date(),
      });

      res.redirect("/settings?qb_success=true");
    } catch (error) {
      console.error("QuickBooks OAuth callback error:", error);
      res.redirect("/settings?qb_error=token_exchange_failed");
    }
  });

  app.post("/api/quickbooks/disconnect", requireAuth, async (req, res) => {
    await storage.clearUserQbTokens(req.session.userId!);
    res.json({ success: true });
  });

  app.post("/api/quickbooks/sync-invoice", requireAuth, async (req, res) => {
    const { invoiceId } = req.body;
    if (!invoiceId) return res.status(400).json({ message: "invoiceId required" });

    const invoice = await storage.getInvoiceById(invoiceId);
    if (!invoice) return res.status(404).json({ message: "Invoice not found" });
    if (invoice.participantId !== req.session.userId) {
      return res.status(403).json({ message: "Not authorized to sync this invoice" });
    }

    try {
      const synced = await pushInvoiceToQb(req.session.userId!, invoiceId);
      res.json({ success: true, invoice: synced });
    } catch (error) {
      res.status(500).json({
        message: error instanceof Error ? error.message : "Failed to sync invoice to QuickBooks",
      });
    }
  });

  app.post("/api/quickbooks/pull-payments", requireAuth, async (req, res) => {
    try {
      const result = await pullPaymentsFromQb(req.session.userId!);
      res.json(result);
    } catch (error) {
      res.status(500).json({
        message: error instanceof Error ? error.message : "Failed to pull payments from QuickBooks",
      });
    }
  });

  app.post("/api/quickbooks/sync-all", requireAuth, async (req, res) => {
    try {
      const result = await syncAllInvoices(req.session.userId!);
      res.json(result);
    } catch (error) {
      res.status(500).json({
        message: error instanceof Error ? error.message : "Failed to sync with QuickBooks",
      });
    }
  });

  app.post("/api/quickbooks/webhook", async (req, res) => {
    try {
      const verifierToken = process.env.QB_WEBHOOK_VERIFIER_TOKEN;
      if (req.headers["intuit-signature"] && verifierToken) {
        const crypto = await import("crypto");
        const rawPayload = (req as { rawBody?: Buffer }).rawBody || Buffer.from(JSON.stringify(req.body));
        const hash = crypto.createHmac("sha256", verifierToken).update(rawPayload).digest("base64");
        if (hash !== req.headers["intuit-signature"]) {
          return res.status(401).json({ message: "Invalid webhook signature" });
        }
      }

      if (req.body?.challenge) {
        return res.status(200).send(req.body.challenge);
      }

      await handleQbWebhook(req.body);
      res.status(200).json({ received: true });
    } catch (error) {
      console.error("QB webhook error:", error);
      res.status(200).json({ received: true });
    }
  });

}
