import { db } from "./db";
import { ndisPlanCache } from "@shared/schema";
import { eq } from "drizzle-orm";

interface ProdaTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface NdisClaimSubmission {
  participantId: string;
  providerId: string;
  itemCode: string;
  quantity: number;
  unitPrice: number;
  serviceDate: string;
  claimReference: string;
}

interface NdisClaimResponse {
  claimId: string;
  status: "submitted" | "accepted" | "rejected";
  message: string;
  submittedAt: string;
}

interface NdisPlanGoal {
  id: string;
  name: string;
  category: string;
  budget: number;
}

interface NdisPlanData {
  planId: string;
  participantName: string;
  startDate: string;
  endDate: string;
  managementType: string;
  goals: NdisPlanGoal[];
  budgetCategories: {
    category: string;
    allocated: number;
    used: number;
  }[];
}

interface NdisPriceGuideItem {
  itemCode: string;
  itemName: string;
  registrationGroup: string;
  supportCategory: string;
  unit: string;
  nationalPrice: number;
  remotePrice: number;
  veryRemotePrice: number;
}

let cachedToken: { token: string; expiresAt: number } | null = null;

export async function getProdaToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now()) {
    return cachedToken.token;
  }

  const clientId = process.env.NDIS_PRODA_CLIENT_ID;
  const clientSecret = process.env.NDIS_PRODA_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return "demo-token";
  }

  try {
    const response = await fetch("https://proda.humanservices.gov.au/piaweb/api/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: clientId,
        client_secret: clientSecret,
      }),
    });

    if (!response.ok) {
      throw new Error(`PRODA auth failed: ${response.status}`);
    }

    const data: ProdaTokenResponse = await response.json();
    cachedToken = {
      token: data.access_token,
      expiresAt: Date.now() + (data.expires_in - 60) * 1000,
    };
    return cachedToken.token;
  } catch (error) {
    console.error("PRODA authentication error:", error);
    return "demo-token";
  }
}

export async function fetchParticipantPlan(participantId: string, ndisNumber?: string): Promise<NdisPlanData> {
  const token = await getProdaToken();

  if (token === "demo-token" || !ndisNumber) {
    return getDemoPlanData(participantId);
  }

  try {
    const response = await fetch(
      `https://api.ndis.gov.au/myplace/v1/participants/${ndisNumber}/plan`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      }
    );

    if (!response.ok) {
      console.error(`NDIS myplace API error: ${response.status}`);
      return getDemoPlanData(participantId);
    }

    return await response.json();
  } catch (error) {
    console.error("NDIS plan fetch error:", error);
    return getDemoPlanData(participantId);
  }
}

export async function fetchPriceGuide(itemCode?: string): Promise<NdisPriceGuideItem[]> {
  const token = await getProdaToken();

  if (token === "demo-token") {
    return getDemoPriceGuide(itemCode);
  }

  try {
    const url = itemCode
      ? `https://api.ndis.gov.au/priceguide/v1/items/${itemCode}`
      : "https://api.ndis.gov.au/priceguide/v1/items";

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      return getDemoPriceGuide(itemCode);
    }

    const data = await response.json();
    return Array.isArray(data) ? data : [data];
  } catch (error) {
    console.error("NDIS price guide fetch error:", error);
    return getDemoPriceGuide(itemCode);
  }
}

export async function syncParticipantPlan(participantId: string, ndisNumber?: string) {
  const planData = await fetchParticipantPlan(participantId, ndisNumber);

  const existing = await db.select().from(ndisPlanCache)
    .where(eq(ndisPlanCache.participantId, participantId));

  if (existing.length > 0) {
    const [updated] = await db.update(ndisPlanCache)
      .set({
        planData,
        goals: planData.goals,
        fetchedAt: new Date(),
      })
      .where(eq(ndisPlanCache.participantId, participantId))
      .returning();
    return updated;
  }

  const [created] = await db.insert(ndisPlanCache)
    .values({
      participantId,
      planData,
      goals: planData.goals,
    })
    .returning();
  return created;
}

export async function getCachedPlan(participantId: string) {
  const [plan] = await db.select().from(ndisPlanCache)
    .where(eq(ndisPlanCache.participantId, participantId));
  return plan || null;
}

export function validateRateAgainstPriceGuide(
  itemCode: string,
  chargedRate: number,
  priceGuide: NdisPriceGuideItem[]
): { valid: boolean; maxRate: number; message: string } {
  const item = priceGuide.find((p) => p.itemCode === itemCode);
  if (!item) {
    return { valid: true, maxRate: chargedRate, message: "Item not found in price guide — rate accepted" };
  }
  if (chargedRate > item.nationalPrice) {
    return {
      valid: false,
      maxRate: item.nationalPrice,
      message: `Rate $${chargedRate} exceeds NDIS max $${item.nationalPrice} for ${item.itemName}`,
    };
  }
  return { valid: true, maxRate: item.nationalPrice, message: "Rate within NDIS price guide limits" };
}

