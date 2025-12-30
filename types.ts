export enum StakeholderRole {
  REVENUE_MANAGER = 'Revenue Manager',
  MARKETING_HEAD = 'Marketing Head',
  OPERATIONS_MANAGER = 'Operations Manager'
}

export interface Recommendation {
  category: string;
  action: string; // Short summary for UI
  detailedAction: string; // Full roadmap for PDF
  goal: string;
  example: string;
  estimatedImpact: string;
  priority: 'High' | 'Medium' | 'Low';
}

export interface ConsumerInsight {
  category: string;
  usageScore: number;
  type: 'Hospitality' | 'Non-Hospitality';
}

export interface OperationalCostProjection {
  month: string;
  cost: string;
  savingsOpportunity: string;
  impactOnProfit: string;
}

export interface StrategicPlan {
  recommendations: Recommendation[];
  summary: string;
  projectedProfitability: number[]; // month projection
  consumerInsights: ConsumerInsight[];
  recommendedInvestment?: {
    amount: string;
    period: string;
    rationale: string;
  };
  operationalCostProjections?: OperationalCostProjection[];
  sources?: { title: string; uri: string }[];
}

export interface HotelStats {
  occupancy: number;
  adr: number;
  revPar: number;
  operationalCosts: number;
  profitMargin: number;
}