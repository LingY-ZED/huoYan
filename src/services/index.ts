import { createApiCasesRepository } from "./api/repositories/casesRepository";
import { createApiEvidenceRepository } from "./api/repositories/evidenceRepository";
import { createApiRelationsRepository } from "./api/repositories/relationsRepository";
import type { CasesRepository } from "./api/types/cases";
import type { EvidenceRepository } from "./api/types/evidence";
import type { RelationsRepository } from "./api/types/relations";

export const repositories = {
  cases: createApiCasesRepository(),
  evidence: createApiEvidenceRepository(),
  relations: createApiRelationsRepository(),
};

export type Repositories = typeof repositories;
