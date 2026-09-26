import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { PageHeader } from '../../components/common/PageHeader';
import { StatCard } from '../../components/common/StatCard';
import { GREEN_CITIZENS_LEADERBOARD } from '../../data/users';
import { 
  Award, 
  Sparkles, 
  Sprout, 
  ShieldCheck, 
  CheckCircle2, 
  TrendingUp, 
  Gift, 
  Users, 
  ArrowRight,
  Flame
} from 'lucide-react';

export const GreenPointsPage = () => {
  const { currentUser } = useAuth();

  const points = typeof currentUser?.greenPoints === 'number' ? currentUser.greenPoints : 0;

  // Dynamic Level Calculation
  let currentLevel = 1;
  let levelTitle = "Green Starter";
  let currentTierMin = 0;
  let nextTierTarget = 250;
  let nextLevelTitle = "Active Contributor";

  if (points >= 2000) {
    currentLevel = 5;
    levelTitle = "Green Champion";
    currentTierMin = 2000;
    nextTierTarget = 2000;
    nextLevelTitle = "Top Level Reached";
  } else if (points >= 1000) {
    currentLevel = 4;
    levelTitle = "Eco Guardian";
    currentTierMin = 1000;
    nextTierTarget = 2000;
    nextLevelTitle = "Green Champion";
  } else if (points >= 500) {
    currentLevel = 3;
    levelTitle = "Clean City Contributor";
    currentTierMin = 500;
    nextTierTarget = 1000;
    nextLevelTitle = "Eco Guardian";
  } else if (points >= 250) {
    currentLevel = 2;
    levelTitle = "Active Contributor";
    currentTierMin = 250;
    nextTierTarget = 500;
    nextLevelTitle = "Clean City Contributor";
  }

  const pointsNeeded = Math.max(0, nextTierTarget - points);
  const progressPercent = currentLevel === 5 ? 100 : Math.min(100, Math.max(0, Math.round(((points - currentTierMin) / (nextTierTarget - currentTierMin)) * 100)));

  const perks = [
    { title: "Free 5kg Municipal Organic Compost", cost: 500, icon: Sprout, desc: "Redeemable at Shivaji Nagar composting center." },
    { title: "20% Metro Transit Discount Voucher", cost: 800, icon: Gift, desc: "Apply toward monthly civic metro card recharge." },
    { title: "Urban Tree Plantation Certificate", cost: 1200, icon: Award, desc: "A sapling planted in Pune Green Corridor with your name." }
  ];

  const badgesCatalog = [
    { id: "b1", name: "Green Starter", icon: Sprout, description: "Joined CleanTrack Community", threshold: 0 },
    { id: "b2", name: "Active Contributor", icon: Award, description: "Reported verified waste and reached 250+ points", threshold: 250 },
    { id: "b3", name: "Clean City Contributor", icon: CheckCircle2, description: "Reached 500+ Green Points from verified cleanups", threshold: 500 },
    { id: "b4", name: "Eco Guardian", icon: ShieldCheck, description: "Reached 1,000+ points and maintained 95%+ report accuracy", threshold: 1000 }
  ];

  // Dynamic Leaderboard: Check if user exists, else append user at current position
  const baseLeaderboard = GREEN_CITIZENS_LEADERBOARD.map(c => ({
    ...c,
    isCurrentUser: currentUser && (c.name.toLowerCase() === currentUser.name?.toLowerCase())
  }));

  const isUserInTop = baseLeaderboard.some(c => c.isCurrentUser);

  return (
    <div className="space-y-8 pb-16">
      <PageHeader
        title="Green Points & Civic Rewards"
        subtitle="Earn eco points for reporting waste, verifying cleanups, and keeping your city clean."
        breadcrumbs={[{ label: "Dashboard", path: "/citizen/dashboard" }, { label: "Green Points" }]}
      />

      {/* Gamified Rewards Header Card */}
      <div className="bg-gradient-to-r from-amber-500 via-emerald-600 to-forest-900 rounded-3xl p-6 sm:p-10 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          <div className="md:col-span-7 space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-bold uppercase tracking-wider backdrop-blur-md">
              <Award className="w-4 h-4 text-amber-300" />
              <span>Level {currentLevel}: {levelTitle}</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              {points.toLocaleString()} <span className="text-xl font-normal opacity-90">Green Points</span>
            </h2>
            <p className="text-xs sm:text-sm text-emerald-100 max-w-lg font-light leading-relaxed">
              {points === 0 ? (
                <span>Welcome to CleanTrack! Report waste issues or verify cleanups in your ward to earn Green Points and climb the ranks.</span>
              ) : currentLevel === 5 ? (
                <span>Congratulations! You have reached the highest tier <strong>Level 5: Green Champion</strong> in your city.</span>
              ) : (
                <span>You have earned <strong>{points} Green Points</strong>! {pointsNeeded} more points needed to reach <em>Level {currentLevel + 1}: {nextLevelTitle}</em>.</span>
              )}
            </p>

            {/* Dynamic Level Progress Bar */}
            <div className="pt-2 max-w-md space-y-1.5">
              <div className="flex justify-between text-xs font-mono font-bold">
                <span>Level {currentLevel} ({currentTierMin.toLocaleString()} pts)</span>
                <span>Level {currentLevel === 5 ? 5 : currentLevel + 1} ({nextTierTarget.toLocaleString()} pts)</span>
              </div>
              <div className="h-3 w-full bg-black/30 rounded-full overflow-hidden p-0.5">
                <div
                  className="h-full bg-amber-400 rounded-full transition-all duration-1000 shadow-md shadow-amber-400/50"
                  style={{ width: `${Math.max(points === 0 ? 0 : 5, progressPercent)}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Citizen of the Month Spotlight / Clean Start */}
          <div className="md:col-span-5 bg-slate-900/60 backdrop-blur-md rounded-2xl p-5 border border-white/20 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-amber-300 tracking-wider">🌟 Clean City Contributor Tier</span>
              <span className="text-xs font-mono text-emerald-300">{currentUser?.ward || "All Wards"}</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full border-2 border-amber-400 bg-emerald-700/60 flex items-center justify-center text-white font-bold text-base">
                {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'C'}
              </div>
              <div>
                <h4 className="font-bold text-white text-sm">{currentUser?.name || "Citizen"}</h4>
                <p className="text-xs text-slate-300">{currentUser?.stats?.reportsSubmitted || 0} Verified Reports • {points} pts</p>
              </div>
            </div>
            <p className="text-[11px] text-slate-300 italic">
              "Report roadside litter and confirm cleanups with before/after photo verification to earn points!"
            </p>
          </div>
        </div>
      </div>

      {/* Badges Grid */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-slate-900">Civic Achievements & Badges</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {badgesCatalog.map((badge) => {
            const Icon = badge.icon;
            const isUnlocked = points >= badge.threshold || (currentUser?.badges || []).some(b => b.id === badge.id || b.name === badge.name);

            return (
              <div
                key={badge.id}
                className={`p-5 rounded-2xl border text-center space-y-2 transition-all ${
                  isUnlocked
                    ? "bg-white border-slate-200 shadow-xs"
                    : "bg-slate-50 border-slate-200 opacity-60"
                }`}
              >
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto border ${
                  isUnlocked
                    ? "bg-amber-50 text-amber-600 border-amber-200"
                    : "bg-slate-200 text-slate-400 border-slate-300"
                }`}>
                  <Icon className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-sm text-slate-900">{badge.name}</h4>
                <p className="text-xs text-slate-500 line-clamp-2">{badge.description}</p>
                <span className={`text-[10px] font-mono font-bold block pt-1 ${
                  isUnlocked ? "text-emerald-600" : "text-slate-400"
                }`}>
                  {isUnlocked ? "Unlocked ✓" : `Unlocks at ${badge.threshold} pts`}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Leaderboard Table & Redeemable Benefits */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Leaderboard */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-brand-600" />
              <h3 className="text-base font-bold text-slate-900">Citywide Clean Citizen Leaderboard</h3>
            </div>
            <span className="text-xs text-slate-500 font-mono">Updated Daily</span>
          </div>

          <div className="space-y-2">
            {baseLeaderboard.map((citizen) => (
              <div
                key={citizen.rank}
                className={`p-3 rounded-xl flex items-center justify-between transition-all ${
                  citizen.isCurrentUser
                    ? "bg-brand-50 border border-brand-300 font-bold"
                    : "bg-slate-50 border border-slate-100"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-base font-bold w-6 text-center">{citizen.badge || `#${citizen.rank}`}</span>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                      {citizen.name} {citizen.isCurrentUser && <span className="text-brand-600 font-normal">(You)</span>}
                    </h4>
                    <p className="text-[11px] text-slate-500">{citizen.ward} • {citizen.level}</p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-sm font-extrabold text-emerald-700">{citizen.points} pts</span>
                  <span className="text-[10px] text-slate-400 block">{citizen.reports} reports</span>
                </div>
              </div>
            ))}

            {/* If current user is not in the top leaderboard list, show their row */}
            {!isUserInTop && currentUser && (
              <div className="p-3 rounded-xl flex items-center justify-between bg-brand-50 border border-brand-300 font-bold">
                <div className="flex items-center gap-3">
                  <span className="text-base font-bold w-6 text-center">🌱</span>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                      {currentUser.name} <span className="text-brand-600 font-normal">(You)</span>
                    </h4>
                    <p className="text-[11px] text-slate-500">{currentUser.ward || 'Ward 12'} • Level {currentLevel} {levelTitle}</p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-sm font-extrabold text-emerald-700">{points} pts</span>
                  <span className="text-[10px] text-slate-400 block">{currentUser.stats?.reportsSubmitted || 0} reports</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Redeem Rewards */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Gift className="w-5 h-5 text-amber-500" />
            <h3 className="text-base font-bold text-slate-900">Redeem Civic Benefits</h3>
          </div>

          <div className="space-y-3">
            {perks.map((perk, idx) => {
              const Icon = perk.icon;
              const canAfford = points >= perk.cost;

              return (
                <div key={idx} className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4 text-emerald-600" />
                      <h4 className="font-bold text-xs text-slate-900">{perk.title}</h4>
                    </div>
                    <span className="text-xs font-mono font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      {perk.cost} pts
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">{perk.desc}</p>
                  <button
                    disabled={!canAfford}
                    className={`w-full py-1.5 text-center text-xs font-bold rounded-lg transition-all ${
                      canAfford
                        ? "bg-brand-600 hover:bg-brand-700 text-white shadow-xs cursor-pointer"
                        : "bg-slate-200 text-slate-400 cursor-not-allowed"
                    }`}
                  >
                    {canAfford ? "Redeem Benefit" : `Need ${perk.cost - points} More Pts`}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
