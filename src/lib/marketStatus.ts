import type {
  GammaRegime,
  MarketStatus,
  SessionStatus,
  TrendDirection
} from "@/types/dashboard";

export function getTrendTone(trend: TrendDirection) {
  if (trend === "bullish") {
    return "positive";
  }

  if (trend === "bearish") {
    return "negative";
  }

  return "neutral";
}

export function getSessionTone(status: SessionStatus) {
  if (status === "positive") {
    return "positive";
  }

  if (status === "negative") {
    return "negative";
  }

  return "neutral";
}

export function getGammaTone(regime: GammaRegime) {
  if (regime === "positive gamma") {
    return "positive";
  }

  if (regime === "negative gamma") {
    return "negative";
  }

  return "neutral";
}

export function describeMarketStatus(status: MarketStatus) {
  const descriptions: Record<MarketStatus, string> = {
    "ATH price discovery": "Trend extension conditions; avoid fading strength without confirmation.",
    "sideways consolidation": "Range conditions; respect edges and reduce expectation for clean follow-through.",
    correction: "Pullback conditions; prioritize failed breakdowns or confirmed continuation.",
    "risk-off": "Defensive conditions; reduce aggression and require stronger confirmation.",
    recovery: "Repair conditions; monitor breadth of follow-through before pressing risk."
  };

  return descriptions[status];
}
