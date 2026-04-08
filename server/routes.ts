import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import crypto from "crypto";
import { storage } from "./storage";
import { registerObjectStorageRoutes } from "./replit_integrations/object_storage";
import {
  insertBookingSchema,
  insertJobSchema,
  insertTransportRequestSchema,
  insertMessageSchema,
  insertServiceSessionSchema,
  insertTransportTripSchema,
  insertReviewSchema,
  insertCommunityReportSchema,
  insertWorkerAvailabilitySchema,
  insertWorkerBlockoutSchema,
  insertShiftSchema,
} from "@shared/schema";
import { z } from "zod";
import { syncParticipantPlan, getCachedPlan, fetchPriceGuide, validateRateAgainstPriceGuide, submitNdisClaim, lookupParticipant, lookupProvider, lookupWorkerScreening } from "./ndis-api";

async function getWorkerIdForUser(userId: string): Promise<string | null> {
  const worker = await storage.getWorkerByUserId(userId);
  return worker?.id || null;
}
import {
  processChat,
  createChatSession,
  getUserSessions,
  getSessionMessages,
  deleteChatSession,
} from "./chat-engine";
import { getStripe, stripeEnabled } from "./stripe";
import { orbEnabled, createOrbCustomer, createOrbSubscription, ingestCareHoursEvent, ingestTransportKmEvent, getCustomerUsage, verifyAndUnwrapWebhook } from "./orb";

const patchUserSchema = z.object({
  fullName: z.string().min(1).max(200).optional(),
  email: z.string().email().max(200).optional(),
  location: z.string().max(200).optional(),
});

