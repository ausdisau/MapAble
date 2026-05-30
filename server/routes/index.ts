import type { Express } from "express";
  import type { Server } from "http";
  import { registerObjectStorageRoutes } from "../replit_integrations/object_storage";
  import { qbEnabled, startPaymentPolling } from "../quickbooks";
  import { registerAuthRoutes } from "./auth";
  import { registerAbnProfileRoutes } from "./abn-profile";
  import { registerWorkerRoutes } from "./worker";
  import { registerCatalogueRoutes } from "./catalogue";
  import { registerPricingBillingRoutes } from "./pricing-billing";
  import { registerChatCommunityRoutes } from "./chat-community";
  import { registerPaymentRoutes } from "./payments";
  import { registerSchedulingNdisRoutes } from "./scheduling-ndis";
  import { registerQuickBooksRoutes } from "./quickbooks";
  import { registerGroceryRoutes } from "./grocery";
  import { registerGeoRoutes } from "./geo";

  export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {
    registerAuthRoutes(app);
    registerObjectStorageRoutes(app);
    registerAbnProfileRoutes(app);
    registerWorkerRoutes(app);
    registerCatalogueRoutes(app);
    registerPricingBillingRoutes(app);
    registerChatCommunityRoutes(app);
    registerPaymentRoutes(app);
    registerSchedulingNdisRoutes(app);
    registerQuickBooksRoutes(app);
    if (qbEnabled()) {
      startPaymentPolling();
    }
    registerGroceryRoutes(app);
    registerGeoRoutes(app);
    return httpServer;
  }
  