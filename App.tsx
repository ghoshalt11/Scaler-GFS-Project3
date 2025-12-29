
import React, { useState, useEffect, useCallback } from 'react';
import { 
  LayoutDashboard, 
  TrendingUp, 
  Settings, 
  Users, 
  DollarSign, 
  Lightbulb, 
  ChevronRight,
  Target,
  BarChart3,
  RefreshCw,
  AlertCircle,
  FileDown,
  Bot,
  Heart
} from 'lucide-react';
import { generateStrategicPlan } from './services/geminiService';
import { exportPlanToPDF } from './services/pdfService';
import { StakeholderRole, StrategicPlan, Recommendation } from './types';
import { ProfitProjectionChart, CategoryImpactChart, ConsumerUsageChart } from './components/DashboardCharts';
import { AnalyticalBot } from './components/AnalyticalBot';

const App: React.FC = () => {
  const [xValue, setXValue] = useState(15);
  const [yValue, setYValue] = useState(18);
  const [selectedRole, setSelectedRole] = useState<StakeholderRole>(StakeholderRole.GENERAL_MANAGER);
  const [loading, setLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [plan, setPlan] = useState<StrategicPlan | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isBotOpen, setIsBotOpen] = useState(false);

  const currentStats = `
    Hotel: Mid-Sized City Hotel (150 rooms)
    Current Occupancy: 68%
    ADR: $185
    RevPAR: $125.80
    Direct Bookings: 22%
    OTA Bookings: 78%
    Labor Costs: 34% of revenue
    Utility Costs: 8% of revenue
    Primary Competitors: 3 upscale properties within 2 miles
    Market Seasonality: Peak March-June, Dip Nov-Jan
  `;

  const fetchPlan = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await generateStrategicPlan(xValue, yValue, currentStats);
      setPlan(result);
    } catch (err) {
      console.error(err);
      setError("Failed to generate strategic plan. Please check your API key and try again.");
    } finally {
      setLoading(false);
    }
  }, [xValue, yValue, currentStats]);

  useEffect(() => {
    fetchPlan();
  }, []);

  const handleExport = () => {
    if (!plan) return;
    setIsExporting(true);
    try {
      exportPlanToPDF(plan, xValue, yValue);
    } catch (err) {
      console.error("PDF Export failed", err);
    } finally {
      setIsExporting(false);
    }
  };

  const getRoleIcon = (role: StakeholderRole) => {
    switch (role) {
      case StakeholderRole.GENERAL_MANAGER: return <LayoutDashboard className="w-5 h-5" />;
      case StakeholderRole.REVENUE_MANAGER: return <TrendingUp className="w-5 h-5" />;
      case StakeholderRole.MARKETING_HEAD: return <Users className="w-5 h-5" />;
      case StakeholderRole.OPERATIONS_MANAGER: return <Settings className="w-5 h-5" />;
      case StakeholderRole.FINANCE_DIRECTOR: return <DollarSign className="w-5 h-5" />;
    }
  };

  const filteredRecommendations = plan?.recommendations.filter(rec => {
    if (selectedRole === StakeholderRole.GENERAL_MANAGER) return true;
    if (selectedRole === StakeholderRole.REVENUE_MANAGER) return rec.category.includes('Revenue') || rec.category.includes('Decisions');
    if (selectedRole === StakeholderRole.MARKETING_HEAD) return rec.category.includes('Experience') || rec.category.includes('Revenue');
    if (selectedRole === StakeholderRole.OPERATIONS_MANAGER) return rec.category.includes('Efficiency') || rec.category.includes('Investment');
    if (selectedRole === StakeholderRole.FINANCE_DIRECTOR) return rec.category.includes('Efficiency') || rec.category.includes('Investment') || rec.category.includes('Decisions');
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Navigation Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                <BarChart3 className="w-6 h-6" />
              </div>
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600">
                RevElevate AI
              </span>
            </div>
            
            <div className="hidden md:flex items-center gap-6">
              <button 
                onClick={() => setIsBotOpen(true)}
                className="flex items-center gap-2 text-indigo-600 font-semibold text-sm hover:bg-indigo-50 px-3 py-1.5 rounded-full transition-all border border-indigo-100 shadow-sm"
              >
                <Bot className="w-4 h-4" />
                AI Strategist
              </button>
              <div className="flex items-center gap-2 text-sm text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full">
                <Target className="w-4 h-4 text-indigo-600" />
                Target: <span className="font-semibold text-slate-900">+{xValue}%</span> in <span className="font-semibold text-slate-900">{yValue} Months</span>
              </div>
              <button 
                onClick={fetchPlan}
                disabled={loading}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-md shadow-indigo-100"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Recalculate Strategy
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Sidebar / Controls - Reduced width to lg:col-span-2 to make cards wider */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Strategic Goals</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Profit Growth (%)</label>
                  <input 
                    type="range" min="5" max="50" step="1" 
                    value={xValue} onChange={(e) => setXValue(parseInt(e.target.value))}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                  <div className="flex justify-between mt-1 text-xs text-slate-500 font-medium">
                    <span>5%</span>
                    <span className="text-indigo-600 font-bold">{xValue}%</span>
                    <span>50%</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Timeline (Months)</label>
                  <input 
                    type="range" min="3" max="36" step="1" 
                    value={yValue} onChange={(e) => setYValue(parseInt(e.target.value))}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                  <div className="flex justify-between mt-1 text-xs text-slate-500 font-medium">
                    <span>3m</span>
                    <span className="text-indigo-600 font-bold">{yValue}m</span>
                    <span>36m</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">View Context</h3>
              <div className="space-y-2">
                {Object.values(StakeholderRole).map((role) => (
                  <button
                    key={role}
                    onClick={() => setSelectedRole(role)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                      selectedRole === role 
                        ? 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200' 
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {getRoleIcon(role)}
                    {role}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Main Dashboard Area - Increased width to lg:col-span-10 to make cards wider */}
          <div className="lg:col-span-10 space-y-8">
            
            {loading ? (
              <div className="h-96 bg-white rounded-3xl border border-slate-200 border-dashed flex flex-col items-center justify-center p-12 text-center">
                <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mb-6 animate-pulse">
                  <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Generating AI-Driven strategy</h3>
                <p className="text-slate-500 max-w-sm">Analyzing current sales transactions, market competitors, and operational costs for your property.</p>
              </div>
            ) : error ? (
              <div className="bg-red-50 border border-red-100 rounded-2xl p-8 flex items-start gap-4">
                <AlertCircle className="w-6 h-6 text-red-600 shrink-0" />
                <div>
                  <h3 className="font-bold text-red-900">Analysis Interrupted</h3>
                  <p className="text-red-700 mb-4">{error}</p>
                  <button onClick={fetchPlan} className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700">Try Again</button>
                </div>
              </div>
            ) : plan ? (
              <>
                {/* Stats Summary - Updated to 3 columns on desktop */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-4 opacity-5">
                      <TrendingUp className="w-24 h-24 text-indigo-600" />
                    </div>
                    <h3 className="text-sm font-medium text-slate-500 mb-1">Projected Profitability Path</h3>
                    <p className="text-2xl font-bold text-slate-900 mb-6 truncate">Target: {25 + xValue}% Margin</p>
                    <ProfitProjectionChart data={plan.projectedProfitability} target={xValue} />
                  </div>
                  
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-4 opacity-5">
                      <Target className="w-24 h-24 text-indigo-600" />
                    </div>
                    <h3 className="text-sm font-medium text-slate-500 mb-1">Impact Distribution</h3>
                    <p className="text-2xl font-bold text-slate-900 mb-6">By Strategic Category</p>
                    <CategoryImpactChart recommendations={plan.recommendations} />
                  </div>

                  {/* New Consumer Insights Card */}
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-4 opacity-5">
                      <Heart className="w-24 h-24 text-rose-600" />
                    </div>
                    <h3 className="text-sm font-medium text-slate-500 mb-1">Consumer Usage/Demand</h3>
                    <p className="text-2xl font-bold text-slate-900 mb-6">Service Likings</p>
                    <ConsumerUsageChart insights={plan.consumerInsights} />
                  </div>
                </div>

                {/* Recommendations List */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold text-slate-900">Tailored Action Items for {selectedRole}</h2>
                    <span className="text-xs font-medium text-slate-500 uppercase tracking-widest">{filteredRecommendations?.length || 0} Recommended Actions</span>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-4">
                    {filteredRecommendations?.map((rec, idx) => (
                      <div key={idx} className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow group">
                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-3">
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                rec.priority === 'High' ? 'bg-red-50 text-red-600' : 
                                rec.priority === 'Medium' ? 'bg-orange-50 text-orange-600' : 
                                'bg-emerald-50 text-emerald-600'
                              }`}>
                                {rec.priority} Priority
                              </span>
                              <span className="text-xs font-medium text-slate-400">•</span>
                              <span className="text-xs font-medium text-slate-500">{rec.category}</span>
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-indigo-600 transition-colors">{rec.action}</h3>
                            <p className="text-slate-600 text-sm mb-4 leading-relaxed"><span className="font-semibold text-slate-800">Goal:</span> {rec.goal}</p>
                            
                            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                              <div className="flex items-start gap-3">
                                <Lightbulb className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                                <div className="text-sm">
                                  <p className="font-bold text-slate-800 mb-1">Execution Example:</p>
                                  <p className="text-slate-600 italic">"{rec.example}"</p>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="md:w-32 flex flex-col items-center justify-center p-4 bg-indigo-50 rounded-2xl border border-indigo-100 shrink-0">
                            <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-1">Impact</span>
                            <span className="text-2xl font-black text-indigo-600">+{rec.estimatedImpact}</span>
                            <span className="text-[10px] font-medium text-indigo-400">Profit Boost</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Summary Box */}
                <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-3xl p-8 text-white shadow-xl shadow-indigo-200">
                  <div className="flex items-start gap-6">
                    <div className="hidden md:flex w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl items-center justify-center shrink-0">
                      <LayoutDashboard className="w-8 h-8 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold mb-2">Executive Summary</h3>
                      <p className="text-indigo-50 leading-relaxed text-sm opacity-90">
                        {plan.summary}
                      </p>
                      <button 
                        onClick={handleExport}
                        disabled={isExporting}
                        className="mt-6 flex items-center gap-2 bg-white text-indigo-600 px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-indigo-50 disabled:opacity-70 transition-colors"
                      >
                        {isExporting ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <FileDown className="w-4 h-4" />
                        )}
                        {isExporting ? 'Exporting...' : 'Export Strategic Roadmap (PDF)'}
                        {!isExporting && <ChevronRight className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-20">
                <p className="text-slate-500">Configure your goals on the left to generate a strategy.</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Analytical Bot Sidebar/Drawer */}
      <AnalyticalBot 
        isOpen={isBotOpen} 
        onClose={() => setIsBotOpen(false)} 
        hotelContext={currentStats}
      />

      {/* Floating CTA for Mobile */}
      <div className="md:hidden sticky bottom-4 mx-4 flex flex-col gap-2">
         <button 
          onClick={() => setIsBotOpen(true)}
          className="w-full bg-white border border-indigo-200 text-indigo-600 p-4 rounded-2xl font-bold shadow-xl flex items-center justify-center gap-2"
        >
          <Bot className="w-5 h-5" />
          Talk to AI Strategist
        </button>
        <button 
          onClick={fetchPlan}
          disabled={loading}
          className="w-full bg-indigo-600 text-white p-4 rounded-2xl font-bold shadow-xl flex items-center justify-center gap-2"
        >
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          Generate Strategy
        </button>
      </div>
    </div>
  );
};

export default App;