function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Not authenticated" });
  }
  next();
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  async function provisionOrbBilling(user: { id: string; fullName: string; email: string; orbCustomerId: string | null }) {
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

  app.post("/api/auth/login", async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: "Username and password are required" });
    }
    const user = await storage.getUserByUsername(username);
    if (!user) {
      return res.status(401).json({ message: "Invalid username or password" });
    }
    let passwordMatch = false;
    if (user.password.includes(":")) {
      const [salt, hash] = user.password.split(":");
      const inputHash = crypto.createHash("sha256").update(salt + password).digest("hex");
      passwordMatch = hash === inputHash;
    } else {
      passwordMatch = user.password === password;
    }
    if (!passwordMatch) {
      return res.status(401).json({ message: "Invalid username or password" });
    }
    req.session.userId = user.id;

    const { password: _, ...safeUser } = user;
    res.json(safeUser);
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Failed to log out" });
      }
      res.clearCookie("connect.sid");
      res.json({ message: "Logged out" });
    });
  });

  app.get("/api/auth/me", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    const user = await storage.getUser(req.session.userId);
    if (!user) {
      req.session.destroy(() => {});
      return res.status(401).json({ message: "User not found" });
    }
    const { password, ...safeUser } = user;
    res.json({ ...safeUser, auth0Login: !!req.session.auth0Login });
  });

  const auth0Domain = process.env.AUTH0_DOMAIN || "";
  const auth0ClientId = process.env.AUTH0_CLIENT_ID || "";
  const auth0ClientSecret = process.env.AUTH0_CLIENT_SECRET || "";
  const auth0Enabled = !!(auth0Domain && auth0ClientId && auth0ClientSecret);

  function getAuth0CallbackUrl() {
    const replitDomain = process.env.REPLIT_DEV_DOMAIN || process.env.REPLIT_DOMAINS || "";
    if (replitDomain) return `https://${replitDomain}/api/auth/auth0/callback`;
    return "http://localhost:5000/api/auth/auth0/callback";
  }

  function getAuth0LogoutReturnUrl() {
    const replitDomain = process.env.REPLIT_DEV_DOMAIN || process.env.REPLIT_DOMAINS || "";
    if (replitDomain) return `https://${replitDomain}`;
    return "http://localhost:5000";
  }

  interface Auth0UserInfo {
    sub?: string;
    email?: string;
    email_verified?: boolean;
    name?: string;
    nickname?: string;
    picture?: string;
  }

  async function getAuth0UserInfo(accessToken: string): Promise<Auth0UserInfo | null> {
    const response = await fetch(`https://${auth0Domain}/userinfo`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!response.ok) return null;
    return response.json() as Promise<Auth0UserInfo>;
  }

  async function findOrCreateAuth0User(userInfo: Auth0UserInfo) {
    const sub = userInfo.sub || "";
    const email = userInfo.email || "";
    const emailVerified = !!userInfo.email_verified;
    const name = userInfo.name || userInfo.nickname || "Auth0 User";
    const picture = userInfo.picture || "";

    if (sub) {
      const user = await storage.getUserByAuth0Sub(sub);
      if (user) return user;
    }

    if (email && emailVerified) {
      const user = await storage.getUserByEmail(email);
      if (user) {
        if (sub) await storage.updateUserAuth0Sub(user.id, sub);
        return user;
      }
    }

    const id = "auth0_" + crypto.createHash("md5").update(sub || email).digest("hex").substring(0, 12);
    let username = email ? email.split("@")[0] : "user_" + crypto.createHash("md5").update(sub).digest("hex").substring(0, 8);

    const existingUser = await storage.getUserByUsername(username);
    if (existingUser) {
      username += "_" + crypto.createHash("md5").update(sub).digest("hex").substring(0, 4);
    }

    return storage.createUser({
      id,
      username,
      password: "",
      fullName: name,
      email,
      role: "participant",
      avatar: picture,
      auth0Sub: sub,
      isVerified: true,
    });
  }

  app.get("/api/auth/auth0/config", (_req, res) => {
    res.json({
      enabled: auth0Enabled,
      domain: auth0Enabled ? auth0Domain : null,
    });
  });

  app.get("/api/auth/auth0/login", (req, res) => {
    if (!auth0Enabled) {
      return res.status(404).json({ message: "Auth0 not configured" });
    }

    const connection = typeof req.query.connection === "string" ? req.query.connection : undefined;

    const verifier = crypto.randomBytes(32).toString("base64url");
    const challenge = crypto.createHash("sha256").update(verifier).digest("base64url");
    const state = crypto.randomBytes(16).toString("hex");

    req.session.auth0State = state;
    req.session.auth0CodeVerifier = verifier;

    const params = new URLSearchParams({
      response_type: "code",
      client_id: auth0ClientId,
      redirect_uri: getAuth0CallbackUrl(),
      scope: "openid profile email",
      state,
      code_challenge: challenge,
      code_challenge_method: "S256",
    });

    if (connection) {
      params.set("connection", connection);
    }

    req.session.save(() => {
      res.redirect(`https://${auth0Domain}/authorize?${params.toString()}`);
    });
  });

  app.get("/api/auth/auth0/callback", async (req, res) => {
    if (!auth0Enabled) {
      return res.redirect("/?error=auth0_not_configured");
    }

    const { code, state, error } = req.query;

    if (error) {
      console.error("Auth0 callback error:", error, req.query.error_description);
      return res.redirect("/?error=auth0_denied");
    }

    if (!code || !state || state !== req.session.auth0State) {
      return res.redirect("/?error=auth0_invalid_state");
    }

    try {
      const tokenResponse = await fetch(`https://${auth0Domain}/oauth/token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          grant_type: "authorization_code",
          client_id: auth0ClientId,
          client_secret: auth0ClientSecret,
          code,
          redirect_uri: getAuth0CallbackUrl(),
          code_verifier: req.session.auth0CodeVerifier || "",
        }),
      });

      if (!tokenResponse.ok) {
        console.error("Auth0 token exchange failed:", await tokenResponse.text());
        return res.redirect("/?error=auth0_token_failed");
      }

      const tokens = await tokenResponse.json() as { access_token: string };

      const userInfo = await getAuth0UserInfo(tokens.access_token);
      if (!userInfo) {
        return res.redirect("/?error=auth0_userinfo_failed");
      }

      const user = await findOrCreateAuth0User(userInfo);

      req.session.userId = user.id;
      req.session.auth0Login = true;
      delete req.session.auth0State;
      delete req.session.auth0CodeVerifier;

      req.session.save(() => {
        res.redirect("/");
      });
    } catch (err) {
      console.error("Auth0 callback error:", err);
      res.redirect("/?error=auth0_server_error");
    }
  });

  app.post("/api/auth/auth0/logout", (req, res) => {
    const wasAuth0 = !!req.session.auth0Login;
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Failed to log out" });
      }
      res.clearCookie("connect.sid");
      if (wasAuth0 && auth0Enabled) {
        const params = new URLSearchParams({
          client_id: auth0ClientId,
          returnTo: getAuth0LogoutReturnUrl(),
        });
        res.json({ auth0LogoutUrl: `https://${auth0Domain}/v2/logout?${params.toString()}` });
      } else {
        res.json({ message: "Logged out" });
      }
    });
  });

  const lookupRateLimit = new Map<string, { count: number; resetAt: number }>();

  function checkLookupRateLimit(ip: string): boolean {
    const now = Date.now();
    const entry = lookupRateLimit.get(ip);
    if (!entry || now > entry.resetAt) {
      lookupRateLimit.set(ip, { count: 1, resetAt: now + 60000 });
      return true;
    }
    if (entry.count >= 10) return false;
    entry.count++;
    return true;
  }

  app.get("/api/ndis/lookup/participant/:ndisNumber", async (req, res) => {
    const ip = req.ip || "unknown";
    if (!checkLookupRateLimit(ip)) {
      return res.status(429).json({ message: "Too many lookup requests. Try again later." });
    }
    const ndisNumber = req.params.ndisNumber.replace(/\s/g, "");
    if (!/^\d{6,12}$/.test(ndisNumber)) {
      return res.status(400).json({ message: "Invalid NDIS number format" });
    }
    try {
      const result = await lookupParticipant(ndisNumber);
      res.json({
        ndisNumber: result.ndisNumber,
        fullName: result.fullName,
        planStartDate: result.planStartDate,
        planEndDate: result.planEndDate,
        managementType: result.managementType,
      });
    } catch (error) {
      console.error("Participant lookup error:", error);
      res.status(500).json({ message: "Failed to look up participant" });
    }
  });

  app.get("/api/ndis/lookup/provider/:identifier", async (req, res) => {
    const ip = req.ip || "unknown";
    if (!checkLookupRateLimit(ip)) {
      return res.status(429).json({ message: "Too many lookup requests. Try again later." });
    }
    const identifier = req.params.identifier.replace(/\s/g, "");
    if (!/^[\w\d]{5,20}$/.test(identifier)) {
      return res.status(400).json({ message: "Invalid provider identifier format" });
    }
    try {
      const result = await lookupProvider(identifier);
      res.json({
        providerNumber: result.providerNumber,
        businessName: result.businessName,
        abn: result.abn,
        registrationGroups: result.registrationGroups,
      });
    } catch (error) {
      console.error("Provider lookup error:", error);
      res.status(500).json({ message: "Failed to look up provider" });
    }
  });

  app.get("/api/ndis/lookup/worker/:screeningNumber", async (req, res) => {
    const ip = req.ip || "unknown";
    if (!checkLookupRateLimit(ip)) {
      return res.status(429).json({ message: "Too many lookup requests. Try again later." });
    }
    const screeningNumber = req.params.screeningNumber.replace(/\s/g, "");
    if (!/^[A-Za-z0-9]{5,20}$/.test(screeningNumber)) {
      return res.status(400).json({ message: "Invalid screening number format" });
    }
    try {
      const result = await lookupWorkerScreening(screeningNumber);
      res.json({
        screeningNumber: result.screeningNumber,
        fullName: result.fullName,
        clearanceStatus: result.clearanceStatus,
        expiryDate: result.expiryDate,
      });
    } catch (error) {
      console.error("Worker screening lookup error:", error);
      res.status(500).json({ message: "Failed to look up worker screening" });
    }
  });

  const registerSchema = z.object({
    username: z.string().min(3).max(50),
    password: z.string().min(6).max(100),
    fullName: z.string().min(1).max(200),
    email: z.string().email().max(200),
    role: z.enum(["participant", "carer", "provider"]),
    ndisNumber: z.string().optional(),
    planStartDate: z.string().optional(),
    planEndDate: z.string().optional(),
    managementType: z.string().optional(),
    location: z.string().optional(),
    workerTitle: z.string().optional(),
    workerSpecializations: z.array(z.string()).optional(),
    abn: z.string().optional(),
    providerBusinessName: z.string().optional(),
    providerRegistrationGroups: z.array(z.string()).optional(),
    screeningNumber: z.string().optional(),
    screeningClearanceStatus: z.string().optional(),
    screeningExpiry: z.string().optional(),
  });

  app.post("/api/auth/register", async (req, res) => {
    try {
      const data = registerSchema.parse(req.body);

      const existingUsername = await storage.getUserByUsername(data.username);
      if (existingUsername) {
        return res.status(400).json({ message: "Username already taken" });
      }

      const existingEmail = await storage.getUserByEmail(data.email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already registered" });
      }

      const userId = crypto.randomBytes(8).toString("hex");
      const salt = crypto.randomBytes(16).toString("hex");
      const hashedPassword = salt + ":" + crypto.createHash("sha256").update(salt + data.password).digest("hex");
      const user = await storage.createUser({
        id: userId,
        username: data.username,
        password: hashedPassword,
        fullName: data.fullName,
        email: data.email,
        role: data.role === "carer" ? "carer" : data.role,
        ndisNumber: data.ndisNumber || null,
        planStartDate: data.planStartDate || null,
        planEndDate: data.planEndDate || null,
        location: data.location || null,
        isVerified: false,
        managementType: data.role === "participant" ? (data.managementType || null) : null,
        providerAbn: data.role === "provider" ? (data.abn || null) : null,
        providerBusinessName: data.role === "provider" ? (data.providerBusinessName || null) : null,
        providerRegistrationGroups: data.role === "provider" ? (data.providerRegistrationGroups || null) : null,
      });

      if (data.role === "carer") {
        await storage.createWorker({
          userId: user.id,
          title: data.workerTitle || "Support Worker",
          specializations: data.workerSpecializations || [],
          ndisVerified: false,
          abn: data.abn || null,
          screeningNumber: data.screeningNumber || null,
          screeningClearanceStatus: data.screeningClearanceStatus || null,
          screeningExpiry: data.screeningExpiry || null,
        });
      }

      req.session.userId = user.id;
      const { password: _, ...safeUser } = user;
      res.status(201).json(safeUser);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Registration error:", error);
      res.status(500).json({ message: "Registration failed" });
    }
  });

  app.use("/api", (req, res, next) => {
    if (
      req.path === "/auth/login" ||
      req.path === "/auth/logout" ||
      req.path === "/auth/me" ||
      req.path === "/auth/register" ||
      req.path === "/auth/auth0/config" ||
      req.path === "/auth/auth0/login" ||
      req.path === "/auth/auth0/callback" ||
      req.path === "/auth/auth0/logout" ||
      req.path.startsWith("/ndis/lookup/") ||
      req.path === "/webhooks/stripe" ||
      req.path === "/webhooks/orb" ||
      req.path === "/stripe/config"
    ) {
      return next();
    }
    requireAuth(req, res, next);
  });

  registerObjectStorageRoutes(app);

  app.post("/api/abn/lookup", async (req, res) => {
    const { abn } = req.body;
    if (!abn) return res.status(400).json({ message: "ABN is required" });

    const { validateAbn, formatAbn, stripAbn } = await import("@shared/abn-utils");
    const validation = validateAbn(abn);
    if (!validation.valid) {
      return res.status(400).json({ message: validation.error });
    }

    const digits = stripAbn(abn);
    const abnGuid = process.env.ABR_GUID || "";

    if (!abnGuid) {
      return res.json({
        abn: digits,
        abnFormatted: formatAbn(digits),
        entityName: "ABR lookup unavailable — ABN format is valid",
        businessNames: [],
        tradingNames: [],
        abnStatus: "Valid (format only)",
        abnStatusEffectiveFrom: "",
        entityTypeCode: "",
        entityTypeDescription: "",
        state: "",
        postcode: "",
        gstRegistered: false,
        gstRegisteredFrom: "",
        dgrEndorsed: false,
        lastUpdated: new Date().toISOString(),
        offline: true,
      });
    }

    try {
      const abrUrl = `https://abr.business.gov.au/abrxmlsearch/AbrXmlSearch.asmx/SearchByABNv202001?searchString=${digits}&includeHistoricalDetails=N&authenticationGuid=${abnGuid}`;
      const abrRes = await fetch(abrUrl);
      const xml = await abrRes.text();

      const getTag = (tag: string, src: string) => {
        const m = src.match(new RegExp(`<${tag}[^>]*>([^<]*)</${tag}>`));
        return m ? m[1].trim() : "";
      };
      const identifierValue = getTag("identifierValue", xml);
      if (!identifierValue) {
        return res.status(404).json({ message: "ABN not found in Australian Business Register" });
      }

      const abnStatusBlock = xml.match(/<entityStatus>([\s\S]*?)<\/entityStatus>/)?.[1] || "";
      const abnStatus = getTag("entityStatusCode", abnStatusBlock);
      const abnStatusFrom = getTag("effectiveFrom", abnStatusBlock);

      const entityTypeBlock = xml.match(/<entityType>([\s\S]*?)<\/entityType>/)?.[1] || "";
      const entityTypeCode = getTag("entityTypeCode", entityTypeBlock);
      const entityTypeDescription = getTag("entityDescription", entityTypeBlock);

      const mainNameBlock = xml.match(/<mainName>([\s\S]*?)<\/mainName>/)?.[1] || "";
      const legalNameBlock = xml.match(/<legalName>([\s\S]*?)<\/legalName>/)?.[1] || "";
      let entityName = getTag("organisationName", mainNameBlock);
      if (!entityName) {
        const givenName = getTag("givenName", legalNameBlock);
        const familyName = getTag("familyName", legalNameBlock);
        entityName = [givenName, familyName].filter(Boolean).join(" ");
      }

      const businessNameBlocks = xml.match(/<businessName>([\s\S]*?)<\/businessName>/g) || [];
      const businessNames = businessNameBlocks.map(b => getTag("organisationName", b)).filter(Boolean);

      const tradingNameBlocks = xml.match(/<mainTradingName>([\s\S]*?)<\/mainTradingName>/g) || [];
      const tradingNames = tradingNameBlocks.map(b => getTag("organisationName", b)).filter(Boolean);

      const addressBlock = xml.match(/<mainBusinessPhysicalAddress>([\s\S]*?)<\/mainBusinessPhysicalAddress>/)?.[1] || "";
      const state = getTag("stateCode", addressBlock);
      const postcode = getTag("postcode", addressBlock);

      const gstBlocks = xml.match(/<goodsAndServicesTax>([\s\S]*?)<\/goodsAndServicesTax>/g) || [];
      let gstRegistered = false;
      let gstRegisteredFrom = "";
      for (const b of gstBlocks) {
        const to = getTag("effectiveTo", b);
        if (!to || to === "0001-01-01") {
          gstRegistered = true;
          gstRegisteredFrom = getTag("effectiveFrom", b);
          break;
        }
      }

      const dgrBlocks = xml.match(/<dgrEndorsement>([\s\S]*?)<\/dgrEndorsement>/g) || [];
      const dgrEndorsed = dgrBlocks.length > 0;

      res.json({
        abn: digits,
        abnFormatted: formatAbn(digits),
        entityName,
        businessNames,
        tradingNames,
        abnStatus,
        abnStatusEffectiveFrom: abnStatusFrom,
        entityTypeCode,
        entityTypeDescription,
        state,
        postcode,
        gstRegistered,
        gstRegisteredFrom,
        dgrEndorsed,
        lastUpdated: new Date().toISOString(),
      });
    } catch (err) {
      console.error("ABR lookup error:", err);
      res.status(502).json({ message: "Failed to contact Australian Business Register" });
    }
  });

  app.get("/api/me", async (req, res) => {
    const user = await storage.getUser(req.session.userId!);
    if (!user) return res.status(404).json({ message: "No user found" });
    const { password, ...safeUser } = user;
    res.json(safeUser);
  });

  app.patch("/api/me", async (req, res) => {
    const user = await storage.getUser(req.session.userId!);
    if (!user) return res.status(404).json({ message: "No user found" });
    const parsed = patchUserSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Invalid data", errors: parsed.error.flatten() });
    const { fullName, email, location } = parsed.data;
    const updated = await storage.updateUserProfile(user.id, { fullName, email, location });
    if (!updated) return res.status(500).json({ message: "Update failed" });
    const { password, ...safeUser } = updated;
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

  app.get("/api/worker/me", requireAuth, async (req, res) => {
    const userId = req.session.userId!;
    const user = await storage.getUser(userId);
    if (!user || user.role !== "carer") {
      return res.status(403).json({ message: "Not a worker account" });
    }
    const worker = await storage.getWorkerByUserId(userId);
    if (!worker) return res.status(404).json({ message: "Worker profile not found" });
    const fullWorker = await storage.getWorker(worker.id);
    res.json(fullWorker);
  });

  app.patch("/api/worker/me", requireAuth, async (req, res) => {
    const userId = req.session.userId!;
    const user = await storage.getUser(userId);
    if (!user || user.role !== "carer") {
      return res.status(403).json({ message: "Not a worker account" });
    }
    const worker = await storage.getWorkerByUserId(userId);
    if (!worker) return res.status(404).json({ message: "Worker profile not found" });

    const { fullName, email, location, phoneNumber, bio, title, specializations, hourlyRate, transportCapable, wheelchairAccessible, transportType, languages, insuranceExpiry, firstAidExpiry, wwccNumber, wwccExpiry, screeningNumber, screeningExpiry } = req.body;
    if (fullName || email || location) {
      await storage.updateUserProfile(userId, { fullName, email, location });
    }
    if (phoneNumber !== undefined || bio !== undefined || languages !== undefined) {
      const updateData: Record<string, any> = {};
      if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber;
      if (bio !== undefined) updateData.bio = bio;
      if (languages !== undefined) updateData.languages = languages;
      const { eq } = await import("drizzle-orm");
      const { users } = await import("@shared/schema");
      const { db } = await import("./db");
      await db.update(users).set(updateData).where(eq(users.id, userId));
    }

    const workerFields = { title, specializations, hourlyRate, transportCapable, wheelchairAccessible, transportType, insuranceExpiry, firstAidExpiry, wwccNumber, wwccExpiry, screeningNumber, screeningExpiry };
    if (Object.values(workerFields).some(v => v !== undefined)) {
      const workerUpdate: Record<string, any> = {};
      for (const [k, v] of Object.entries(workerFields)) {
        if (v !== undefined) workerUpdate[k] = v;
      }
      if (Object.keys(workerUpdate).length > 0) {
        const { eq } = await import("drizzle-orm");
        const { workers } = await import("@shared/schema");
        const { db } = await import("./db");
        await db.update(workers).set(workerUpdate).where(eq(workers.id, worker.id));
      }
    }

    const updatedWorker = await storage.getWorker(worker.id);
    res.json(updatedWorker);
  });

  app.get("/api/worker/bookings", requireAuth, async (req, res) => {
    const userId = req.session.userId!;
    const user = await storage.getUser(userId);
    if (!user || user.role !== "carer") {
      return res.status(403).json({ message: "Not a worker account" });
    }
    const worker = await storage.getWorkerByUserId(userId);
    if (!worker) return res.status(404).json({ message: "Worker profile not found" });

    const allBookings = await storage.getBookings();
    const workerBookings = allBookings.filter(b => b.workerId === worker.id);

    const enriched = await Promise.all(workerBookings.map(async (b) => {
      const participant = await storage.getUser(b.participantId);
      return { ...b, participant: participant ? { id: participant.id, fullName: participant.fullName, email: participant.email, location: participant.location } : null };
    }));

    res.json(enriched);
  });

  app.patch("/api/worker/bookings/:id/status", requireAuth, async (req, res) => {
    const userId = req.session.userId!;
    const user = await storage.getUser(userId);
    if (!user || user.role !== "carer") {
      return res.status(403).json({ message: "Not a worker account" });
    }
    const worker = await storage.getWorkerByUserId(userId);
    if (!worker) return res.status(404).json({ message: "Worker profile not found" });

    const { status } = req.body;
    const validStatuses = ["confirmed", "cancelled"];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ message: `status must be one of: ${validStatuses.join(", ")}` });
    }

    const allBookings = await storage.getBookings();
    const booking = allBookings.find(b => b.id === req.params.id);
    if (!booking) return res.status(404).json({ message: "Booking not found" });
    if (booking.workerId !== worker.id) {
      return res.status(403).json({ message: "Not your booking" });
    }

    const { eq } = await import("drizzle-orm");
    const { bookings } = await import("@shared/schema");
    const { db } = await import("./db");
    const [updated] = await db.update(bookings).set({ status }).where(eq(bookings.id, req.params.id)).returning();
    res.json(updated);
  });

  app.post("/api/worker/bookings/:id/start-shift", requireAuth, async (req, res) => {
    const userId = req.session.userId!;
    const user = await storage.getUser(userId);
    if (!user || user.role !== "carer") {
      return res.status(403).json({ message: "Not a worker account" });
    }
    const worker = await storage.getWorkerByUserId(userId);
    if (!worker) return res.status(404).json({ message: "Worker profile not found" });

    const allBookings = await storage.getBookings();
    const booking = allBookings.find(b => b.id === req.params.id);
    if (!booking) return res.status(404).json({ message: "Booking not found" });
    if (booking.workerId !== worker.id) {
      return res.status(403).json({ message: "Not your booking" });
    }
    if (booking.status !== "confirmed") {
      return res.status(400).json({ message: "Booking must be confirmed to start a shift" });
    }

    const existingShifts = await storage.getShifts({ workerId: worker.id });
    const activeShift = existingShifts.find(s => s.status === "in_progress");
    if (activeShift) {
      return res.status(400).json({ message: "You already have an active shift in progress. Complete it before starting a new one." });
    }

    const today = new Date().toISOString().split("T")[0];
    const now = new Date();
    const startTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

    const shift = await storage.createShift({
      workerId: worker.id,
      participantId: booking.participantId,
      date: today,
      startTime,
      endTime: booking.endTime || "17:00",
      status: "in_progress",
      serviceType: booking.serviceType,
      notes: booking.notes || null,
    });

    const { eq } = await import("drizzle-orm");
    const { bookings } = await import("@shared/schema");
    const { db } = await import("./db");
    await db.update(bookings).set({ status: "in_progress" }).where(eq(bookings.id, booking.id));

    res.json({ shift, message: "Shift started from booking" });
  });

  app.get("/api/worker/earnings", requireAuth, async (req, res) => {
    const userId = req.session.userId!;
    const user = await storage.getUser(userId);
    if (!user || user.role !== "carer") {
      return res.status(403).json({ message: "Not a worker account" });
    }
    const worker = await storage.getWorkerByUserId(userId);
    if (!worker) return res.status(404).json({ message: "Worker profile not found" });

    const workerShifts = await storage.getShifts({ workerId: worker.id });
    const completedShifts = workerShifts.filter(s => s.status === "completed");

    let totalEarnings = 0;
    const earningsByMonth: Record<string, number> = {};
    for (const shift of completedShifts) {
      const startParts = shift.startTime.split(":");
      const endParts = shift.endTime.split(":");
      const startMins = parseInt(startParts[0]) * 60 + parseInt(startParts[1] || "0");
      const endMins = parseInt(endParts[0]) * 60 + parseInt(endParts[1] || "0");
      const hours = Math.max((endMins - startMins) / 60, 0.25);
      const rate = Number(worker.hourlyRate || 0);
      const earned = hours * rate;
      totalEarnings += earned;
      const month = shift.date.substring(0, 7);
      earningsByMonth[month] = (earningsByMonth[month] || 0) + earned;
    }

    res.json({
      totalEarnings: totalEarnings.toFixed(2),
      completedShifts: completedShifts.length,
      totalShifts: workerShifts.length,
      hourlyRate: worker.hourlyRate,
      earningsByMonth,
    });
  });

  app.get("/api/worker/reviews", requireAuth, async (req, res) => {
    const userId = req.session.userId!;
    const user = await storage.getUser(userId);
    if (!user || user.role !== "carer") {
      return res.status(403).json({ message: "Not a worker account" });
    }
    const worker = await storage.getWorkerByUserId(userId);
    if (!worker) return res.status(404).json({ message: "Worker profile not found" });

    const reviews = await storage.getReviewsForWorker(worker.id);
    res.json(reviews);
  });

  app.get("/api/worker/dashboard", requireAuth, async (req, res) => {
    const userId = req.session.userId!;
    const user = await storage.getUser(userId);
    if (!user || user.role !== "carer") {
      return res.status(403).json({ message: "Not a worker account" });
    }
    const worker = await storage.getWorkerByUserId(userId);
    if (!worker) return res.status(404).json({ message: "Worker profile not found" });

    const today = new Date().toISOString().split("T")[0];
    const allShifts = await storage.getShifts({ workerId: worker.id });
    const todayShiftsRaw = allShifts.filter(s => s.date === today);
    const upcomingShiftsRaw = allShifts.filter(s => s.date >= today && s.status !== "cancelled" && s.status !== "completed").slice(0, 5);
    const completedCount = allShifts.filter(s => s.status === "completed").length;
    const activeShiftRaw = todayShiftsRaw.find(s => s.status === "in_progress") || null;

    const enrichShift = async (s: any) => {
      const participant = await storage.getUser(s.participantId);
      return { ...s, participantName: participant?.fullName || "Unknown" };
    };
    const todayShifts = await Promise.all(todayShiftsRaw.map(enrichShift));
    const upcomingShifts = await Promise.all(upcomingShiftsRaw.map(enrichShift));
    const activeShift = activeShiftRaw ? await enrichShift(activeShiftRaw) : null;

    const allBookings = await storage.getBookings();
    const pendingBookings = allBookings.filter(b => b.workerId === worker.id && b.status === "pending");

    const enrichedPendingBookings = await Promise.all(pendingBookings.map(async (b) => {
      const participant = await storage.getUser(b.participantId);
      return {
        ...b,
        participantName: participant?.fullName || "Unknown",
      };
    }));

    const reviews = await storage.getReviewsForWorker(worker.id);

    const complianceAlerts: string[] = [];
    const checkExpiry = (label: string, dateStr: string | null) => {
      if (!dateStr) { complianceAlerts.push(`${label} not on file`); return; }
      const expiryDate = new Date(dateStr);
      const daysUntil = Math.ceil((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      if (daysUntil < 0) complianceAlerts.push(`${label} has expired`);
      else if (daysUntil <= 30) complianceAlerts.push(`${label} expires in ${daysUntil} days`);
    };
    checkExpiry("Insurance", worker.insuranceExpiry);
    checkExpiry("First Aid Certificate", worker.firstAidExpiry);
    checkExpiry("WWCC", worker.wwccExpiry);
    checkExpiry("Screening Clearance", worker.screeningExpiry);
    if (!worker.ndisVerified) complianceAlerts.push("NDIS verification pending");

    const currentMonth = today.substring(0, 7);
    const monthShifts = allShifts.filter(s => s.date?.startsWith(currentMonth) && s.status === "completed");
    const monthHours = monthShifts.reduce((sum, s) => {
      if (s.actualHours) return sum + Number(s.actualHours);
      const sp = s.startTime.split(":"), ep = s.endTime.split(":");
      const mins = (parseInt(ep[0]) * 60 + parseInt(ep[1] || "0")) - (parseInt(sp[0]) * 60 + parseInt(sp[1] || "0"));
      return sum + Math.max(mins / 60, 0.25);
    }, 0);
    const hourlyRate = Number(worker.hourlyRate || 0);
    const monthEarnings = monthHours * hourlyRate;

    const activeBookings = allBookings.filter(b => b.workerId === worker.id && (b.status === "confirmed" || b.status === "in_progress"));

    res.json({
      worker,
      user: { id: user.id, fullName: user.fullName, email: user.email, role: user.role },
      todayShifts,
      upcomingShifts,
      activeShift,
      completedCount,
      totalShifts: allShifts.length,
      pendingBookings: enrichedPendingBookings,
      activeBookingsCount: activeBookings.length,
      monthHours: Math.round(monthHours * 10) / 10,
      monthEarnings: Math.round(monthEarnings * 100) / 100,
      rating: worker.rating,
      reviewCount: worker.reviewCount,
      recentReviews: reviews.slice(0, 3),
      complianceAlerts,
    });
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

  app.get("/api/pricing/care", async (_req, res) => {
    const tiers = await storage.getPricingTiers("care");
    res.json(tiers);
  });

  app.get("/api/pricing/transport", async (_req, res) => {
    const tiers = await storage.getPricingTiers("transport");
    res.json(tiers);
  });

  app.get("/api/pricing/care/rate", async (req, res) => {
    const participantId = req.query.participantId as string;
    if (!participantId) return res.status(400).json({ message: "participantId required" });
    const now = new Date().toISOString();
    const result = await storage.calculateCareRate(participantId, now);
    res.json(result);
  });

  app.get("/api/pricing/transport/rate", async (req, res) => {
    const participantId = req.query.participantId as string;
    if (!participantId) return res.status(400).json({ message: "participantId required" });
    const now = new Date().toISOString();
    const result = await storage.calculateTransportRate(participantId, now);
    res.json(result);
  });

  app.post("/api/sessions", async (req, res) => {
    const parsed = insertServiceSessionSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.message });

    const data = parsed.data;
    if (data.actualHours && !data.hourlyRate) {
      const rateInfo = await storage.calculateCareRate(data.participantId, data.date);
      data.hourlyRate = rateInfo.rate.toFixed(2);
      data.tierApplied = rateInfo.tier;
      data.totalCharge = (Number(data.actualHours) * rateInfo.rate).toFixed(2);
      data.ndisItemCode = data.ndisItemCode || "01_011_0107_1_1";
    }

    if (data.endTime && data.actualHours) {
      data.status = "completed";
    }

    const session = await storage.createServiceSession(data);

    if (session.totalCharge) {
      await storage.updateBudgetUsage(data.participantId, "daily_living", Number(session.totalCharge));
    }

    if (session.status === "completed" && orbEnabled()) {
      const participant = await storage.getUser(data.participantId);
      if (participant && !participant.orbCustomerId) {
        await provisionOrbBilling(participant);
      }
      try {
        await ingestCareHoursEvent(
          data.participantId,
          Number(session.actualHours || 0),
          session.tierApplied || "Standard",
          session.id,
        );
      } catch (e) {
        console.error("Orb usage ingest failed for session:", e);
      }
    }

    res.status(201).json(session);
  });

  app.get("/api/sessions", async (req, res) => {
    const participantId = req.query.participantId as string;
    if (!participantId) return res.status(400).json({ message: "participantId required" });
    const sessions = await storage.getServiceSessions(participantId);
    res.json(sessions);
  });

  app.post("/api/trips", async (req, res) => {
    const parsed = insertTransportTripSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.message });

    const data = parsed.data;
    if (data.distanceKm && !data.perKmRate) {
      const rateInfo = await storage.calculateTransportRate(data.participantId, data.date);
      let kmRate = rateInfo.rate;

      if (data.accessibleVehicle) {
        kmRate = 2.76;
        data.tierApplied = "Accessible Vehicle";
        data.accessibleSurcharge = "0";
      } else {
        data.tierApplied = rateInfo.tier;
      }

      data.perKmRate = kmRate.toFixed(2);
      let charge = Number(data.distanceKm) * kmRate;
      charge += Number(data.tolls || 0);
      data.totalCharge = charge.toFixed(2);
      data.ndisItemCode = data.ndisItemCode || "02_051_0108_1_1";
    }

    if (data.distanceKm) {
      data.status = "completed";
    }

    const trip = await storage.createTransportTrip(data);

    if (trip.totalCharge) {
      await storage.updateBudgetUsage(data.participantId, "transport", Number(trip.totalCharge));
    }

    if (trip.status === "completed" && orbEnabled()) {
      const participant = await storage.getUser(data.participantId);
      if (participant && !participant.orbCustomerId) {
        await provisionOrbBilling(participant);
      }
      try {
        await ingestTransportKmEvent(
          data.participantId,
          Number(trip.distanceKm || 0),
          trip.tierApplied || "Standard",
          trip.id,
        );
      } catch (e) {
        console.error("Orb usage ingest failed for trip:", e);
      }
    }

    res.status(201).json(trip);
  });

  app.get("/api/trips", async (req, res) => {
    const participantId = req.query.participantId as string;
    if (!participantId) return res.status(400).json({ message: "participantId required" });
    const trips = await storage.getTransportTrips(participantId);
    res.json(trips);
  });

  app.post("/api/invoices/generate", async (req, res) => {
    const { participantId, periodStart, periodEnd } = req.body;
    if (!participantId || !periodStart || !periodEnd) {
      return res.status(400).json({ message: "participantId, periodStart, and periodEnd required" });
    }
    const invoice = await storage.generateInvoice(participantId, periodStart, periodEnd);
    res.status(201).json(invoice);
  });

  app.get("/api/invoices", async (req, res) => {
    const participantId = req.query.participantId as string;
    if (!participantId) return res.status(400).json({ message: "participantId required" });
    const invoiceList = await storage.getInvoices(participantId);
    res.json(invoiceList);
  });

  app.get("/api/budget", async (req, res) => {
    const participantId = req.query.participantId as string;
    if (!participantId) return res.status(400).json({ message: "participantId required" });
    const budgets = await storage.getParticipantBudgets(participantId);
    const careRate = await storage.calculateCareRate(participantId, new Date().toISOString());
    const transportRate = await storage.calculateTransportRate(participantId, new Date().toISOString());
    res.json({ budgets, currentCareTier: careRate, currentTransportTier: transportRate });
  });

  app.post("/api/reviews", async (req, res) => {
    const parsed = insertReviewSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.message });
    const review = await storage.createReview(parsed.data);
    res.status(201).json(review);
  });

  app.get("/api/workers/:id/reviews", async (req, res) => {
    const workerReviews = await storage.getReviewsForWorker(req.params.id);
    res.json(workerReviews);
  });

  app.get("/api/access-profile", async (req, res) => {
    const profile = await storage.getAccessProfile(req.session.userId!);
    res.json(profile || null);
  });

  app.put("/api/access-profile", async (req, res) => {
    const profile = await storage.upsertAccessProfile(req.session.userId!, req.body);
    res.json(profile);
  });

  app.post("/api/chat/sessions", async (req, res) => {
    const session = await createChatSession(req.session.userId!);
    res.status(201).json(session);
  });

  app.get("/api/chat/sessions", async (req, res) => {
    const sessions = await getUserSessions(req.session.userId!);
    res.json(sessions);
  });

  app.get("/api/chat/sessions/:id/messages", async (req, res) => {
    const sessions = await getUserSessions(req.session.userId!);
    const owns = sessions.some((s) => s.id === req.params.id);
    if (!owns) return res.status(403).json({ message: "Access denied" });
    const msgs = await getSessionMessages(req.params.id);
    res.json(msgs);
  });

  app.delete("/api/chat/sessions/:id", async (req, res) => {
    const sessions = await getUserSessions(req.session.userId!);
    const owns = sessions.some((s) => s.id === req.params.id);
    if (!owns) return res.status(403).json({ message: "Access denied" });
    await deleteChatSession(req.params.id);
    res.status(204).send();
  });

  app.post("/api/chat/send", async (req, res) => {
    try {
      const { sessionId, message } = req.body;
      if (!sessionId || !message) return res.status(400).json({ message: "sessionId and message required" });
      const sessions = await getUserSessions(req.session.userId!);
      const owns = sessions.some((s) => s.id === sessionId);
      if (!owns) return res.status(403).json({ message: "Access denied" });
      const response = await processChat(sessionId, req.session.userId!, message);
      res.json(response);
    } catch (error) {
      console.error("Chat error:", error);
      res.status(500).json({ message: "Failed to process chat message" });
    }
  });

  app.get("/api/community-reports", async (_req, res) => {
    const reports = await storage.getCommunityReports();
    res.json(reports);
  });

  app.post("/api/community-reports", async (req, res) => {
    const { locationRef, barrierType, severity, description } = req.body;
    if (!locationRef || !barrierType || !severity) {
      return res.status(400).json({ message: "locationRef, barrierType, and severity are required" });
    }
    const report = await storage.createCommunityReport({
      reporterUserId: req.session.userId!,
      locationRef,
      barrierType,
      severity,
      description: description || null,
    });
    res.status(201).json(report);
  });

  app.get("/api/stripe/config", (_req, res) => {
    res.json({
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || "",
      enabled: stripeEnabled(),
    });
  });

  app.post("/api/payments/create-intent", requireAuth, async (req, res) => {
    if (!stripeEnabled()) {
      return res.status(503).json({ message: "Stripe is not configured" });
    }
    const { invoiceId } = req.body;
    if (!invoiceId) return res.status(400).json({ message: "invoiceId required" });

    const invoice = await storage.getInvoiceById(invoiceId);
    if (!invoice) return res.status(404).json({ message: "Invoice not found" });
    if (invoice.participantId !== req.session.userId) {
      return res.status(403).json({ message: "Not authorized to pay this invoice" });
    }
    if (invoice.status === "paid") return res.status(400).json({ message: "Invoice already paid" });

    if (invoice.status === "pending" || invoice.status === "processing") {
      if (invoice.stripePaymentIntentId) {
        const existingPi = await getStripe().paymentIntents.retrieve(invoice.stripePaymentIntentId);
        if (existingPi.status !== "canceled" && existingPi.status !== "succeeded") {
          return res.json({ clientSecret: existingPi.client_secret, paymentIntentId: existingPi.id });
        }
      }
    }

    const user = await storage.getUser(invoice.participantId);
    if (!user) return res.status(404).json({ message: "User not found" });

    let stripeCustomerId = user.stripeCustomerId;
    if (!stripeCustomerId) {
      const customer = await getStripe().customers.create({
        name: user.fullName,
        email: user.email,
        metadata: { userId: user.id, ndisNumber: user.ndisNumber || "" },
      });
      stripeCustomerId = customer.id;
      await storage.updateUserStripeCustomerId(user.id, stripeCustomerId);
    }

    const amountCents = Math.round(Number(invoice.totalAmount) * 100);

    const paymentIntent = await getStripe().paymentIntents.create({
      amount: amountCents,
      currency: "aud",
      customer: stripeCustomerId,
      payment_method_types: ["link", "card"],
      metadata: {
        invoiceId: invoice.id,
        participantId: invoice.participantId,
        periodStart: invoice.periodStart,
        periodEnd: invoice.periodEnd,
      },
    });

    await storage.updateInvoicePayment(invoice.id, {
      stripePaymentIntentId: paymentIntent.id,
      stripePaymentStatus: paymentIntent.status,
      status: "pending",
    });

    res.json({ clientSecret: paymentIntent.client_secret, paymentIntentId: paymentIntent.id });
  });

  app.post("/api/webhooks/stripe", async (req, res) => {
    if (!stripeEnabled()) return res.status(503).send();

    const sig = req.headers["stripe-signature"] as string;
    let event;

    try {
      event = getStripe().webhooks.constructEvent(
        req.rawBody as Buffer,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET!,
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      console.error("Stripe webhook signature verification failed:", message);
      return res.status(400).send(`Webhook Error: ${message}`);
    }

    switch (event.type) {
      case "payment_intent.succeeded": {
        const pi = event.data.object;
        const invoiceId = pi.metadata?.invoiceId;
        if (invoiceId) {
          await storage.updateInvoicePayment(invoiceId, {
            stripePaymentStatus: "succeeded",
            status: "paid",
          });
        }
        break;
      }
      case "payment_intent.processing": {
        const pi = event.data.object;
        const invoiceId = pi.metadata?.invoiceId;
        if (invoiceId) {
          await storage.updateInvoicePayment(invoiceId, {
            stripePaymentStatus: "processing",
            status: "processing",
          });
        }
        break;
      }
      case "payment_intent.payment_failed": {
        const pi = event.data.object;
        const invoiceId = pi.metadata?.invoiceId;
        if (invoiceId) {
          await storage.updateInvoicePayment(invoiceId, {
            stripePaymentStatus: "failed",
            status: "failed",
          });
        }
        break;
      }
    }

    res.json({ received: true });
  });

  app.post("/api/webhooks/orb", async (req, res) => {
    if (!orbEnabled()) {
      return res.status(503).json({ message: "Orb not configured" });
    }

    let event: Record<string, unknown>;
    try {
      const rawBody = typeof req.rawBody === "string" ? req.rawBody : (req.rawBody as Buffer).toString("utf8");
      event = verifyAndUnwrapWebhook(rawBody, req.headers as Record<string, string | string[] | undefined>);
    } catch (e) {
      console.error("Orb webhook verification failed:", e);
      return res.status(401).json({ message: "Invalid Orb webhook signature" });
    }
    const eventData = event.data as Record<string, unknown> | undefined;
    const eventCustomer = (eventData?.customer as Record<string, unknown>) || {};

    if (event.type === "subscription.billing_period_ended") {
      const customerId = eventCustomer.external_customer_id as string | undefined;
      if (customerId) {
        const periodStart = eventData?.billing_period_start as string | undefined;
        const periodEnd = eventData?.billing_period_end as string | undefined;
        if (periodStart && periodEnd) {
          try {
            await storage.generateInvoice(customerId, periodStart, periodEnd);
          } catch (e) {
            console.error("Orb webhook invoice generation failed:", e);
          }
        }
      }
    } else if (event.type === "invoice.issued") {
      const externalCustomerId = eventCustomer.external_customer_id as string | undefined;
      const orbInvoiceTotal = eventData?.total;
      if (externalCustomerId) {
        console.log(`Orb invoice issued for customer ${externalCustomerId}, total: ${orbInvoiceTotal}`);
      }
    }
    res.json({ received: true });
  });

  app.post("/api/billing/setup-orb", requireAuth, async (req, res) => {
    if (!orbEnabled()) return res.status(503).json({ message: "Orb is not configured" });

    const user = await storage.getUser(req.session.userId!);
    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.role !== "participant") return res.status(403).json({ message: "Only participants can set up billing" });

    if (user.orbCustomerId) {
      return res.json({ orbCustomerId: user.orbCustomerId, orbSubscriptionId: user.orbSubscriptionId });
    }

    await provisionOrbBilling(user);

    const updatedUser = await storage.getUser(user.id);
    if (!updatedUser?.orbCustomerId) {
      return res.status(500).json({ message: "Failed to set up Orb billing" });
    }
    res.json({ orbCustomerId: updatedUser.orbCustomerId, orbSubscriptionId: updatedUser.orbSubscriptionId });
  });

  app.get("/api/billing/usage", requireAuth, async (req, res) => {
    const user = await storage.getUser(req.session.userId!);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (!user.orbCustomerId || !orbEnabled()) {
      return res.json({ usage: null, orbEnabled: orbEnabled() });
    }

    try {
      const usageData = await getCustomerUsage(user.orbCustomerId);
      res.json({ usage: usageData, orbEnabled: true });
    } catch (e) {
      console.error("Failed to fetch Orb usage:", e);
      res.json({ usage: null, orbEnabled: true });
    }
  });

  app.get("/api/worker-availability/:workerId", async (req, res) => {
    const userId = req.session.userId!;
    const userWorkerId = await getWorkerIdForUser(userId);
    const user = await storage.getUser(userId);
    const isOwnWorker = userWorkerId === req.params.workerId;
    const isParticipant = user?.role === "participant";
    if (!isOwnWorker && !isParticipant) {
      return res.status(403).json({ message: "Access denied" });
    }
    const slots = await storage.getWorkerAvailability(req.params.workerId);
    res.json(slots);
  });

  app.post("/api/worker-availability", async (req, res) => {
    const parsed = insertWorkerAvailabilitySchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.message });
    const userWorkerId = await getWorkerIdForUser(req.session.userId!);
    if (!userWorkerId || userWorkerId !== parsed.data.workerId) {
      return res.status(403).json({ message: "You can only manage your own availability" });
    }
    const slot = await storage.createWorkerAvailability(parsed.data);
    res.status(201).json(slot);
  });

  app.delete("/api/worker-availability/:id", async (req, res) => {
    const slot = await storage.getWorkerAvailabilityById(req.params.id);
    if (!slot) return res.status(404).json({ message: "Not found" });
    const userWorkerId = await getWorkerIdForUser(req.session.userId!);
    if (!userWorkerId || userWorkerId !== slot.workerId) {
      return res.status(403).json({ message: "You can only delete your own availability" });
    }
    await storage.deleteWorkerAvailability(req.params.id);
    res.status(204).send();
  });

  app.put("/api/worker-availability/:workerId/bulk", async (req, res) => {
    const userWorkerId = await getWorkerIdForUser(req.session.userId!);
    if (!userWorkerId || userWorkerId !== req.params.workerId) {
      return res.status(403).json({ message: "You can only manage your own availability" });
    }
    const { slots } = req.body;
    if (!Array.isArray(slots)) return res.status(400).json({ message: "slots array required" });
    const results = await storage.setWorkerAvailabilityBulk(req.params.workerId, slots);
    res.json(results);
  });

  app.get("/api/worker-blockouts/:workerId", async (req, res) => {
    const userId = req.session.userId!;
    const userWorkerId = await getWorkerIdForUser(userId);
    const user = await storage.getUser(userId);
    const isOwnWorker = userWorkerId === req.params.workerId;
    const isParticipant = user?.role === "participant";
    if (!isOwnWorker && !isParticipant) {
      return res.status(403).json({ message: "Access denied" });
    }
    const blockouts = await storage.getWorkerBlockouts(req.params.workerId);
    res.json(blockouts);
  });

  app.post("/api/worker-blockouts", async (req, res) => {
    const parsed = insertWorkerBlockoutSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.message });
    const userWorkerId = await getWorkerIdForUser(req.session.userId!);
    if (!userWorkerId || userWorkerId !== parsed.data.workerId) {
      return res.status(403).json({ message: "You can only manage your own blockouts" });
    }
    const blockout = await storage.createWorkerBlockout(parsed.data);
    res.status(201).json(blockout);
  });

  app.delete("/api/worker-blockouts/:id", async (req, res) => {
    const blockout = await storage.getWorkerBlockoutById(req.params.id);
    if (!blockout) return res.status(404).json({ message: "Not found" });
    const userWorkerId = await getWorkerIdForUser(req.session.userId!);
    if (!userWorkerId || userWorkerId !== blockout.workerId) {
      return res.status(403).json({ message: "You can only delete your own blockouts" });
    }
    await storage.deleteWorkerBlockout(req.params.id);
    res.status(204).send();
  });

  app.get("/api/shifts", async (req, res) => {
    const userId = req.session.userId!;
    const user = await storage.getUser(userId);
    const userWorkerId = await getWorkerIdForUser(userId);
    const { dateFrom, dateTo } = req.query as Record<string, string>;

    if (user?.role !== "participant" && user?.role !== "carer") {
      return res.status(403).json({ message: "Access denied" });
    }

    const result = await storage.getShifts({
      participantId: user.role === "participant" ? userId : undefined,
      workerId: user.role === "carer" ? (userWorkerId || undefined) : undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
    });

    if (user.role === "carer") {
      const enriched = await Promise.all(result.map(async (shift) => {
        const participant = shift.participantId ? await storage.getUser(shift.participantId) : null;
        return { ...shift, participantName: participant?.fullName || "Participant" };
      }));
      return res.json(enriched);
    }
    res.json(result);
  });

  app.get("/api/shifts/:id", async (req, res) => {
    const shift = await storage.getShift(req.params.id);
    if (!shift) return res.status(404).json({ message: "Shift not found" });
    const userId = req.session.userId!;
    const userWorkerId = await getWorkerIdForUser(userId);
    if (shift.participantId !== userId && shift.workerId !== userWorkerId) {
      return res.status(403).json({ message: "Access denied" });
    }
    res.json(shift);
  });

  app.post("/api/shifts", async (req, res) => {
    const parsed = insertShiftSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.message });

    const data = parsed.data;
    const userId = req.session.userId!;
    const user = await storage.getUser(userId);
    if (!user || user.role !== "participant") {
      return res.status(403).json({ message: "Only participants can book shifts" });
    }
    if (data.participantId !== userId) {
      return res.status(403).json({ message: "You can only book shifts for yourself" });
    }

    const workerAvail = await storage.getWorkerAvailability(data.workerId);
    const workerBlockoutDates = await storage.getWorkerBlockouts(data.workerId);

    const validateShiftDate = (shiftDate: string, startTime: string, endTime: string) => {
      const blockoutDates = workerBlockoutDates.map(b => b.date);
      if (blockoutDates.includes(shiftDate)) {
        return "Worker has blocked out this date";
      }
      if (workerAvail.length > 0) {
        const dayOfWeek = new Date(shiftDate + "T12:00:00").getDay();
        const daySlots = workerAvail.filter(a => a.dayOfWeek === dayOfWeek);
        if (daySlots.length === 0) {
          return "Worker is not available on this day";
        }
        const fitsSlot = daySlots.some(slot => startTime >= slot.startTime && endTime <= slot.endTime);
        if (!fitsSlot) {
          return "Shift time does not fit within worker's available hours";
        }
      }
      return null;
    };

    const validationError = validateShiftDate(data.date, data.startTime, data.endTime);
    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    if (data.recurrenceRule && data.recurrenceRule !== "none") {
      const createdShifts = [];
      const baseDate = new Date(data.date);
      const weeks = data.recurrenceRule === "weekly" ? 12 : data.recurrenceRule === "fortnightly" ? 6 : 1;

      for (let i = 0; i < weeks; i++) {
        const shiftDate = new Date(baseDate);
        shiftDate.setDate(shiftDate.getDate() + (i * (data.recurrenceRule === "fortnightly" ? 14 : 7)));
        const dateStr = `${shiftDate.getFullYear()}-${String(shiftDate.getMonth() + 1).padStart(2, "0")}-${String(shiftDate.getDate()).padStart(2, "0")}`;
        const err = validateShiftDate(dateStr, data.startTime, data.endTime);
        if (err) continue;
        const shift = await storage.createShift({
          ...data,
          date: dateStr,
        });
        createdShifts.push(shift);
      }
      return res.status(201).json(createdShifts);
    }

    const shift = await storage.createShift(data);
    res.status(201).json(shift);
  });

  app.patch("/api/shifts/:id/status", async (req, res) => {
    const { status, actualHours, notes: shiftNotes } = req.body;
    const validStatuses = ["scheduled", "confirmed", "in_progress", "completed", "cancelled"];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ message: `status must be one of: ${validStatuses.join(", ")}` });
    }

    const shift = await storage.getShift(req.params.id);
    if (!shift) return res.status(404).json({ message: "Shift not found" });

    const userId = req.session.userId!;
    const user = await storage.getUser(userId);
    const userWorkerId = await getWorkerIdForUser(userId);
    const isWorker = shift.workerId === userWorkerId;
    const isParticipant = shift.participantId === userId;
    if (!isWorker && !isParticipant) {
      return res.status(403).json({ message: "Access denied" });
    }

    const workerOnlyTransitions = ["confirmed", "in_progress", "completed"];
    if (workerOnlyTransitions.includes(status) && !isWorker) {
      return res.status(403).json({ message: "Only the assigned worker can perform this transition" });
    }

    if (shift.status === "completed") {
      return res.status(400).json({ message: "Shift is already completed" });
    }
    if (shift.status === "cancelled") {
      return res.status(400).json({ message: "Shift is cancelled and cannot be updated" });
    }

    const validTransitions: Record<string, string[]> = {
      scheduled: ["confirmed", "cancelled"],
      confirmed: ["in_progress", "cancelled"],
      in_progress: ["completed", "cancelled"],
    };
    if (!validTransitions[shift.status]?.includes(status)) {
      return res.status(400).json({ message: `Cannot transition from ${shift.status} to ${status}` });
    }

    if (status === "completed" && !shift.serviceSessionId) {
      const startParts = shift.startTime.split(":");
      const endParts = shift.endTime.split(":");
      const startMins = parseInt(startParts[0]) * 60 + parseInt(startParts[1] || "0");
      const endMins = parseInt(endParts[0]) * 60 + parseInt(endParts[1] || "0");
      const hours = actualHours ? parseFloat(actualHours) : Math.max((endMins - startMins) / 60, 0.25);

      const shiftDateObj = new Date(shift.date + "T12:00:00");
      const dayOfWeek = shiftDateObj.getDay();
      const startHour = parseInt(startParts[0]);
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const isEvening = startHour >= 20 || endParts[0] && parseInt(endParts[0]) >= 20;
      const category = shift.ndisCategory || "Core";

      let ndisItemCode: string;
      if (category === "Capacity Building" || category === "capacity_building") {
        ndisItemCode = "04_104_0125_6_1";
      } else if (isWeekend) {
        ndisItemCode = "01_012_0107_1_1";
      } else if (isEvening) {
        ndisItemCode = "01_013_0107_1_1";
      } else {
        ndisItemCode = "01_011_0107_1_1";
      }

      const rateInfo = await storage.calculateCareRate(shift.participantId, shift.date);

      const priceGuideItems = await fetchPriceGuide(ndisItemCode);
      let effectiveRate = rateInfo.rate;
      if (priceGuideItems.length > 0) {
        const validation = validateRateAgainstPriceGuide(ndisItemCode, rateInfo.rate, priceGuideItems);
        if (!validation.valid && validation.maxRate) {
          effectiveRate = validation.maxRate;
        }
      }

      const totalCharge = (hours * effectiveRate).toFixed(2);

      const sessionData: Parameters<typeof storage.createServiceSession>[0] & { status?: string } = {
        workerId: shift.workerId,
        participantId: shift.participantId,
        startTime: shift.startTime,
        endTime: shift.endTime,
        actualHours: hours.toFixed(2),
        hourlyRate: effectiveRate.toFixed(2),
        tierApplied: rateInfo.tier,
        totalCharge,
        ndisItemCode,
        date: shift.date,
        shiftNotes: shiftNotes || shift.notes || undefined,
      };
      sessionData.status = "completed";
      const session = await storage.createServiceSession(sessionData);

      if (session.totalCharge) {
        await storage.updateBudgetUsage(shift.participantId, "daily_living", Number(session.totalCharge));
      }

      const completionExtra: { actualHours?: string; notes?: string } = {};
      if (actualHours) completionExtra.actualHours = String(actualHours);
      if (shiftNotes !== undefined) completionExtra.notes = shiftNotes;
      const updated = await storage.updateShiftStatus(req.params.id, "completed", session.id, Object.keys(completionExtra).length ? completionExtra : undefined);
      return res.json({ shift: updated, session });
    }

    const extraData: { actualHours?: string; notes?: string } = {};
    if (actualHours) extraData.actualHours = String(actualHours);
    if (shiftNotes !== undefined) extraData.notes = shiftNotes;
    const updated = await storage.updateShiftStatus(req.params.id, status, undefined, Object.keys(extraData).length ? extraData : undefined);
    res.json({ shift: updated });
  });

  app.delete("/api/shifts/:id", async (req, res) => {
    const shift = await storage.getShift(req.params.id);
    if (!shift) return res.status(404).json({ message: "Shift not found" });
    const userId = req.session.userId!;
    const userWorkerId = await getWorkerIdForUser(userId);
    if (shift.participantId !== userId && shift.workerId !== userWorkerId) {
      return res.status(403).json({ message: "Access denied" });
    }
    await storage.deleteShift(req.params.id);
    res.status(204).send();
  });

  app.post("/api/ndis/sync-plan", async (req, res) => {
    const userId = req.session.userId!;
    try {
      const user = await storage.getUser(userId);
      const ndisNumber = user?.ndisNumber || undefined;
      const plan = await syncParticipantPlan(userId, ndisNumber);
      res.json(plan);
    } catch (error) {
      console.error("NDIS plan sync error:", error);
      res.status(500).json({ message: "Failed to sync NDIS plan" });
    }
  });

  app.get("/api/ndis/plan/:participantId", async (req, res) => {
    const userId = req.session.userId!;
    if (req.params.participantId !== userId) {
      return res.status(403).json({ message: "You can only view your own NDIS plan" });
    }
    const plan = await getCachedPlan(req.params.participantId);
    if (!plan) return res.status(404).json({ message: "No cached plan found. Sync first." });
    res.json(plan);
  });

  app.get("/api/ndis/price-guide", async (_req, res) => {
    const itemCode = _req.query.itemCode as string | undefined;
    const items = await fetchPriceGuide(itemCode);
    res.json(items);
  });

  app.post("/api/ndis/validate-rate", async (req, res) => {
    const { itemCode, rate } = req.body;
    if (!itemCode || rate === undefined) {
      return res.status(400).json({ message: "itemCode and rate required" });
    }
    const priceGuide = await fetchPriceGuide(itemCode);
    const result = validateRateAgainstPriceGuide(itemCode, Number(rate), priceGuide);
    res.json(result);
  });

  app.post("/api/ndis/submit-claim", async (req, res) => {
    const userId = req.session.userId!;
    const user = await storage.getUser(userId);
    if (!user || user.role !== "participant") {
      return res.status(403).json({ message: "Only participants can submit claims" });
    }

    const { itemCode, quantity, unitPrice, serviceDate, claimReference, serviceSessionId } = req.body;
    if (!itemCode || !quantity || !unitPrice || !serviceDate) {
      return res.status(400).json({ message: "itemCode, quantity, unitPrice, and serviceDate are required" });
    }

    if (serviceSessionId) {
      const sessions = await storage.getServiceSessions(userId);
      const ownsSession = sessions.some(s => s.id === serviceSessionId);
      if (!ownsSession) {
        return res.status(403).json({ message: "You can only submit claims for your own service sessions" });
      }
    }

    const priceGuideItems = await fetchPriceGuide(itemCode);
    if (priceGuideItems.length > 0) {
      const validation = validateRateAgainstPriceGuide(itemCode, Number(unitPrice), priceGuideItems);
      if (!validation.valid) {
        return res.status(400).json({ message: validation.message });
      }
    }

    try {
      const result = await submitNdisClaim({
        participantId: userId,
        providerId: user.ndisNumber ? `PROV-${user.ndisNumber}` : "MAPABLE-001",
        itemCode,
        quantity: Number(quantity),
        unitPrice: Number(unitPrice),
        serviceDate,
        claimReference: claimReference || `REF-${Date.now()}`,
      });
      res.json(result);
    } catch (error) {
      console.error("Claim submission error:", error);
      res.status(500).json({ message: "Failed to submit claim" });
    }
  });

  return httpServer;
}
