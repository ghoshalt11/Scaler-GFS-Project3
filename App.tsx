import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  TrendingUp, 
  Settings, 
  Users, 
  Lightbulb, 
  Target, 
  BarChart3, 
  RefreshCw, 
  AlertCircle, 
  Heart, 
  Database, 
  CheckCircle2, 
  Upload, 
  Info, 
  X, 
  FileSpreadsheet,
  CloudUpload,
  Loader2,
  Globe,
  MapPin,
  Search,
  Calculator,
  Download,
  Zap,
  Wallet,
  Play
} from 'lucide-react';
import { GoogleGenAI, Type } from "@google/genai";
import { generateStrategicPlan } from './services/geminiService';
import { exportPlanToPDF, exportRoleStrategyToPDF } from './services/pdfService';
import { StakeholderRole, StrategicPlan } from './types';
import { ProfitProjectionChart, CategoryImpactChart, ConsumerUsageChart } from './components/DashboardCharts';
import { AnalyticalBot } from './components/AnalyticalBot';

export const BotIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <rect x="12" y="22" width="40" height="32" rx="8" stroke="currentColor" strokeWidth="3" />
    <rect x="4" y="32" width="8" height="12" rx="4" stroke="currentColor" strokeWidth="3" />
    <rect x="52" y="32" width="8" height="12" rx="4" stroke="currentColor" strokeWidth="3" />
    <line x1="24" y1="22" x2="24" y2="14" stroke="currentColor" strokeWidth="3" />
    <circle cx="24" cy="11" r="3" fill="currentColor" />
    <circle cx="25" cy="38" r="4" stroke="currentColor" strokeWidth="3" />
    <circle cx="39" cy="38" r="4" stroke="currentColor" strokeWidth="3" />
    <path d="M26 46C28 48.5 36 48.5 38 46" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    <path d="M40 4C48.8366 4 56 9.37258 56 16C56 18.7844 54.7212 21.3256 52.6289 23.232L54 28L48 26C45.5921 27.276 42.8943 28 40 28C31.1634 28 24 22.6274 24 16C24 9.37258 31.1634 4 40 4Z" stroke="#3b82f6" strokeWidth="3" fill="white" />
    <line x1="34" y1="12" x2="46" y2="12" stroke="#3b82f6" strokeWidth="3" strokeLinecap="round" />
    <line x1="34" y1="20" x2="46" y2="20" stroke="#3b82f6" strokeWidth="3" strokeLinecap="round" />
    <path d="M52 48C52 54 48 58 40 58H36" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    <rect x="28" y="55" width="8" height="6" rx="1" fill="currentColor" />
  </svg>
);

const STORAGE_KEY = 'revelevate_hotel_data';

