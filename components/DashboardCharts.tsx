import React from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, Cell
} from 'recharts';
import { ConsumerInsight, Recommendation } from '../types';

interface ChartProps {
  data: number[];
  target: number;
}

export const ProfitProjectionChart: React.FC<ChartProps> = ({ data, target }) => {
  // Prepend current state (Month 0)
  const chartData = [
    {
      month: 'Now',
      profit: 25, // Current baseline
      target: 25
    },
    ...data.map((val, idx) => ({
      month: `M${idx + 1}`,
      profit: parseFloat(val.toFixed(2)),
      target: parseFloat((25 + (target / data.length) * (idx + 1)).toFixed(2))
    }))
  ];

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ left: -35, right: 10, top: 10, bottom: 0 }}>
          <defs>
            <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1}/>
              <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
          <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
          <YAxis stroke="#64748b" fontSize={12} tickFormatter={(val) => `${val}%`} />
          <Tooltip 
            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', zIndex: 100 }}
          />
          <Area type="monotone" dataKey="profit" stroke="#4f46e5" fillOpacity={1} fill="url(#colorProfit)" strokeWidth={3} />
          <Area type="monotone" dataKey="target" stroke="#94a3b8" strokeDasharray="5 5" fill="none" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

const CustomImpactTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white p-5 border border-slate-100 shadow-2xl rounded-xl w-72 sm:w-80 ring-1 ring-slate-900/10 pointer-events-none z-[100]">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 whitespace-normal leading-tight">
          {data.name}
        </p>
        <p className="text-sm font-black text-indigo-600 mb-3 whitespace-nowrap">
          Total Impact: +{data.impact.toFixed(1)}% Profit
        </p>
        <div className="space-y-2 border-t border-slate-50 pt-3">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Key Actions:</p>
          <ul className="space-y-2">
            {data.actions.map((action: string, i: number) => (
              <li key={i} className="text-[11px] text-slate-600 leading-snug flex gap-2">
                <span className="text-indigo-400 font-bold shrink-0">•</span>
                <span className="whitespace-normal">{action}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  }
  return null;
};

export const CategoryImpactChart: React.FC<{ recommendations: Recommendation[] }> = ({ recommendations }) => {
  const categories = Array.from(new Set(recommendations.map(r => r.category)));
  const data = categories.map(cat => {
    const items = recommendations.filter(r => r.category === cat);
    const totalImpact = items.reduce((acc, curr) => acc + (parseFloat(curr.estimatedImpact) || 0), 0);
    const actions = items.map(i => i.action);
    return { name: cat, impact: totalImpact, actions };
  });

  const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: -20, right: 30 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
          <XAxis type="number" hide />
          <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={10} width={120} tick={{ fontSize: 9 }} />
          <Tooltip 
            content={<CustomImpactTooltip />} 
            cursor={{ fill: 'rgba(79, 70, 229, 0.05)' }}
            allowEscapeViewBox={{ x: true, y: true }}
            wrapperStyle={{ zIndex: 1000 }}
          />
          <Bar dataKey="impact" radius={[0, 4, 4, 0]} barSize={32}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export const ConsumerUsageChart: React.FC<{ insights: ConsumerInsight[] }> = ({ insights }) => {
  return (
    <div className="h-64 w-full space-y-3 overflow-y-auto no-scrollbar pt-2">
      {insights.map((insight, idx) => (
        <div key={idx} className="space-y-1">
          <div className="flex justify-between items-end">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-slate-700 truncate max-w-[120px]">{insight.category}</span>
              <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-bold uppercase tracking-tighter ${
                insight.type === 'Hospitality' ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' : 'bg-slate-100 text-slate-600 border border-slate-200'
              }`}>
                {insight.type === 'Hospitality' ? 'Hosp' : 'Non-Hosp'}
              </span>
            </div>
            <span className="text-[10px] font-black text-slate-400">{insight.usageScore}%</span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-1000 ${
                insight.type === 'Hospitality' ? 'bg-indigo-500' : 'bg-slate-400'
              }`}
              style={{ width: `${insight.usageScore}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
};