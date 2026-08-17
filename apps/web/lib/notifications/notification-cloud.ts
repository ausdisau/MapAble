import type { NotificationCategory } from "@prisma/client";

import { notifyUser } from "@/lib/notifications/notification-service";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/sendGrid";

export type NotificationChannel = "in_app" | "email";

export type DeliveryReceipt = {
  notificationId: string;
  recipient: string;
  purpose: string;
  channel: NotificationChannel;
  templateVersion: string;
  attempts: number;
  deliveryState: "delivered" | "skipped" | "failed" | "pending";
  receiptId: string;
};

const TEMPLATE_VERSION = "notification-cloud-1.0.0";

const CLINICAL_PREVIEW_PATTERN =
  /\b(diagnos|symptom|medication|prescri|clinical|safeguard|abuse|neglect|capacity|treatment|health record|progress note)\b/i;

export function redactNotificationPreview(text: string): string {
  if (!text) return "";
  if (CLINICAL_PREVIEW_PATTERN.test(text)) {
    return "You have a new notification. Sign in to view details securely.";
  }
  return text.length > 160 ? `${text.slice(0, 157)}…` : text;
}

async function isChannelEnabled(
  userId: string,
  category: NotificationCategory,
  channel: NotificationChannel,
): Promise<boolean> {
  const pref = await prisma.notificationPreference.findFirst({
    where: { userId, category, channel, enabled: true },
  });
  return Boolean(pref);
}

export async function deliverNotificationCloud(params: {
  userId: string;
  category: NotificationCategory;
  purpose: string;
  title: string;
  body: string;
  email?: string;
  channels?: NotificationChannel[];
}): Promise<DeliveryReceipt[]> {
  const channels = params.channels ?? ["in_app", "email"];
  const receipts: DeliveryReceipt[] = [];
  const safeTitle = redactNotificationPreview(params.title);
  const safeBody = redactNotificationPreview(params.body);

  for (const channel of channels) {
    const receiptId = crypto.randomUUID();
    const enabled = await isChannelEnabled(
      params.userId,
      params.category,
      channel,
    );

    if (!enabled) {
      receipts.push({
        notificationId: "",
        recipient: params.userId,
        purpose: params.purpose,
        channel,
        templateVersion: TEMPLATE_VERSION,
        attempts: 0,
        deliveryState: "skipped",
        receiptId,
      });
      continue;
    }

    if (channel === "in_app") {
      try {
        const notification = await notifyUser(
          params.userId,
          params.category,
          safeTitle,
          safeBody,
        );
        receipts.push({
          notificationId: notification?.id ?? "",
          recipient: params.userId,
          purpose: params.purpose,
          channel,
          templateVersion: TEMPLATE_VERSION,
          attempts: 1,
          deliveryState: notification ? "delivered" : "skipped",
          receiptId,
        });
      } catch {
        receipts.push({
          notificationId: "",
          recipient: params.userId,
          purpose: params.purpose,
          channel,
          templateVersion: TEMPLATE_VERSION,
          attempts: 1,
          deliveryState: "failed",
          receiptId,
        });
      }
      continue;
    }

    if (channel === "email") {
      if (!params.email) {
        receipts.push({
          notificationId: "",
          recipient: params.userId,
          purpose: params.purpose,
          channel,
          templateVersion: TEMPLATE_VERSION,
          attempts: 0,
          deliveryState: "skipped",
          receiptId,
        });
        continue;
      }

      const sendGridConfigured = Boolean(
        process.env.SENDGRID_API_KEY?.trim() &&
          process.env.SENDGRID_FROM_EMAIL?.trim(),
      );

      if (!sendGridConfigured) {
        receipts.push({
          notificationId: "",
          recipient: params.userId,
          purpose: params.purpose,
          channel,
          templateVersion: TEMPLATE_VERSION,
          attempts: 0,
          deliveryState: "skipped",
          receiptId,
        });
        continue;
      }

      try {
        await sendEmail({
          to: params.email,
          subject: safeTitle,
          text: safeBody,
        });
        receipts.push({
          notificationId: receiptId,
          recipient: params.userId,
          purpose: params.purpose,
          channel,
          templateVersion: TEMPLATE_VERSION,
          attempts: 1,
          deliveryState: "delivered",
          receiptId,
        });
      } catch {
        receipts.push({
          notificationId: "",
          recipient: params.userId,
          purpose: params.purpose,
          channel,
          templateVersion: TEMPLATE_VERSION,
          attempts: 1,
          deliveryState: "failed",
          receiptId,
        });
      }
    }
  }

  return receipts;
}