const SAMPLE_CSV_CONTENT = `date,total_revenue,rooms_occupied,total_inventory,channel,cost_allocation,average_service_rating,feedback_score,rating_count,feedback_count,avg_hosp_addon_pct_per_booking,avg_non_hosp_addon_pct_per_booking,avg_hosp_addon_rating,avg_non_hosp_addon_rating,seasonal_booking_pct,professional_booking_pct,festival_booking_pct,event_booking_pct,other_booking_pct
2025-01-01,125000,50,80,Direct,42000,4.3,83,46,40,42,18,4.4,4.1,20,40,24,12,4
2025-01-01,98000,38,80,OTA,36000,4.1,78,34,29,38,16,4.2,3.9,22,46,18,10,4
2025-01-01,45000,15,80,GDS,18000,4.0,75,13,11,34,14,4.1,3.8,18,52,14,12,4
2025-01-02,132500,55,80,Direct,46000,4.5,88,50,44,45,20,4.6,4.2,18,44,22,12,4
2025-01-02,105000,42,80,OTA,39000,4.2,80,38,33,40,17,4.3,4.0,20,48,18,10,4
2025-01-02,52000,18,80,GDS,21000,4.1,77,16,14,36,15,4.2,3.9,16,54,14,12,4
2025-01-03,148000,60,80,Direct,50000,4.6,90,55,48,48,22,4.7,4.3,22,38,26,10,4
2025-01-03,112000,45,80,OTA,41000,4.3,84,41,36,42,18,4.4,4.1,24,42,20,10,4
2025-01-03,60000,20,80,GDS,23000,4.2,81,18,15,38,16,4.3,4.0,20,48,16,12,4
2025-01-04,155000,62,80,Direct,52000,4.6,91,57,50,50,24,4.8,4.4,26,34,28,8,4
2025-01-04,118000,47,80,OTA,43000,4.3,85,43,37,44,19,4.5,4.1,28,38,22,8,4
2025-01-04,65000,22,80,GDS,25000,4.2,82,20,17,40,17,4.3,4.0,24,44,18,10,4
2025-01-05,160000,65,80,Direct,54000,4.7,92,60,54,52,25,4.8,4.5,30,30,30,6,4
2025-01-05,120000,48,80,OTA,44000,4.4,86,44,38,46,20,4.6,4.2,32,34,24,6,4
2025-01-05,70000,25,80,GDS,27000,4.3,83,23,19,42,18,4.4,4.1,28,40,20,8,4
2025-01-06,158000,63,80,Direct,53000,4.6,90,58,52,51,24,4.7,4.4,28,32,30,6,4
2025-01-06,119000,46,80,OTA,43500,4.3,85,42,36,45,19,4.5,4.1,30,36,24,6,4
2025-01-06,68000,23,80,GDS,26000,4.2,82,21,18,41,17,4.3,4.0,26,42,22,6,4
2025-01-07,162000,66,80,Direct,55000,4.7,93,61,55,53,26,4.9,4.6,24,36,34,2,4
2025-01-07,121000,49,80,OTA,45000,4.4,87,45,39,47,21,4.6,4.2,26,40,28,2,4
2025-01-07,72000,26,80,GDS,28000,4.3,84,24,20,43,19,4.4,4.1,22,46,26,2,4
2025-01-08,165000,68,80,Direct,56000,4.8,94,63,57,55,27,4.9,4.6,34,26,36,0,4
2025-01-08,123000,50,80,OTA,46000,4.5,88,46,41,49,22,4.7,4.3,36,30,30,0,4
2025-01-08,75000,28,80,GDS,29000,4.4,85,26,22,45,20,4.5,4.2,32,36,28,0,4
2025-01-09,168000,70,80,Direct,57000,4.8,95,65,59,56,28,5.0,4.7,38,22,38,0,2
2025-01-09,125000,52,80,OTA,47000,4.5,89,48,43,50,23,4.7,4.3,40,26,32,0,2
2025-01-09,78000,30,80,GDS,30000,4.4,86,28,24,46,21,4.6,4.2,36,32,30,0,2
2025-01-10,170000,72,80,Direct,58000,4.9,96,67,61,58,30,5.0,4.8,42,18,38,0,2
2025-01-10,128000,54,80,OTA,48000,4.6,90,50,45,52,24,4.8,4.4,44,22,32,0,2
2025-01-10,80000,32,80,GDS,31000,4.5,87,30,26,48,22,4.7,4.3,40,28,30,0,2
2025-01-11,172000,73,80,Direct,59000,4.9,96,68,62,59,31,5.0,4.8,46,16,36,0,2
2025-01-11,130000,55,80,OTA,49000,4.6,91,51,46,53,25,4.8,4.4,48,20,30,0,2
2025-01-11,82000,33,80,GDS,32000,4.5,88,31,27,49,23,4.7,4.3,44,26,28,0,2
2025-01-12,175000,75,80,Direct,60000,4.9,97,70,64,60,32,5.0,4.9,50,14,34,0,2
2025-01-12,132000,56,80,OTA,50000,4.7,92,52,47,54,26,4.9,4.5,52,18,28,0,2
2025-01-12,84000,34,80,GDS,33000,4.6,89,32,28,50,24,4.8,4.4,48,24,26,0,2
2025-01-13,178000,76,80,Direct,61000,4.9,97,71,65,61,33,5.0,4.9,54,12,32,0,2
2025-01-13,134000,57,80,OTA,51000,4.7,93,53,48,55,27,4.9,4.5,56,16,26,0,2
2025-01-13,86000,35,80,GDS,34000,4.6,90,33,29,51,25,4.8,4.4,52,22,24,0,2
2025-01-14,180000,78,80,Direct,62000,5.0,98,73,67,62,34,5.0,4.9,58,10,30,0,2
2025-01-14,136000,58,80,OTA,52000,4.8,94,54,49,56,28,4.9,4.6,60,14,24,0,2
2025-01-14,88000,36,80,GDS,35000,4.7,91,34,30,52,26,4.8,4.5,56,20,22,0,2
2025-01-15,182000,79,80,Direct,63000,5.0,99,74,68,63,35,5.0,4.9,60,8,30,0,2
2025-01-15,138000,59,80,OTA,53000,4.8,95,55,50,57,29,4.9,4.6,62,12,24,0,2
2025-01-15,90000,37,80,GDS,36000,4.7,92,35,31,53,27,4.8,4.5,58,18,22,0,2
2025-01-16,185000,80,80,Direct,64000,5.0,99,75,69,64,36,5.0,5.0,64,6,28,0,2
2025-01-16,140000,60,80,OTA,54000,4.8,95,56,51,58,30,4.9,4.6,66,10,22,0,2
2025-01-16,92000,38,80,GDS,37000,4.7,93,36,32,54,28,4.8,4.5,62,16,20,0,2
2025-01-17,183000,78,80,Direct,63000,4.9,98,73,67,62,34,5.0,4.9,60,10,28,0,2
2025-01-17,139000,59,80,OTA,53500,4.7,94,55,50,56,28,4.9,4.6,62,14,22,0,2
2025-01-17,91000,37,80,GDS,36500,4.6,92,35,31,52,26,4.8,4.5,58,20,20,0,2
2025-01-18,180000,76,80,Direct,62000,4.9,97,71,65,61,33,5.0,4.9,56,12,30,0,2
2025-01-18,137000,58,80,OTA,52500,4.7,93,54,49,55,27,4.9,4.6,58,16,24,0,2
2025-01-18,89000,36,80,GDS,35500,4.6,91,34,30,51,25,4.8,4.4,54,22,22,0,2
2025-01-19,178000,75,80,Direct,61000,4.8,96,70,64,60,32,4.9,4.8,52,14,32,0,2
2025-01-19,135000,57,80,OTA,51500,4.6,92,53,48,54,26,4.8,4.5,54,18,26,0,2
2025-01-19,87000,35,80,GDS,34500,4.5,90,33,29,50,24,4.7,4.4,50,24,24,0,2
2025-01-20,175000,74,80,Direct,60000,4.8,95,69,63,59,31,4.9,4.8,50,16,32,0,2
2025-01-20,133000,56,80,OTA,50500,4.6,91,52,47,53,25,4.8,4.5,52,20,26,0,2
2025-01-20,85000,34,80,GDS,33500,4.5,89,32,28,49,23,4.7,4.3,48,26,24,0,2
2025-01-21,172000,72,80,Direct,59000,4.7,94,67,61,58,30,4.8,4.7,48,18,32,0,2
2025-01-21,131000,55,80,OTA,49500,4.5,90,51,46,52,24,4.7,4.4,50,22,26,0,2
2025-01-21,83000,33,80,GDS,32500,4.4,88,31,27,48,22,4.6,4.3,46,28,24,0,2
2025-01-22,170000,70,80,Direct,58000,4.7,93,65,59,57,29,4.8,4.7,46,20,32,0,2
2025-01-22,129000,54,80,OTA,48500,4.5,89,50,45,51,23,4.7,4.4,48,24,26,0,2
2025-01-22,81000,32,80,GDS,31500,4.4,87,30,26,47,21,4.6,4.2,44,30,24,0,2
2025-01-23,168000,68,80,Direct,57000,4.6,92,63,57,56,28,4.7,4.6,44,22,32,0,2
2025-01-23,127000,53,80,OTA,47500,4.4,88,49,44,50,22,4.6,4.3,46,26,26,0,2
2025-01-23,79000,31,80,GDS,30500,4.3,86,29,25,46,20,4.5,4.2,42,32,24,0,2
2025-01-24,165000,66,80,Direct,56000,4.6,91,61,55,55,27,4.7,4.6,42,24,32,0,2
2025-01-24,125000,52,80,OTA,46500,4.4,87,48,43,49,21,4.6,4.3,44,28,26,0,2
2025-01-24,77000,30,80,GDS,29500,4.3,85,28,24,45,19,4.5,4.1,40,34,24,0,2
2025-01-25,162000,65,80,Direct,55000,4.5,90,60,54,54,26,4.6,4.5,40,26,32,0,2
2025-01-25,123000,51,80,OTA,45500,4.3,86,47,42,48,20,4.5,4.2,42,30,26,0,2
2025-01-25,75000,29,80,GDS,28500,4.2,84,27,23,44,18,4.4,4.1,38,36,24,0,2
2025-01-26,160000,64,80,Direct,54000,4.5,89,59,53,53,25,4.6,4.5,38,28,32,0,2
2025-01-26,121000,50,80,OTA,44500,4.3,85,46,41,47,19,4.5,4.2,40,32,26,0,2
2025-01-26,73000,28,80,GDS,27500,4.2,83,26,22,43,17,4.3,4.0,36,38,24,0,2
2025-01-27,158000,63,80,Direct,53000,4.4,88,58,52,52,24,4.5,4.4,36,30,32,0,2
2025-01-27,119000,49,80,OTA,43500,4.2,84,45,40,46,18,4.4,4.1,38,34,26,0,2
2025-01-27,71000,27,80,GDS,26500,4.1,82,25,21,42,16,4.2,3.9,34,40,24,0,2
2025-01-28,155000,62,80,Direct,52000,4.4,87,57,51,51,23,4.5,4.4,34,32,32,0,2
2025-01-28,117000,48,80,OTA,42500,4.2,83,44,39,45,17,4.4,4.1,36,36,26,0,2
2025-01-28,69000,26,80,GDS,25500,4.1,81,24,20,41,15,4.2,3.9,32,42,24,0,2
2025-01-29,152000,60,80,Direct,51000,4.3,86,55,49,50,22,4.4,4.3,32,34,32,0,2
2025-01-29,115000,47,80,OTA,41500,4.1,82,43,38,44,16,4.3,4.0,34,38,26,0,2
2025-01-29,67000,25,80,GDS,24500,4.0,80,23,19,40,14,4.1,3.8,30,44,24,0,2
2025-01-30,150000,58,80,Direct,50000,4.3,85,53,47,49,21,4.4,4.3,30,36,32,0,2
2025-01-30,113000,46,80,OTA,40500,4.1,81,42,37,43,15,4.3,4.0,32,40,26,0,2
2025-01-30,65000,24,80,GDS,23500,4.0,79,22,18,39,13,4.1,3.8,28,46,24,0,2
2025-01-31,148000,56,80,Direct,49000,4.2,84,51,45,48,20,4.3,4.2,28,38,32,0,2
2025-01-31,111000,45,80,OTA,39500,4.0,80,41,36,42,14,4.2,3.9,30,42,26,0,2
2025-01-31,63000,23,80,GDS,22500,3.9,78,21,17,38,12,4.0,3.7,26,48,24,0,2`;

