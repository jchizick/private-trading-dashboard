import type { FearGreedSnapshot } from "@/types/dashboard";

export type FearGreedClassification =
  | "Extreme Fear"
  | "Fear"
  | "Neutral"
  | "Greed"
  | "Extreme Greed";

export interface FearGreedReading {
  timestamp: string;
  value: number;
  valueClassification: FearGreedClassification;
  source: "CMC Crypto Fear and Greed Index";
  updatedAt: string;
}

export interface FearGreedApiResponse {
  data?: Array<{
    timestamp?: string | number;
    value?: string | number;
    value_classification?: string;
  }>;
  status?: {
    timestamp?: string;
    error_code?: number;
    error_message?: string | null;
    elapsed?: number;
    credit_count?: number;
    notice?: string | null;
  };
}

export interface FearGreedFetchResult {
  ok: boolean;
  snapshot?: FearGreedSnapshot;
  stale: boolean;
  source: "CMC Crypto Fear and Greed Index";
  updatedAt: string;
  error?: string;
}
