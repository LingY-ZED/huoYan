import { createMockCasesRepository } from "./repositories/casesRepository";
import { createMockEvidenceRepository } from "./repositories/evidenceRepository";
import { createMockRelationsRepository } from "./repositories/relationsRepository";
import { createApiCasesRepository } from "./api/repositories/casesRepository";
import { createApiEvidenceRepository } from "./api/repositories/evidenceRepository";
import { createApiRelationsRepository } from "./api/repositories/relationsRepository";
import type { CasesRepository } from "./api/types/cases";
import type { EvidenceRepository } from "./api/types/evidence";
import type { RelationsRepository } from "./api/types/relations";

export type RepositoryType = "mock" | "real";

const REPO_TYPE = (import.meta.env.VITE_REPO_TYPE as RepositoryType) ?? "mock";

function select<T>(real: () => T, mock: () => T): T {
  return REPO_TYPE === "real" ? real() : mock();
}

function createCasesRepository(): CasesRepository {
  return select(
    () => createApiCasesRepository(),
    () => createMockCasesRepository()
  );
}

function createEvidenceRepository(): EvidenceRepository {
  return select(
    () => createApiEvidenceRepository(),
    () => createMockEvidenceRepository()
  );
}

function createRelationsRepository(): RelationsRepository {
  return select(
    () => createApiRelationsRepository(),
    () => createMockRelationsRepository()
  );
}

export const repositories = {
  cases: createCasesRepository(),
  evidence: createEvidenceRepository(),
  relations: createRelationsRepository(),
};
