import { createApiCasesRepository } from "./api/repositories/casesRepository";
import { createApiEvidenceRepository } from "./api/repositories/evidenceRepository";
import { createApiRelationsRepository } from "./api/repositories/relationsRepository";
import { createApiLedgerRepository } from "./api/repositories/ledgerRepository";
import { createApiExportRepository } from "./api/repositories/exportRepository";
import type { CasesRepository } from "./api/types/cases";
import type { EvidenceRepository } from "./api/types/evidence";
import type { RelationsRepository } from "./api/types/relations";
import type { LedgerRepository } from "./api/types/ledger";

export type { CasesRepository, EvidenceRepository, RelationsRepository, LedgerRepository };

export const repositories = {
  cases: createApiCasesRepository(),
  evidence: createApiEvidenceRepository(),
  relations: createApiRelationsRepository(),
  ledger: createApiLedgerRepository(),
  export: createApiExportRepository(),
};

export type Repositories = typeof repositories;
