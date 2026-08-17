export type {
  AccessOntologyConcept,
  AccessOntologyVersion,
  OntologyDataType,
  OntologyDomain,
  PersonalFitBehaviour,
} from "./types";
export { ACCESS_ONTOLOGY_V1, ONTOLOGY_CONCEPTS_V1, getOntologyConcept } from "./seed-v1";
export {
  ACCESS_ONTOLOGY_V2,
  ONTOLOGY_CONCEPTS_V2,
  ONTOLOGY_CONCEPT_ALIASES_V1_TO_V2,
  getOntologyConceptV2,
  listAccessDomainsInOntology,
  resolveOntologyConceptId,
} from "./seed-v2";

import { ACCESS_ONTOLOGY_V2 } from "./seed-v2";

/** Canonical ontology for Access as Infrastructure (v2). */
export const ACCESS_ONTOLOGY_CURRENT = ACCESS_ONTOLOGY_V2;
