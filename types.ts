
export enum StakeholderRole {
  GENERAL_MANAGER = 'General Manager',
  REVENUE_MANAGER = 'Revenue Manager',
  MARKETING_HEAD = 'Marketing Head',
  OPERATIONS_MANAGER = 'Operations Manager',
  FINANCE_DIRECTOR = 'Finance Director'
}

export interface Recommendation {
  category: string;
  action: string;
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

export interface StrategicPlan {
  recommendations: Recommendation[];
  summary: string;
  projectedProfitability: number[]; // month projection
  consumerInsights: ConsumerInsight[];
}

export interface HotelStats {
  occupancy: number;
  adr: number;
  revPar: number;
  operationalCosts: number;
  profitMargin: number;
}
