import React, { useState, useMemo } from 'react';
import { DollarSign, Award, Clock, ArrowRight, TrendingUp } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function EarningsCalculator() {
  const [tokensPerHour, setTokensPerHour] = useState<number>(300);
  const [hoursPerWeek, setHoursPerWeek] = useState<number>(20);
  const [tokenValue, setTokenValue] = useState<number>(0.05); // standard model payout per token
  const [agencySplit, setAgencySplit] = useState<number>(80);  // industry standard is 50%, our agency pays 80%

  const calculations = useMemo(() => {
    const weeklyTokens = tokensPerHour * hoursPerWeek;
    const weeklyGross = weeklyTokens * tokenValue;
    const weeklyEarnings = weeklyGross * (agencySplit / 100);
    const monthlyEarnings = weeklyEarnings * 4.34;
    const annualEarnings = weeklyEarnings * 52;
    
    // Industry standard comparison at 50% split
    const industryWeeklyEarnings = weeklyGross * 0.50;
    const weeklyBonus = weeklyEarnings - industryWeeklyEarnings;

    return {
      weeklyTokens,
      weeklyEarnings,
      monthlyEarnings,
      annualEarnings,
      weeklyBonus,
      industryWeeklyEarnings
    };
  }, [tokensPerHour, hoursPerWeek, tokenValue, agencySplit]);

  // Generate chart data based on increasing hours
  const chartData = useMemo(() => {
    const points = [];
    // Calculate for 5, 10, 20, 30, 40, 50, 60 hours
    const hoursPoints = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60];
    for (const h of hoursPoints) {
      const weeklyTokens = tokensPerHour * h;
      const weeklyGross = weeklyTokens * tokenValue;
      const agencyEarnings = Math.round(weeklyGross * (agencySplit / 100));
      const independentEarnings = Math.round(weeklyGross * 0.50); // standard 50%
      points.push({
        hours: `${h}h`,
        'Your Earnings (80% Agency)': agencyEarnings,
        'Standard Platform (50% Independent)': independentEarnings,
      });
    }
    return points;
  }, [tokensPerHour, tokenValue, agencySplit]);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 shadow-2xl relative overflow-hidden" id="earnings-calculator-section">
      <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
      
      <div className="relative">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-slate-100">Live Earnings Estimator</h3>
            <p className="text-sm text-slate-400">Estimate your payouts based on active engagement rates.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Controls */}
          <div className="lg:col-span-5 space-y-6">
            {/* Tokens per Hour Slider */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <label className="text-slate-300 font-medium">Avg. Tokens Per Hour</label>
                <span className="text-purple-400 font-semibold font-mono">{tokensPerHour.toLocaleString()} tk/hr</span>
              </div>
              <input
                type="range"
                min="50"
                max="1500"
                step="50"
                value={tokensPerHour}
                onChange={(e) => setTokensPerHour(Number(e.target.value))}
                className="w-full accent-purple-500 bg-slate-800"
              />
              <div className="flex justify-between text-[11px] text-slate-500 font-mono">
                <span>50 tk</span>
                <span>750 tk (Average)</span>
                <span>1,500 tk</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Hourly tokens include public chat tips, private show minute rates, and viewer gifts.
              </p>
            </div>

            {/* Hours per Week Slider */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <label className="text-slate-300 font-medium">Weekly Streaming Hours</label>
                <span className="text-purple-400 font-semibold font-mono">{hoursPerWeek} hours/wk</span>
              </div>
              <input
                type="range"
                min="5"
                max="60"
                step="1"
                value={hoursPerWeek}
                onChange={(e) => setHoursPerWeek(Number(e.target.value))}
                className="w-full accent-purple-500 bg-slate-800"
              />
              <div className="flex justify-between text-[11px] text-slate-500 font-mono">
                <span>5 hrs</span>
                <span>30 hrs (Full-time)</span>
                <span>60 hrs</span>
              </div>
            </div>

            {/* Token Value Selector */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <label className="text-slate-300 font-medium">Token Conversion Rate</label>
                <span className="text-purple-400 font-semibold font-mono">${tokenValue.toFixed(2)} USD</span>
              </div>
              <input
                type="range"
                min="0.04"
                max="0.08"
                step="0.005"
                value={tokenValue}
                onChange={(e) => setTokenValue(Number(e.target.value))}
                className="w-full accent-purple-500 bg-slate-800"
              />
              <div className="flex justify-between text-[11px] text-slate-500 font-mono">
                <span>$0.04</span>
                <span>$0.05 (Standard Web)</span>
                <span>$0.08 (Premium Partner)</span>
              </div>
            </div>

            {/* Agency Split Selector */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <label className="text-slate-300 font-medium">Agency Payout Split</label>
                <span className="text-purple-400 font-semibold font-mono">{agencySplit}% payout</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[60, 70, 80].map((split) => (
                  <button
                    key={split}
                    type="button"
                    onClick={() => setAgencySplit(split)}
                    className={`py-2 px-3 rounded-lg text-xs font-semibold font-mono transition-all border ${
                      agencySplit === split
                        ? 'bg-purple-600 border-purple-500 text-white shadow-lg'
                        : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {split}% {split === 80 ? '(Elite Studio)' : ''}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Most standard cam-sites charge direct models up to <strong className="text-slate-400">50% in commissions</strong>. Our agency raises this split to <strong className="text-slate-400 font-semibold">{agencySplit}%</strong> by providing premium server architecture, active geoblocking, anti-piracy, and training support!
              </p>
            </div>
          </div>

          {/* Outputs */}
          <div className="lg:col-span-7 flex flex-col justify-between space-y-6">
            {/* Visual Earnings Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 text-center">
                <p className="text-xs text-slate-400 uppercase tracking-wider font-mono">Weekly Projection</p>
                <h4 className="text-2xl font-bold text-white mt-1 font-mono">
                  ${Math.round(calculations.weeklyEarnings).toLocaleString()}
                </h4>
                <p className="text-[10px] text-purple-400 font-mono mt-1">
                  {(tokensPerHour * hoursPerWeek).toLocaleString()} tokens
                </p>
              </div>

              <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 text-center relative overflow-hidden">
                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-purple-500 to-indigo-500"></div>
                <p className="text-xs text-slate-400 uppercase tracking-wider font-mono">Monthly Average</p>
                <h4 className="text-2xl font-bold text-purple-400 mt-1 font-mono">
                  ${Math.round(calculations.monthlyEarnings).toLocaleString()}
                </h4>
                <p className="text-[10px] text-slate-500 mt-1">4.33 weeks basis</p>
              </div>

              <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 text-center">
                <p className="text-xs text-slate-400 uppercase tracking-wider font-mono">Annual Potential</p>
                <h4 className="text-3xl sm:text-2xl font-bold text-white mt-1 font-mono">
                  ${Math.round(calculations.annualEarnings).toLocaleString()}
                </h4>
                <p className="text-[10px] text-green-400 font-mono mt-1">Full-year projected</p>
              </div>
            </div>

            {/* Comparison Bar */}
            <div className="bg-purple-950/20 border border-purple-800/30 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <span className="text-[10px] bg-purple-500/20 text-purple-300 font-semibold px-2 py-0.5 rounded-full font-mono uppercase">
                  Agency Advantage
                </span>
                <p className="text-sm text-slate-200 mt-1">
                  Earn <strong className="text-purple-400">+${Math.round(calculations.weeklyBonus).toLocaleString()} more per week</strong> compared to industry standard (50% split).
                </p>
              </div>
              <div className="text-right font-mono">
                <span className="text-xs text-slate-400">Weekly Difference</span>
                <div className="text-lg font-bold text-green-400 leading-none mt-1">
                  +{(agencySplit - 50)}% Profit Share
                </div>
              </div>
            </div>

            {/* Mini Area Chart */}
            <div className="h-44 w-full bg-slate-950/40 rounded-xl border border-slate-800/60 p-2 relative">
              <div className="absolute top-2 left-4 text-[10px] text-slate-400 font-mono z-10 flex items-center gap-2">
                <TrendingUp className="w-3.5 h-3.5 text-purple-400" />
                <span>Earnings Scaling by Hours Worked</span>
              </div>
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <AreaChart
                  data={chartData}
                  margin={{ top: 30, right: 10, left: -20, bottom: 5 }}
                >
                  <XAxis 
                    dataKey="hours" 
                    stroke="#475569" 
                    fontSize={10}
                    tickLine={false}
                  />
                  <YAxis 
                    stroke="#475569" 
                    fontSize={10} 
                    tickLine={false} 
                    tickFormatter={(v) => `$${v}`}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px' }}
                    labelStyle={{ color: '#94a3b8', fontFamily: 'monospace', fontSize: '11px' }}
                    itemStyle={{ fontFamily: 'monospace', fontSize: '11px', padding: '1px 0' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="Your Earnings (80% Agency)" 
                    stroke="#a855f7" 
                    fillOpacity={0.15} 
                    fill="url(#colorAgency)" 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="Standard Platform (50% Independent)" 
                    stroke="#64748b" 
                    fillOpacity={0.05} 
                    fill="url(#colorIndie)" 
                  />
                  <defs>
                    <linearGradient id="colorAgency" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorIndie" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#64748b" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#64748b" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
