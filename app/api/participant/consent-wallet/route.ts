import { NextResponse } from "next/server";

import { requireApiSession } from "@/lib/api/auth-handler";
import {
  issueWalletAuthorityCredential,
  issueWalletDocumentCredential,
  listWalletCredentials,
  revokeWalletAuthorityCredential,
  revokeWalletDocumentCredential,
} from "@/lib/careos/opportunities/consent-wallet";

export async function GET() {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  try {
    const wallet = await listWalletCredentials(user.id);
    return NextResponse.json(wallet);
  } catch (error) {
    const message = error instanceof Error ? error.message : "WALLET_ERROR";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function POST(request: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const body = (await request.json()) as {
    action?: string;
    delegateId?: string;
    domain?: string;
    actions?: string[];
    consentScopes?: string[];
    expiresAt?: string;
    purpose?: string;
    documentId?: string;
    granteeUserId?: string;
    grantId?: string;
    kind?: "authority" | "document";
  };

  try {
    if (body.action === "revoke") {
      if (!body.grantId || !body.kind) {
        return NextResponse.json({ error: "REVOKE_INVALID" }, { status: 400 });
      }
      if (body.kind === "authority") {
        const receipt = await revokeWalletAuthorityCredential({
          grantId: body.grantId,
          participantId: user.id,
        });
        return NextResponse.json({ preferentialReceipt: receipt });
      }
      const result = await revokeWalletDocumentCredential({
        grantId: body.grantId,
        participantId: user.id,
      });
      return NextResponse.json(result);
    }

    if (body.action === "issue_document") {
      if (!body.documentId || !body.granteeUserId || !body.expiresAt || !body.purpose) {
        return NextResponse.json({ error: "ISSUE_DOCUMENT_INVALID" }, { status: 400 });
      }
      const result = await issueWalletDocumentCredential({
        participantId: user.id,
        documentId: body.documentId,
        granteeUserId: body.granteeUserId,
        purpose: body.purpose,
        expiresAt: new Date(body.expiresAt),
      });
      return NextResponse.json(result, { status: 201 });
    }

    if (!body.delegateId || !body.domain || !body.expiresAt || !body.purpose) {
      return NextResponse.json({ error: "ISSUE_AUTHORITY_INVALID" }, { status: 400 });
    }

    const result = await issueWalletAuthorityCredential({
      participantId: user.id,
      delegateId: body.delegateId,
      domain: body.domain,
      actions: body.actions ?? ["read"],
      consentScopes: body.consentScopes ?? [],
      expiresAt: new Date(body.expiresAt),
      purpose: body.purpose,
    });
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "WALLET_ERROR";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