const App: React.FC = () => {
  const [xValue, setXValue] = useState(15);
  const [yValue, setYValue] = useState(24);
  const [location, setLocation] = useState('San Francisco, CA');
  const [selectedRole, setSelectedRole] = useState<StakeholderRole>(StakeholderRole.REVENUE_MANAGER);
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<StrategicPlan | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isBotOpen, setIsBotOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // CRITICAL: Initialize fresh every time to ensure "at very begining there shouyld not be any file uplaoded"
  const [performanceData, setPerformanceData] = useState(() => {
    return {
      profitMargin: 0,
      transactions: 0,
      occRate: 0,
      adr: 0,
      direct: 0,
      ota: 0,
      lastSync: "Never",
      source: "No Data Uploaded",
      headers: [] as string[],
      extraMetrics: {
        avgServiceRating: 0,
        hospAddonUsage: 0,
        nonHospAddonUsage: 0,
        hospAddonRating: 0,
        nonHospAddonRating: 0
      },
      isDefault: true
    };
  });

  const currentStats = performanceData.isDefault ? "" : `
    Hotel: Mid-Sized City Hotel (150 rooms)
    Location: ${location}
    Current Occupancy: ${performanceData.occRate}%
    ADR: $${performanceData.adr}
    RevPAR: $${(performanceData.adr * performanceData.occRate / 100).toFixed(2)}
    Direct Bookings: ${performanceData.direct}%
    OTA Bookings: ${performanceData.ota}%
    Current Profit Margin: ${performanceData.profitMargin}%
    Transactions Analyzed: ${performanceData.transactions}
    Service Performance Data:
    - Overall Service Rating: ${performanceData.extraMetrics.avgServiceRating}/5
    - Hospitality Add-on Usage: ${performanceData.extraMetrics.hospAddonUsage}% (Rating: ${performanceData.extraMetrics.hospAddonRating})
    - Non-Hospitality Add-on Usage: ${performanceData.extraMetrics.nonHospAddonUsage}% (Rating: ${performanceData.extraMetrics.nonHospAddonRating})
    Data Source Details: ${performanceData.source}
  `;

  const fetchPlan = useCallback(async () => {
    if (performanceData.isDefault) return;
    setLoading(true);
    setError(null);
    try {
      const result = await generateStrategicPlan(xValue, yValue, currentStats, location);
      setPlan(result);
    } catch (err) {
      console.error(err);
      setError("Failed to generate strategic plan. Please check your API key and try again.");
    } finally {
      setLoading(false);
    }
  }, [xValue, yValue, currentStats, location, performanceData.isDefault]);

  // CRITICAL: Removed auto-trigger useEffect to prevent analysis on startup or URL paste.
  // Plan generation now ONLY occurs when the user clicks the "Calculate Strategy" button.

  const extractFromUnstructured = async (text: string): Promise<any> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Extract hotel performance data from the following text and return as JSON. 
      Schema: { revenue: number, occupied_rooms: number, total_rooms: number, cost: number, direct_bookings_count: number, total_bookings_count: number, avg_service_rating: number, hosp_addon_pct: number, non_hosp_addon_pct: number, hosp_addon_rating: number, non_hosp_addon_rating: number }. 
      If some fields are missing, estimate realistically based on context.
      TEXT: ${text.substring(0, 10000)}`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            revenue: { type: Type.NUMBER },
            occupied_rooms: { type: Type.NUMBER },
            total_rooms: { type: Type.NUMBER },
            cost: { type: Type.NUMBER },
            direct_bookings_count: { type: Type.NUMBER },
            total_bookings_count: { type: Type.NUMBER },
            avg_service_rating: { type: Type.NUMBER },
            hosp_addon_pct: { type: Type.NUMBER },
            non_hosp_addon_pct: { type: Type.NUMBER },
            hosp_addon_rating: { type: Type.NUMBER },
            non_hosp_addon_rating: { type: Type.NUMBER }
          }
        }
      }
    });
    return JSON.parse(response.text || '{}');
  };

  const processCSVContent = (content: string) => {
    const lines = content.split('\n').map(line => line.split(',').map(cell => cell.trim()));
    if (lines.length < 2) {
      throw new Error("Empty or malformed CSV.");
    }

    const headers = lines[0].map(h => h.toLowerCase());
    const dataRows = lines.slice(1).filter(row => row.length >= headers.length && row.some(cell => cell !== ''));

    const revIdx = headers.findIndex(h => h.includes('total_revenue') || h.includes('revenue'));
    const occIdx = headers.findIndex(h => h.includes('rooms_occupied') || h.includes('occupied'));
    const invIdx = headers.findIndex(h => h.includes('total_inventory') || h.includes('inventory'));
    const costIdx = headers.findIndex(h => h.includes('cost_allocation') || h.includes('cost'));
    const channelIdx = headers.findIndex(h => h.includes('channel'));
    const ratingIdx = headers.findIndex(h => h.includes('average_service_rating') || h.includes('service_rating'));
    const hospUsageIdx = headers.findIndex(h => h.includes('avg_hosp_addon_pct') || h.includes('hosp_addon_pct'));
    const nonHospUsageIdx = headers.findIndex(h => h.includes('avg_non_hosp_addon_pct') || h.includes('non_hosp_addon_pct'));
    const hospRatingIdx = headers.findIndex(h => h.includes('avg_hosp_addon_rating') || h.includes('hosp_addon_rating'));
    const nonHospRatingIdx = headers.findIndex(h => h.includes('avg_non_hosp_addon_rating') || h.includes('non_hosp_addon_rating'));

    let totalRev = 0, totalOcc = 0, totalInv = 0, totalCost = 0, directCount = 0;
    let totalSvcRating = 0, totalHospUsage = 0, totalNonHospUsage = 0, totalHospRating = 0, totalNonHospRating = 0;

    dataRows.forEach(row => {
      totalRev += parseFloat(row[revIdx]) || 0;
      totalOcc += parseFloat(row[occIdx]) || 0;
      totalInv += parseFloat(row[invIdx]) || 0;
      totalCost += parseFloat(row[costIdx]) || 0;
      totalSvcRating += parseFloat(row[ratingIdx]) || 0;
      totalHospUsage += parseFloat(row[hospUsageIdx]) || 0;
      totalNonHospUsage += parseFloat(row[nonHospUsageIdx]) || 0;
      totalHospRating += parseFloat(row[hospRatingIdx]) || 0;
      totalNonHospRating += parseFloat(row[nonHospRatingIdx]) || 0;
      if (row[channelIdx]?.toLowerCase().includes('direct')) directCount++;
    });

    const transactions = dataRows.length;
    return {
      profitMargin: parseFloat((totalRev > 0 ? ((totalRev - totalCost) / totalRev) * 100 : 25).toFixed(1)),
      transactions,
      occRate: Math.round(totalInv > 0 ? (totalOcc / totalInv) * 100 : 68),
      adr: Math.round(totalOcc > 0 ? totalRev / totalOcc : 185),
      direct: Math.round(transactions > 0 ? (directCount / transactions) * 100 : 22),
      ota: Math.round(100 - (transactions > 0 ? (directCount / transactions) * 100 : 22)),
      extraMetrics: {
        avgServiceRating: parseFloat((totalSvcRating / transactions).toFixed(1)),
        hospAddonUsage: Math.round(totalHospUsage / transactions),
        nonHospAddonUsage: Math.round(totalNonHospUsage / transactions),
        hospAddonRating: parseFloat((totalHospRating / transactions).toFixed(1)),
        nonHospAddonRating: parseFloat((totalNonHospRating / transactions).toFixed(1))
      }
    };
  };

  const updatePerformanceData = (processed: any, sourceName: string) => {
    const newData = {
      ...processed,
      lastSync: new Date().toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
      source: sourceName,
      headers: [],
      isDefault: false
    };

    setPerformanceData(newData);
    // Explicitly do not persist to localStorage to maintain a clean start on every refresh/URL paste
    setIsUploadModalOpen(false);
    setLoading(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      
      try {
        if (file.name.endsWith('.csv')) {
          const processed = processCSVContent(content);
          updatePerformanceData(processed, file.name);
        } else {
          const extracted = await extractFromUnstructured(content);
          const processed = {
            profitMargin: parseFloat((extracted.revenue > 0 ? ((extracted.revenue - extracted.cost) / extracted.revenue) * 100 : 25).toFixed(1)),
            transactions: extracted.total_bookings_count || 100,
            occRate: Math.round(extracted.total_rooms > 0 ? (extracted.occupied_rooms / extracted.total_rooms) * 100 : 65),
            adr: Math.round(extracted.occupied_rooms > 0 ? extracted.revenue / extracted.occupied_rooms : 150),
            direct: Math.round(extracted.total_bookings_count > 0 ? (extracted.direct_bookings_count / extracted.total_bookings_count) * 100 : 20),
            ota: Math.round(100 - (extracted.total_bookings_count > 0 ? (extracted.direct_bookings_count / extracted.total_bookings_count) * 100 : 20)),
            extraMetrics: {
              avgServiceRating: extracted.avg_service_rating || 4.2,
              hospAddonUsage: extracted.hosp_addon_pct || 15,
              nonHospAddonUsage: extracted.non_hosp_addon_pct || 10,
              hospAddonRating: extracted.hosp_addon_rating || 4.5,
              nonHospAddonRating: extracted.non_hosp_addon_rating || 4.0
            }
          };
          updatePerformanceData(processed, file.name);
        }
      } catch (err: any) {
        setError(err.message || "Failed to process content.");
        setLoading(false);
      }
    };
    reader.readAsText(file);
  };

  const handleLoadSampleData = () => {
    setLoading(true);
    try {
      const processed = processCSVContent(SAMPLE_CSV_CONTENT);
      updatePerformanceData(processed, "sales_sample_data3.csv");
    } catch (err: any) {
      setError("Failed to load sample data.");
      setLoading(false);
    }
  };

  const getRoleIcon = (role: StakeholderRole) => {
    switch (role) {
      case StakeholderRole.REVENUE_MANAGER: return <TrendingUp className="w-5 h-5" />;
      case StakeholderRole.MARKETING_HEAD: return <Users className="w-5 h-5" />;
      case StakeholderRole.OPERATIONS_MANAGER: return <Settings className="w-5 h-5" />;
    }
  };

  const filteredRecommendations = plan?.recommendations.filter(rec => {
    if (selectedRole === StakeholderRole.REVENUE_MANAGER) return rec.category.includes('Revenue') || rec.category.includes('Decisions');
    if (selectedRole === StakeholderRole.MARKETING_HEAD) return rec.category.includes('Experience') || rec.category.includes('Revenue');
    if (selectedRole === StakeholderRole.OPERATIONS_MANAGER) return rec.category.includes('Efficiency') || rec.category.includes('Investment');
    return true;
  }) || [];

  const handleExportRoleStrategy = () => {
    if (!plan) return;
    exportRoleStrategyToPDF(
      selectedRole,
      filteredRecommendations,
      plan.summary,
      location,
      xValue,
      yValue,
      plan.operationalCostProjections
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                <BarChart3 className="w-6 h-6" />
              </div>
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600">
                ProfitPath AI
              </span>
            </div>
            
            <div className="hidden md:flex items-center gap-4">
              <button 
                onClick={() => setIsBotOpen(true)}
                className="flex items-center gap-2 text-indigo-800 font-bold text-sm bg-slate-100 hover:bg-slate-200 px-3.5 py-1.5 rounded-full transition-all border border-indigo-200 shadow-sm"
              >
                <BotIcon className="w-5 h-5 text-indigo-900" />
                Ask Strategist
              </button>
              <div className="flex items-center gap-2 text-sm text-slate-500 bg-slate-100 px-4 py-1.5 rounded-full font-medium">
                <Target className="w-4 h-4 text-indigo-600" />
                Target: <span className="font-bold text-slate-900">+{xValue}%</span> in <span className="font-bold text-slate-900">{yValue} Months</span>
              </div>
              <button 
                onClick={fetchPlan}
                disabled={loading || performanceData.isDefault}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-5 py-2 rounded-xl text-sm font-bold transition-all shadow-md shadow-indigo-100"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Calculate Strategy
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-3 space-y-6">
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-6 font-serif border-b border-slate-100 pb-2">Strategic Goals</h3>
              <div className="space-y-8">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-black text-slate-900 uppercase font-serif">Location</label>
                    <Globe className="w-3.5 h-3.5 text-indigo-600" />
                  </div>
                  <div className="space-y-5">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input 
                        type="text"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder="Search for a city..."
                        className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-black text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:font-medium shadow-inner"
                      />
                    </div>
                    <div className="relative group overflow-hidden bg-gradient-to-br from-amber-50 to-orange-50 p-4 rounded-xl border border-amber-200 shadow-sm">
                      <div className="absolute top-0 left-0 w-1 h-full bg-amber-500"></div>
                      <div className="flex items-start gap-3">
                        <div className="p-1.5 bg-amber-100 rounded-lg shrink-0">
                          <Lightbulb className="w-3.5 h-3.5 text-amber-600" />
                        </div>
                        <p className="text-[10px] font-black text-amber-900 uppercase leading-relaxed tracking-wider">
                          <span className="text-amber-600 mr-1 font-black">N.B.</span>
                          Type any city or trade area. Our strategist will benchmark this specific local market to refine your action items.
                        </p>
                      </div>
                    </div>
                  </div>
                  <p className="mt-3 text-[10px] font-black text-slate-500 uppercase leading-tight italic font-serif">
                    MARKET INTELLIGENCE WILL BE LOCALIZED TO THIS AREA.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-900 uppercase mb-4 font-sans">Profit Growth (%)</label>
                  <input 
                    type="range" min="0" max="50" step="1" 
                    value={xValue} onChange={(e) => setXValue(parseInt(e.target.value))}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600 mb-2"
                  />
                  <div className="flex justify-between items-center text-xs font-black">
                    <span className="text-slate-600">0%</span>
                    <span className="text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg text-sm">{xValue}%</span>
                    <span className="text-slate-600">50%</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-900 uppercase mb-4 font-sans">Timeline (Months)</label>
                  <input 
                    type="range" min="3" max="36" step="1" 
                    value={yValue} onChange={(e) => setYValue(parseInt(e.target.value))}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600 mb-2"
                  />
                  <div className="flex justify-between items-center text-xs font-black">
                    <span className="text-slate-600">3m</span>
                    <span className="text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg text-sm">{yValue}m</span>
                    <span className="text-slate-600">36m</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-4 font-serif border-b border-slate-100 pb-2">View Context</h3>
              <div className="space-y-2.5">
                {Object.values(StakeholderRole).map((role) => (
                  <button
                    key={role}
                    onClick={() => setSelectedRole(role)}
                    className={`w-full flex items-center justify-start gap-3 px-5 py-3.5 rounded-xl text-sm font-black text-left transition-all ${
                      selectedRole === role 
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100' 
                        : 'text-slate-600 hover:bg-slate-50 border border-transparent'
                    }`}
                  >
                    <div className="shrink-0">{getRoleIcon(role)}</div>
                    {role}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-9 space-y-6">
            <div className="space-y-4">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden ring-1 ring-slate-200/50">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500" />
                
                {performanceData.isDefault ? (
                  <div className="flex-1 flex flex-col items-center justify-center py-8 text-center bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                    <CloudUpload className="w-10 h-10 text-slate-300 mb-3" />
                    <h3 className="text-lg font-black text-slate-900 mb-1 tracking-tight">Performance Engine Ready</h3>
                    <p className="text-sm text-slate-500 font-black max-w-xs leading-tight">Upload (your sales data /ledger) file here, and let the system calculate current performance metrics.</p>
                  </div>
                ) : (
                  <>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-4">
                        <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.1em]">Quick Sales Performance Snapshot</h3>
                        <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-black rounded-full border border-emerald-100 uppercase tracking-tight">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Calculated From Ledger
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <p className="text-[56px] font-black text-slate-900 leading-none tracking-tighter">
                          {performanceData.profitMargin}%
                        </p>
                        <div className="space-y-0.5">
                          <p className="text-sm font-extrabold text-indigo-600">Base Profit Margin</p>
                          <p className="text-[11px] text-slate-400 font-medium flex items-center gap-1.5">
                            <Database className="w-3.5 h-3.5" />
                            Source: {performanceData.source}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-10 md:border-l md:border-slate-100 md:pl-10">
                      <div className="text-left">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Total Sales Analyzed</p>
                        <p className="text-2xl font-black text-slate-800 tabular-nums">
                          {performanceData.transactions.toLocaleString()} Trans.
                        </p>
                        <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-tighter">Last Sync: {performanceData.lastSync}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-x-8 gap-y-2 pr-4">
                        <div className="flex flex-col">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Occ Rate</p>
                          <p className="text-base font-black text-slate-700">{performanceData.occRate}%</p>
                        </div>
                        <div className="flex flex-col">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">ADR</p>
                          <p className="text-base font-black text-slate-700">${performanceData.adr}</p>
                        </div>
                        <div className="flex flex-col">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Direct</p>
                          <p className="text-base font-black text-emerald-600">{performanceData.direct}%</p>
                        </div>
                        <div className="flex flex-col">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">OTA</p>
                          <p className="text-base font-black text-rose-500">{performanceData.ota}%</p>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className="flex justify-start items-center gap-4">
                <button 
                  onClick={() => setIsUploadModalOpen(true)}
                  className="h-12 inline-flex items-center gap-2 px-6 border-2 border-dashed border-indigo-200 rounded-2xl text-indigo-800 hover:border-indigo-400 hover:text-indigo-900 hover:bg-white transition-all text-sm font-bold bg-indigo-50 shadow-lg shadow-indigo-100/50 active:shadow-md transform active:translate-y-0.5"
                >
                  <Upload className="w-4 h-4" />
                  Upload Sales Data (location specific..)
                </button>
                {!performanceData.isDefault && (
                  <div className="h-12 flex items-center gap-2 px-5 bg-slate-100 rounded-2xl border border-slate-200">
                    <MapPin className="w-4 h-4 text-indigo-500" />
                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Active Location: {location}</span>
                  </div>
                )}
              </div>
            </div>

            {performanceData.isDefault ? (
              <div className="h-96 flex flex-col items-center justify-center text-center opacity-70 grayscale pointer-events-none -mt-32">
                 <BarChart3 className="w-20 h-20 text-slate-400 mb-6" />
                 <h2 className="text-2xl font-black text-slate-900 tracking-tight">Intelligence Dashboard Waiting</h2>
                 <p className="text-sm font-black text-slate-800 max-w-lg">
                  Recommendations will populate here after you upload your hotel sales ledger.
                 </p>
              </div>
            ) : (
              <>
                {loading ? (
                  <div className="h-96 bg-white rounded-3xl border border-slate-200 border-dashed flex flex-col items-center justify-center p-12 text-center">
                    <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mb-6 ring-1 ring-indigo-100/50 shadow-sm">
                      <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">Calculating strategy intelligence for {location}...</h3>
                    <p className="text-slate-500 max-w-sm font-medium">Synthesizing localized market patterns and your unique performance metrics.</p>
                  </div>
                ) : error ? (
                  <div className="bg-red-50 border border-red-100 rounded-2xl p-8 flex items-start gap-4">
                    <AlertCircle className="w-6 h-6 text-red-600 shrink-0" />
                    <div>
                      <h3 className="font-bold text-red-900">Analysis Error</h3>
                      <p className="text-red-700 mb-4">{error}</p>
                      <button onClick={() => {setError(null); fetchPlan();}} className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700">Try Again</button>
                    </div>
                  </div>
                ) : plan ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative group">
                        <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity pointer-events-none">
                          <TrendingUp className="w-24 h-24 text-indigo-600" />
                        </div>
                        <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Projected Profitability Path</h3>
                        <p className="text-[13px] font-black text-slate-900 mb-6 leading-tight">Target: {(performanceData.profitMargin + xValue).toFixed(1)}% Margin</p>
                        <ProfitProjectionChart data={plan.projectedProfitability} target={xValue} />
                      </div>
                      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative group">
                        <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity pointer-events-none">
                          <Target className="w-24 h-24 text-indigo-600" />
                        </div>
                        <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Impact Distribution</h3>
                        <p className="text-[13px] font-black text-slate-900 mb-6 leading-tight">By Strategic Category</p>
                        <CategoryImpactChart recommendations={plan.recommendations} />
                      </div>
                      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative group">
                        <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity pointer-events-none">
                          <Heart className="w-24 h-24 text-rose-600" />
                        </div>
                        <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Consumer Usage/Demand</h3>
                        <p className="text-[13px] font-black text-slate-900 mb-6 leading-tight">Service Likings (Derived from uploaded data)</p>
                        <ConsumerUsageChart insights={plan.consumerInsights} />
                      </div>
                    </div>

                    {plan.sources && plan.sources.length > 0 && (
                      <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-wrap items-center gap-3">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2 flex items-center gap-1.5">
                          <Globe className="w-3 h-3" />
                          GROUNDED SOURCES:
                        </span>
                        {plan.sources.map((src, idx) => (
                          <a key={idx} href={src.uri} target="_blank" rel="noopener noreferrer" className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-2 py-1 rounded-md border border-indigo-100 transition-colors">
                            {src.title}
                          </a>
                        ))}
                      </div>
                    )}

                    {selectedRole === StakeholderRole.OPERATIONS_MANAGER ? (
                      plan.operationalCostProjections && (
                        <div className="bg-gradient-to-br from-slate-900 to-indigo-950 p-8 rounded-3xl text-white shadow-xl relative overflow-hidden group border border-white/5">
                          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-all pointer-events-none">
                            <Calculator className="w-32 h-32" />
                          </div>
                          <div className="relative z-10 flex flex-col md:flex-row gap-8">
                            <div className="flex-1">
                              <h3 className="text-[10px] font-black text-indigo-300 uppercase tracking-[0.2em] mb-3">Monthly Operational Costs - Next 3 Months</h3>
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
                                {plan.operationalCostProjections.slice(0, 3).map((proj, idx) => (
                                  <div key={idx} className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-sm">
                                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">{proj.month}</p>
                                    <p className="text-2xl font-black mb-2">{proj.cost}</p>
                                    <p className="text-[11px] text-white/60 leading-tight">
                                      <span className="text-emerald-400 font-bold block mb-1">Impact: {proj.impactOnProfit}</span>
                                      {proj.savingsOpportunity}
                                    </p>
                                  </div>
                                ))}
                              </div>
                              <div className="bg-indigo-500/10 border border-indigo-400/20 rounded-2xl p-5">
                                <p className="text-[11px] font-medium text-indigo-100/90 leading-relaxed italic">
                                  <span className="font-black text-indigo-300 mr-2 uppercase tracking-tighter not-italic">Derived Logic:</span>
                                  Operational costs are calculated by merging your internal hospitality usage data with current {location} market overhead benchmarks. Savings target services with the highest ROI-to-maintenance ratio.
                                </p>
                              </div>
                            </div>
                            <div className="md:w-64 shrink-0 flex flex-col justify-center">
                              <div className="p-1 bg-white/10 rounded-2xl backdrop-blur-md border border-white/20 h-full">
                                <div className="px-6 py-8 flex flex-col items-center justify-center h-full text-center">
                                  <div className="w-12 h-12 bg-indigo-500/20 rounded-full flex items-center justify-center mb-4 ring-1 ring-indigo-400/30 shadow-inner">
                                    <Zap className="w-6 h-6 text-amber-400" />
                                  </div>
                                  <span className="text-[10px] font-black text-indigo-200 uppercase tracking-widest mb-1">Cost Efficiency Readiness</span>
                                  <span className="text-2xl font-black mb-1">High Focus</span>
                                  <span className="text-[10px] font-bold text-white/40 uppercase tracking-tighter">Next 3 Months</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    ) : (
                      plan.recommendedInvestment && selectedRole === StakeholderRole.MARKETING_HEAD && (
                        <div className="bg-gradient-to-br from-indigo-900 to-slate-900 p-8 rounded-3xl text-white shadow-xl relative overflow-hidden group">
                          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-all pointer-events-none">
                            <Wallet className="w-32 h-32" />
                          </div>
                          <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-8">
                            <div className="flex-1">
                              <h3 className="text-[10px] font-black text-indigo-300 uppercase tracking-[0.2em] mb-3">Minimum Recommended Investment</h3>
                              <div className="flex items-baseline gap-4 mb-4">
                                <span className="text-4xl font-black tracking-tight">{plan.recommendedInvestment.amount}</span>
                                <span className="text-indigo-400 font-bold uppercase text-xs tracking-widest">for {plan.recommendedInvestment.period}</span>
                              </div>
                              <p className="text-indigo-100/80 text-sm leading-relaxed max-w-xl font-medium">
                                {plan.recommendedInvestment.rationale}
                              </p>
                            </div>
                            <div className="shrink-0 p-1 bg-white/10 rounded-2xl backdrop-blur-md border border-white/20">
                              <div className="px-6 py-4 flex flex-col items-center">
                                <Zap className="w-8 h-8 text-amber-400 mb-2" />
                                <span className="text-[10px] font-black text-indigo-200 uppercase tracking-widest text-center">Execution Readiness</span>
                                <span className="text-xl font-black mt-1">High Impact</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                ) : null}

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-black text-slate-900">Tailored Action Items for {selectedRole}</h2>
                    <div className="flex items-center gap-4">
                       {!loading && plan && (
                         <button 
                          onClick={handleExportRoleStrategy}
                          className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg border border-indigo-200 text-xs font-bold transition-all shadow-sm"
                         >
                           <Download className="w-3.5 h-3.5" />
                           Export Strategy (PDF)
                         </button>
                       )}
                       <div className="flex items-center gap-2">
                          {loading && <Loader2 className="w-3.5 h-3.5 text-indigo-400 animate-spin" />}
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
                            {loading ? 'CALCULATING...' : (filteredRecommendations?.length || 0) + ' Recommended Actions'}
                          </span>
                       </div>
                    </div>
                  </div>
                  
                  {loading ? (
                    <div className="p-8 bg-white border border-slate-200 border-dashed rounded-3xl flex items-center justify-center text-slate-400 font-bold italic animate-pulse">
                      <Loader2 className="w-5 h-5 animate-spin mr-3 text-indigo-400" />
                      generating strategic recommendations, tailored action items ..
                    </div>
                  ) : plan ? (
                    <div className="grid grid-cols-1 gap-4">
                      {filteredRecommendations?.map((rec, idx) => (
                        <div key={idx} className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all group">
                          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-3">
                                <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                                  rec.priority === 'High' ? 'bg-red-50 text-red-600 border border-red-100' : 
                                  rec.priority === 'Medium' ? 'bg-orange-50 text-orange-600 border border-orange-100' : 
                                  'bg-emerald-50 text-emerald-600 border border-emerald-100'
                                }`}>
                                  {rec.priority} Priority
                                </span>
                                <span className="text-xs font-medium text-slate-300">•</span>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{rec.category}</span>
                              </div>
                              <h3 className="text-xl font-black text-slate-900 mb-2 group-hover:text-indigo-600 transition-colors">{rec.action}</h3>
                              <p className="text-slate-600 text-sm mb-4 leading-relaxed font-medium"><span className="font-black text-slate-800 uppercase text-[10px] tracking-wider mr-2">Goal:</span> {rec.goal}</p>
                              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                                <div className="flex items-start gap-4">
                                  <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center shrink-0">
                                    <Lightbulb className="w-4 h-4 text-amber-600" />
                                  </div>
                                  <div className="text-sm">
                                    <p className="font-black text-slate-800 uppercase text-[10px] tracking-wider mb-1">Execution Example</p>
                                    <p className="text-slate-600 italic font-medium leading-tight">"{rec.example}"</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="md:w-40 flex flex-col items-center justify-center p-6 bg-slate-50 rounded-2xl border border-slate-100 shrink-0">
                              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 text-center">Profit Impact</span>
                              <span className="text-sm font-semibold text-slate-900 tracking-tight leading-tight text-center">
                                {rec.estimatedImpact.replace(/^\++/g, '+').startsWith('+') ? rec.estimatedImpact.replace(/^\++/g, '+') : '+' + rec.estimatedImpact.replace(/^\++/g, '+')}
                              </span>
                              <div className="mt-2 flex items-center gap-1.5 px-2 py-0.5 bg-white rounded-md border border-indigo-100">
                                  <TrendingUp className="w-3 h-3 text-slate-500" />
                                  <span className="text-[9px] font-bold text-slate-600 uppercase">Growth Index</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              </>
            )}
          </div>
        </div>
      </main>

      {isUploadModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setIsUploadModalOpen(false)} />
          <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
                  <FileSpreadsheet className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900">Upload Sales/Ledger/Trnx. File</h2>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Performance Sync</p>
                </div>
              </div>
              <button onClick={() => setIsUploadModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-xl transition-colors">
                <X className="w-6 h-6 text-slate-400" />
              </button>
            </div>
            <div className="p-8 space-y-6">
              <div className="flex items-center justify-between bg-indigo-50 rounded-2xl p-4 border border-indigo-100">
                <div>
                  <h4 className="text-sm font-black text-indigo-900">Don't have a file ready?</h4>
                  <p className="text-xs text-indigo-700 font-medium">Test ProfitPath AI instantly with our sample hotel sales data.</p>
                </div>
                <button 
                  onClick={handleLoadSampleData}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-md transition-all active:scale-95 shrink-0"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  TRY SAMPLE DATA
                </button>
              </div>

              <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 relative overflow-hidden">
                <div className="absolute -top-6 -right-6 opacity-5">
                   <Info className="w-32 h-32 text-indigo-600" />
                </div>
                <h4 className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-wider mb-4">
                  <Info className="w-3.5 h-3.5" />
                  SCHEMA REQUIREMENTS
                </h4>
                <div className="grid grid-cols-2 gap-4 text-[11px]">
                  <div><span className="font-black text-slate-800">revenue/occupied/inventory</span> - Base yield data</div>
                  <div><span className="font-black text-slate-800">service_rating</span> - Overall feedback (0-5)</div>
                  <div><span className="font-black text-slate-800">hosp_addon_pct</span> - Hospitality service usage</div>
                  <div><span className="font-black text-slate-800">hosp_addon_rating</span> - Hospitality service liking</div>
                </div>
              </div>
              
              <div onClick={() => fileInputRef.current?.click()} className="group cursor-pointer border-2 border-dashed border-slate-200 rounded-3xl p-5 text-center hover:border-indigo-500 hover:bg-indigo-50/30 transition-all flex flex-col items-center gap-4">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center group-hover:bg-indigo-100 transition-all">
                  <CloudUpload className="w-8 h-8 text-slate-400 group-hover:text-indigo-600" />
                </div>
                <div>
                  <p className="text-lg font-black text-slate-900">Click to browse Ledger Files</p>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Supports .xlsx, .csv, and .txt (AI Unstructured Extraction)</p>
                </div>
                <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept=".csv,.xlsx,.txt" />
              </div>
            </div>
            <div className="px-8 py-6 bg-slate-50 border-t border-slate-100 flex items-center justify-end">
              <button onClick={() => setIsUploadModalOpen(false)} className="px-6 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm font-black uppercase tracking-widest hover:bg-slate-100 transition-colors shadow-sm">
                CANCEL
              </button>
            </div>
          </div>
        </div>
      )}

      <AnalyticalBot 
        isOpen={isBotOpen} 
        onClose={() => setIsBotOpen(false)} 
        hotelContext={currentStats} 
        hasData={!performanceData.isDefault}
      />
    </div>
  );
};

export default App;