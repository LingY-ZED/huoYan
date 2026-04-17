export type EvidenceSeverity = "high" | "medium" | "low";

export type EvidenceKeywordPosition = {
  word: string;
  evidenceId: string;
};

export type EvidenceConclusion =
  | {
      id: string;
      type: "price_anomaly";
      severity: EvidenceSeverity;
      title: string;
      evidence: {
        quotedPrice: number;
        unit: string;
        referencePrice: number;
        product: string;
        discountPercent: number;
        rawText: string;
        evidenceIds: string[];
      };
    }
  | {
      id: string;
      type: "subjective_knowledge";
      severity: EvidenceSeverity;
      title: string;
      evidence: {
        rawQuote: string;
        speaker: string;
        keywords: string[];
        keywordPositions: EvidenceKeywordPosition[];
      };
    }
  | {
      id: string;
      type: "key_entity";
      severity: EvidenceSeverity;
      title: string;
      evidence: {
        entities: Array<{
          name: string;
          role: string;
          phone?: string;
          bankAccount?: string;
        }>;
      };
    };

export type EvidenceAnalysisResult = {
  evidenceCount: number;
  conclusions: EvidenceConclusion[];
};

