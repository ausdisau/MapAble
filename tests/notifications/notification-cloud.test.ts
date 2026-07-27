import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/notifications/notification-service", () => ({
  notifyUser: vi.fn(),
}));

vi.mock("@/lib/sendGrid", () => ({
  sendEmail: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    notificationPreference: { findFirst: vi.fn() },
  },
}));

import { sendEmail } from "@/lib/sendGrid";
import {
  deliverNotificationCloud,
  redactNotificationPreview,
} from "@/lib/notifications/notification-cloud";
import { notifyUser } from "@/lib/notifications/notification-service";
import { prisma } from "@/lib/prisma";

describe("notification cloud", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.SENDGRID_API_KEY;
    delete process.env.SENDGRID_FROM_EMAIL;
  });

  it("redacts clinical content from previews", () => {
    expect(
      redactNotificationPreview("Your medication schedule was updated"),
    ).toBe("You have a new notification. Sign in to view details securely.");
    expect(redactNotificationPreview("Booking confirmed for Tuesday")).toBe(
      "Booking confirmed for Tuesday",
    );
  });

  it("skips channels when preferences are disabled", async () => {
    vi.mocked(prisma.notificationPreference.findFirst).mockResolvedValue(null);

    const receipts = await deliverNotificationCloud({
      userId: "user-1",
      category: "booking",
      purpose: "shift.reminder",
      title: "Shift reminder",
      body: "Your shift starts soon",
      channels: ["in_app"],
    });

    expect(receipts).toHaveLength(1);
    expect(receipts[0]?.deliveryState).toBe("skipped");
    expect(notifyUser).not.toHaveBeenCalled();
  });

  it("delivers in-app when preference enabled", async () => {
    vi.mocked(prisma.notificationPreference.findFirst).mockResolvedValue({
      enabled: true,
    } as never);
    vi.mocked(notifyUser).mockResolvedValue({ id: "notif-1" } as never);

    const receipts = await deliverNotificationCloud({
      userId: "user-1",
      category: "booking",
      purpose: "shift.reminder",
      title: "Shift reminder",
      body: "Your shift starts soon",
      channels: ["in_app"],
    });

    expect(receipts[0]?.deliveryState).toBe("delivered");
    expect(receipts[0]?.notificationId).toBe("notif-1");
    expect(notifyUser).toHaveBeenCalledWith(
      "user-1",
      "booking",
      "Shift reminder",
      "Your shift starts soon",
    );
  });

  it("skips email when SendGrid is not configured", async () => {
    vi.mocked(prisma.notificationPreference.findFirst).mockResolvedValue({
      enabled: true,
    } as never);

    const receipts = await deliverNotificationCloud({
      userId: "user-1",
      category: "system",
      purpose: "account.update",
      title: "Account update",
      body: "Your settings changed",
      email: "user@example.com",
      channels: ["email"],
    });

    expect(receipts[0]?.deliveryState).toBe("skipped");
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it("sends email when configured and preference enabled", async () => {
    process.env.SENDGRID_API_KEY = "sg.test";
    process.env.SENDGRID_FROM_EMAIL = "noreply@example.com";
    vi.mocked(prisma.notificationPreference.findFirst).mockResolvedValue({
      enabled: true,
    } as never);
    vi.mocked(sendEmail).mockResolvedValue(undefined);

    const receipts = await deliverNotificationCloud({
      userId: "user-1",
      category: "system",
      purpose: "account.update",
      title: "Account update",
      body: "Your settings changed",
      email: "user@example.com",
      channels: ["email"],
    });

    expect(receipts[0]?.deliveryState).toBe("delivered");
    expect(sendEmail).toHaveBeenCalled();
  });
});
