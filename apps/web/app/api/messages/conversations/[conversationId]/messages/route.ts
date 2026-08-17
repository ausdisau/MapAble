import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { isAdminRole } from "@/lib/auth/roles";
import {
  sendMessage,
  userCanAccessConversation,
} from "@/lib/messages/message-service";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const { conversationId } = await params;

  if (
    !(await userCanAccessConversation(
      user.id,
      conversationId,
      isAdminRole(user.primaryRole)
    ))
  ) {
    return jsonError("Forbidden", 403);
  }

  const { body, plainLanguageSummary, attachmentDocumentIds } =
    await req.json();
  try {
    const message = await sendMessage({
      conversationId,
      senderUserId: user.id,
      body,
      plainLanguageSummary,
      attachmentDocumentIds,
    });
    return jsonOk({ message }, 201);
  } catch {
    return jsonError("Message could not be sent", 400);
  }
}
