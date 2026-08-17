import { NextResponse } from "next/server";

import { requireApiSession } from "@/lib/api/auth-handler";
import { isAdminRole } from "@/lib/auth/roles";
import { canAccessMessageThread } from "@/lib/messages/message-access-policy";

const typingStore = new Map<string, Map<string, number>>();

function threadKey(conversationId: string) {
  return conversationId;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const { conversationId } = await params;

  const allowed = await canAccessMessageThread(user.id, conversationId, {
    isAdmin: isAdminRole(user.primaryRole),
  });
  if (!allowed) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const now = Date.now();
  const map = typingStore.get(threadKey(conversationId)) ?? new Map();
  const typingUserIds = [...map.entries()]
    .filter(([, expires]) => expires > now)
    .map(([uid]) => uid);

  return NextResponse.json({ typingUserIds });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const { conversationId } = await params;
  const body = await request.json();
  const action = body.action === "start" ? "start" : "stop";

  const allowed = await canAccessMessageThread(user.id, conversationId, {
    isAdmin: isAdminRole(user.primaryRole),
  });
  if (!allowed) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const key = threadKey(conversationId);
  if (!typingStore.has(key)) typingStore.set(key, new Map());
  const map = typingStore.get(key)!;

  if (action === "start") {
    map.set(user.id, Date.now() + 5000);
  } else {
    map.delete(user.id);
  }

  return NextResponse.json({ ok: true });
}
