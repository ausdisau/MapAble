import express, { type Request, type Response, type NextFunction } from "express";
import session from "express-session";
import createMemoryStore from "memorystore";
import { createServer, type Server } from "http";
import type { AddressInfo } from "net";
import { registerRoutes } from "../routes";

const MemoryStore = createMemoryStore(session);

export interface TestServer {
  baseUrl: string;
  httpServer: Server;
  close: () => Promise<void>;
}

/**
 * Build an Express app that mirrors server/index.ts request handling (JSON body
 * with rawBody capture, urlencoded, session, route registration, error handler)
 * but without the DB-backed session store, seeding, Vite, or the listen call.
 *
 * Sessions use an in-memory store so unauthenticated smoke tests never touch the
 * database. Route handlers that DO hit the database are intentionally not
 * exercised here — these are registration/contract smoke tests.
 */
export async function createTestApp() {
  const app = express();
  const httpServer = createServer(app);

  app.use(
    express.json({
      verify: (req, _res, buf) => {
        (req as Request).rawBody = buf;
      },
    }),
  );
  app.use(express.urlencoded({ extended: false }));

  app.use(
    session({
      store: new MemoryStore({ checkPeriod: 86400000 }),
      secret: "smoke-test-secret",
      resave: false,
      saveUninitialized: false,
    }),
  );

  await registerRoutes(httpServer, app);

  app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
    if (res.headersSent) return next(err);
    res.status(err.status || err.statusCode || 500).json({
      message: err.message || "Internal Server Error",
    });
  });

  return { app, httpServer };
}

/** Start the test app on an ephemeral port and return its base URL + closer. */
export async function startTestServer(): Promise<TestServer> {
  const { httpServer } = await createTestApp();
  await new Promise<void>((resolve) => {
    httpServer.listen(0, "127.0.0.1", () => resolve());
  });
  const { port } = httpServer.address() as AddressInfo;
  return {
    baseUrl: `http://127.0.0.1:${port}`,
    httpServer,
    close: () =>
      new Promise<void>((resolve, reject) =>
        httpServer.close((err) => (err ? reject(err) : resolve())),
      ),
  };
}
