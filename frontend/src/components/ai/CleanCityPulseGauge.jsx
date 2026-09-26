import React from 'react';
import { Activity, TrendingUp, Sparkles } from 'lucide-react';

export const CleanCityPulseGauge = ({ score = 82, size = "md", trend = "+6.4%", subtitle = "City Cleanliness Index" }) => {
  const radius = size === "lg" ? 64 : size === "sm" ? 36 : 48;
  const stroke = size === "lg" ? 10 : size === "sm" ? 6 : 8;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const dimension = radius * 2;

  const getScoreColor = (s) => {
    if (s >= 80) return "#22c55e"; // Emerald green
    if (s >= 65) return "#06b6d4"; // Cyan
    if (s >= 50) return "#f59e0b"; // Amber
    return "#ef4444"; // Red
  };

  return (
    <div className="flex items-center gap-4">
      <div className="relative flex items-center justify-center">
        {/* SVG Circular Progress */}
        <svg height={dimension} width={dimension} className="transform -rotate-90">
          <circle
            stroke="#e2e8f0"
            fill="transparent"
            strokeWidth={stroke}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
          <circle
            stroke={getScoreColor(score)}
            fill="transparent"
            strokeWidth={stroke}
            strokeDasharray={circumference + ' ' + circumference}
            style={{ strokeDashoffset, transition: 'stroke-dashoffset 1.5s ease-in-out' }}
            strokeLinecap="round"
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
        </svg>

        {/* Inner Score Display */}
        <div className="absolute flex flex-col items-center justify-center text-center">
          <span className={`font-extrabold tracking-tight text-slate-900 ${
            size === "lg" ? "text-3xl" : size === "sm" ? "text-base" : "text-xl"
          }`}>
            {score}
          </span>
          <span className="text-[10px] uppercase font-bold text-slate-400">/ 100</span>
        </div>
      </div>

      <div className="flex flex-col">
        <div className="flex items-center gap-1.5">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-800">Clean City Pulse™</span>
        </div>
        <p className="text-sm font-bold text-slate-800 mt-0.5">{subtitle}</p>
        {trend && (
          <div className="flex items-center gap-1 text-xs text-emerald-600 font-medium mt-0.5">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>{trend} this month</span>
          </div>
        )}
      </div>
    </div>
  );
};
