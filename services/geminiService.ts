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
    
    2. RECOMMENDATIONS: For each recommendation, provide:
       - 'action': A VERY SHORT, punchy summary (max 10 words) for the UI dashboard.
       - 'detailedAction': A comprehensive, multi-step strategic execution roadmap. This MUST be detailed (how/when/what), specifying tech stacks, operational shifts, and implementation phases (e.g. Month 1-3, Month 4-6).
       
    3. PROJECTION: Generate a month-by-month profit margin projection array for ${timelineMonths} months.
    
    4. SERVICE LINKINGS / CONSUMER INSIGHTS:
       - Analyze provided 'Hospitality' and 'Non-Hospitality' data usage/ratings.
       - List 5-6 hotel services with usageScore (0-100) and type.
       
    5. RECOMMENDED INVESTMENT: 
       - Calculate a minimum recommended investment for marketing/growth.
       
    6. OPERATIONAL COST PROJECTION:
       - Project monthly operational costs for next 3 months.
       - Calculate savings opportunities and impact.

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
                action: { type: Type.STRING, description: "Short summary (max 10 words)" },
                detailedAction: { type: Type.STRING, description: "Detailed multi-step plan" },
                goal: { type: Type.STRING },
                example: { type: Type.STRING },
                estimatedImpact: { type: Type.STRING },
                priority: { type: Type.STRING }
              },
              required: ["category", "action", "detailedAction", "goal", "example", "estimatedImpact", "priority"]
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