export type {
  AccessChangeCandidate,
  AccessChangeOutcome,
  AccessChangeReview,
  AccessChangeReviewDecision,
} from "./types";
export {
  clearShadowChangeReviews,
  detectAccessChange,
  listShadowChangeReviews,
  storeShadowChangeReview,
} from "./compare";
export {
  AccessChangeReviewPersistError,
  decideChangeReview,
  listPendingChangeReviews,
  persistChangeReview,
} from "./persist";
export type { PersistChangeReviewInput } from "./persist";
