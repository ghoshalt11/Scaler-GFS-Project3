
import { GoogleGenAI, Type } from "@google/genai";
import { Recommendation, StrategicPlan } from "../types";

const API_KEY = process.env.API_KEY || "";

export const generateStrategicPlan = async (
  targetIncrease: number,
  timelineMonths: number,
  currentStats: string
): Promise<StrategicPlan> => {
  const ai = new GoogleGenAI({ apiKey: API_KEY });
  
  const prompt = `
    As a world-class hospitality consultant and AI revenue engine, analyze the following hotel data and generate a strategic profitability plan.
    Target: Increase profitability by ${targetIncrease}% within ${timelineMonths} months.
    Current Context: ${currentStats}

    Generate a structured plan with:
    1. Recommendations in categories: Revenue Optimization, Operational Efficiency, Guest Experience, Investment, Data-Driven Decisions.
    2. A month-by-month profit projection array for ${timelineMonths} months.
    3. Pure data-driven Consumer Usage/Demand Insights: List 5-6 hotel services/categories (e.g. F&B, Spa, Business Center, External Laundry, Local Tours).
       - For each, provide a usageScore (0-100).
       - Tag as either 'Hospitality' or 'Non-Hospitality'.

    Format each recommendation with: Action, Goal, Example, Impact, Priority.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
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
          }
        },
        required: ["summary", "recommendations", "projectedProfitability", "consumerInsights"]
      }
    }
  });

  return JSON.parse(response.text);
};
