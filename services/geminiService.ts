import { GoogleGenAI, Type } from "@google/genai";
import { Recommendation, StrategicPlan } from "../types";

export const generateStrategicPlan = async (
  targetIncrease: number,
  timelineMonths: number,
  currentStats: string,
  location: string
): Promise<StrategicPlan> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `
    As a world-class hospitality consultant and AI revenue engine, analyze the following hotel data and generate a strategic profitability plan.
    
    HOTEL DATA: ${currentStats}
    LOCATION: ${location}
    TARGET: Increase profitability by ${targetIncrease}% within ${timelineMonths} months.

    INSTRUCTIONS:
    1. MARKET INTELLIGENCE: Perform a real-time search for hospitality market trends, competitor pricing, and demand patterns in ${location}.
    2. RECOMMENDATIONS: Provide comprehensive, multi-step strategic execution roadmaps for each recommendation. The 'action' field MUST be a detailed roadmap (not just a short title). For instance, specify technology stack requirements, operational shift changes, and pricing logic for high-impact concepts like 'Attribute-Based Selling (ABS)' or 'Hyper-Personalized Butler Services'.
    3. PROJECTION: Generate a month-by-month profit margin projection array for ${timelineMonths} months.
    4. SERVICE LINKINGS / CONSUMER INSIGHTS:
       - Analyze the provided 'Hospitality Add-on Usage/Rating' and 'Non-Hospitality Add-on Usage/Rating' from the uploaded data.
       - Map high ratings/usage to specific services: High Hosp Rating -> 'Luxury Spa' or 'Fine Dining'. High Non-Hosp Rating -> 'Exclusive City Tours' or 'Business Connectivity'.
       - List 5-6 hotel services with usageScore (0-100) derived from the data trends and type ('Hospitality' or 'Non-Hospitality').
    5. RECOMMENDED INVESTMENT: 
       - Calculate a minimum recommended investment amount specifically for Marketing growth.
    6. OPERATIONAL COST PROJECTION (FOR OPS MANAGER):
       - Project monthly operational costs for the next 3 months based on market overhead and internal performance.
       - Identify which high-performing services (from consumer usage data) can have operational/maintenance costs reduced (specify % reduction).
       - Calculate the specific impact of these reductions on overall revenue and profit.

    Format the final output as a JSON object strictly following the schema.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: prompt,
    config: {
      tools: [{ googleSearch: {} }],
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          summary: { type: Type.STRING },
          recommendations: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                category: { type: Type.STRING },
                action: { type: Type.STRING },
                goal: { type: Type.STRING },
                example: { type: Type.STRING },
                estimatedImpact: { type: Type.STRING },
                priority: { type: Type.STRING }
              },
              required: ["category", "action", "goal", "example", "estimatedImpact", "priority"]
            }
          },
          projectedProfitability: {
            type: Type.ARRAY,
            items: { type: Type.NUMBER }
          },
          consumerInsights: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                category: { type: Type.STRING },
                usageScore: { type: Type.NUMBER },
                type: { type: Type.STRING, enum: ["Hospitality", "Non-Hospitality"] }
              },
              required: ["category", "usageScore", "type"]
            }
          },
          recommendedInvestment: {
            type: Type.OBJECT,
            properties: {
              amount: { type: Type.STRING },
              period: { type: Type.STRING },
              rationale: { type: Type.STRING }
            },
            required: ["amount", "period", "rationale"]
          },
          operationalCostProjections: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                month: { type: Type.STRING },
                cost: { type: Type.STRING },
                savingsOpportunity: { type: Type.STRING },
                impactOnProfit: { type: Type.STRING }
              },
              required: ["month", "cost", "savingsOpportunity", "impactOnProfit"]
            }
          }
        },
        required: ["summary", "recommendations", "projectedProfitability", "consumerInsights", "recommendedInvestment", "operationalCostProjections"]
      }
    }
  });

  const planData: StrategicPlan = JSON.parse(response.text || "{}");
  
  const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks
    ?.map((chunk: any) => ({
      title: chunk.web?.title || 'Market Source',
      uri: chunk.web?.uri || '#'
    }))
    ?.filter((src: any) => src.uri !== '#');

  return {
    ...planData,
    sources: sources && sources.length > 0 ? sources : undefined
  };
};
