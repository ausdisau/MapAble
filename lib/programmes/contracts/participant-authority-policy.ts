export interface AuthorityEvaluationInput {
  participantId: string;
  actorUserId: string;
  purpose: string;
  requestedFields: string[];
  requestedAction?: string;
}

export interface AuthorityEvaluationResult {
  allowed: boolean;
  allowedFields: string[];
  reason?: string;
  grantId?: string;
}

export interface ParticipantAuthorityPolicy {
  evaluateAuthority(
    input: AuthorityEvaluationInput,
  ): Promise<AuthorityEvaluationResult>;
}
