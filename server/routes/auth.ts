import type { Express } from "express";
import crypto from "crypto";
import { z } from "zod";
import { storage } from "../storage";
import { lookupParticipant, lookupProvider, lookupWorkerScreening } from "../ndis-api";
import { requireAuth, sanitizeUser } from "./shared";

export function registerAuthRoutes(app: Express) {
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

    res.json(sanitizeUser(user));
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
    res.json({ ...sanitizeUser(user), auth0Login: !!req.session.auth0Login });
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
      res.status(201).json(sanitizeUser(user));
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
      req.path === "/stripe/config" ||
      req.path === "/quickbooks/config" ||
      req.path === "/quickbooks/callback" ||
      req.path === "/quickbooks/webhook"
    ) {
      return next();
    }
    requireAuth(req, res, next);
  });
}