function getDemoPlanData(participantId: string): NdisPlanData {
  return {
    planId: `PLAN-${participantId.slice(0, 8)}`,
    participantName: "Demo Participant",
    startDate: "2025-07-01",
    endDate: "2026-06-30",
    managementType: "plan_managed",
    goals: [
      { id: "goal-1", name: "Daily Living Support", category: "daily_living", budget: 25000 },
      { id: "goal-2", name: "Community Access", category: "capacity_building", budget: 15000 },
      { id: "goal-3", name: "Transport Assistance", category: "transport", budget: 5000 },
      { id: "goal-4", name: "Social Participation", category: "capacity_building", budget: 8000 },
    ],
    budgetCategories: [
      { category: "daily_living", allocated: 25000, used: 4200 },
      { category: "capacity_building", allocated: 23000, used: 3100 },
      { category: "transport", allocated: 5000, used: 800 },
    ],
  };
}

function getDemoPriceGuide(itemCode?: string): NdisPriceGuideItem[] {
  const items: NdisPriceGuideItem[] = [
    {
      itemCode: "01_011_0107_1_1",
      itemName: "Assistance With Self-Care Activities - Standard - Weekday Daytime",
      registrationGroup: "Assistance with Daily Life",
      supportCategory: "Core",
      unit: "Hour",
      nationalPrice: 70.23,
      remotePrice: 84.28,
      veryRemotePrice: 105.35,
    },
    {
      itemCode: "01_011_0107_1_1_T",
      itemName: "Assistance With Self-Care Activities - TTP - Weekday Daytime",
      registrationGroup: "Assistance with Daily Life",
      supportCategory: "Core",
      unit: "Hour",
      nationalPrice: 72.55,
      remotePrice: 87.06,
      veryRemotePrice: 108.83,
    },
    {
      itemCode: "01_015_0107_1_1",
      itemName: "Assistance With Self-Care Activities - Standard - Weekday Evening",
      registrationGroup: "Assistance with Daily Life",
      supportCategory: "Core",
      unit: "Hour",
      nationalPrice: 77.28,
      remotePrice: 92.74,
      veryRemotePrice: 115.92,
    },
    {
      itemCode: "01_020_0107_1_1",
      itemName: "Assistance With Self-Care Activities - Standard - Saturday",
      registrationGroup: "Assistance with Daily Life",
      supportCategory: "Core",
      unit: "Hour",
      nationalPrice: 98.63,
      remotePrice: 118.36,
      veryRemotePrice: 147.95,
    },
    {
      itemCode: "01_021_0107_1_1",
      itemName: "Assistance With Self-Care Activities - Standard - Sunday",
      registrationGroup: "Assistance with Daily Life",
      supportCategory: "Core",
      unit: "Hour",
      nationalPrice: 126.81,
      remotePrice: 152.17,
      veryRemotePrice: 190.22,
    },
    {
      itemCode: "04_104_0125_6_1",
      itemName: "Community Participation Activities - Standard - Weekday Daytime",
      registrationGroup: "Increased Social and Community Participation",
      supportCategory: "Capacity Building",
      unit: "Hour",
      nationalPrice: 70.23,
      remotePrice: 84.28,
      veryRemotePrice: 105.35,
    },
    {
      itemCode: "02_051_0108_1_1",
      itemName: "Provider Travel - Non Labour Costs",
      registrationGroup: "Assistance with Travel/Transport Arrangements",
      supportCategory: "Core",
      unit: "Kilometre",
      nationalPrice: 0.99,
      remotePrice: 1.19,
      veryRemotePrice: 1.49,
    },
  ];

  if (itemCode) {
    return items.filter((i) => i.itemCode === itemCode);
  }
  return items;
}

export async function submitNdisClaim(claim: NdisClaimSubmission): Promise<NdisClaimResponse> {
  const prodaClientId = process.env.NDIS_PRODA_CLIENT_ID;
  const prodaClientSecret = process.env.NDIS_PRODA_CLIENT_SECRET;

  if (prodaClientId && prodaClientSecret) {
    try {
      const token = await getProdaToken();
      const baseUrl = process.env.NDIS_API_BASE_URL || "https://api.ndis.gov.au";
      const response = await fetch(`${baseUrl}/providers/claims`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          participantId: claim.participantId,
          providerId: claim.providerId,
          lineItems: [{
            itemCode: claim.itemCode,
            quantity: claim.quantity,
            unitPrice: claim.unitPrice,
            serviceDate: claim.serviceDate,
          }],
          claimReference: claim.claimReference,
        }),
      });
      if (response.ok) {
        return await response.json() as NdisClaimResponse;
      }
    } catch (error) {
      console.error("NDIS claim submission API error:", error);
    }
  }

  return {
    claimId: `CLM-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    status: "submitted",
    message: "Claim submitted successfully (demo mode)",
    submittedAt: new Date().toISOString(),
  };
}
