import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { useDatabase } from '../context/DatabaseContext';
import { BottomSheet } from '../components/BottomSheet';
import { Plus, Weight, Activity, Share2, Target } from 'lucide-react';
import { toPng } from 'html-to-image';
import { v4 as uuidv4 } from 'uuid';
import { format, parseISO, subMonths, subYears, isAfter } from 'date-fns';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

export const Home: React.FC = () => {
  const { activeDb, isGuest } = useDatabase();
  const entries = useLiveQuery(() => activeDb.entries.orderBy('date').reverse().toArray(), [activeDb]);
  const settings = useLiveQuery(() => activeDb.settings.get(1), [activeDb]);
  const [isLogOpen, setLogOpen] = useState(false);
  const [period, setPeriod] = useState('All');

  // Form State
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [weightStr, setWeightStr] = useState('');
  const [notes, setNotes] = useState('');

  const currentWeight = entries?.length ? entries[0].weight_kg : null;
  const height_cm = settings?.height_cm || 175; 
  const bmiNum = currentWeight ? (currentWeight / Math.pow(height_cm / 100, 2)) : null;
  const bmi = bmiNum ? bmiNum.toFixed(1) : null;

  let bmiCategory = '--';
  let bmiColor = 'var(--text-secondary)';
  if (bmiNum) {
    if (bmiNum < 18.5) {
      bmiCategory = 'Underweight';
      bmiColor = '#feca57';
    } else if (bmiNum < 25) {
      bmiCategory = 'Healthy';
      bmiColor = 'var(--success)';
    } else if (bmiNum < 30) {
      bmiCategory = 'Overweight';
      bmiColor = '#feca57';
    } else {
      bmiCategory = 'Obese';
      bmiColor = '#ff4757';
    }
  }

  // --- Pace Calc ---
  let paceBadge = null;
  if (entries && entries.length > 1) {
    const sorted = [...entries].sort((a,b) => parseISO(b.date).getTime() - parseISO(a.date).getTime());
    const current = sorted[0];
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() - 7);

    // find first entry ON or BEFORE 7 days ago
    let comparison = sorted.find(e => parseISO(e.date).getTime() <= targetDate.getTime());
    if (!comparison) comparison = sorted[sorted.length - 1]; // fallback to oldest if no 7d
    
    if (comparison && comparison.id !== current.id) {
      const diff = current.weight_kg - comparison.weight_kg;
      const daysDiff = Math.max(1, Math.round((parseISO(current.date).getTime() - parseISO(comparison.date).getTime()) / (1000 * 60 * 60 * 24)));
      let label = daysDiff >= 7 ? 'this wk' : `${daysDiff}d`;

      if (daysDiff < 5) {
        paceBadge = { text: `Need more data`, color: 'var(--text-secondary)', icon: '•' };
      } else if (Math.abs(diff) < 0.1) {
        paceBadge = { text: `Stable`, color: 'var(--warning)', icon: '•' };
      } else if (diff < 0) {
        paceBadge = { text: `${Math.abs(diff).toFixed(1)}kg ${label}`, color: 'var(--success)', icon: '↓' };
      } else {
        paceBadge = { text: `${diff.toFixed(1)}kg ${label}`, color: '#ff4757', icon: '↑' };
      }
    }
  }

  const exportRef = useRef<HTMLDivElement>(null);

  const goalWeight = settings?.goal_weight_kg || 70;

  // --- Forecast Logic ---
  let forecastView = null;
  if (entries && entries.length > 0 && goalWeight && currentWeight) {
    const sorted = [...entries].sort((a,b) => parseISO(b.date).getTime() - parseISO(a.date).getTime());
    const current = sorted[0];
    const oldest = sorted[sorted.length - 1];
    const totalDaysDiff = Math.max(1, Math.round((parseISO(current.date).getTime() - parseISO(oldest.date).getTime()) / (1000 * 60 * 60 * 24)));

    // Guard 1 — Not enough data
    if (sorted.length < 2 || totalDaysDiff < 7) {
      forecastView = { status: 'Need More Data', desc: 'At least 7 days of logs needed.', color: 'var(--text-secondary)', date: '--' };
    } 
    // Guard 2 — Already at goal
    else if (Math.abs(currentWeight - goalWeight) <= 0.2) {
      forecastView = { status: 'Goal Reached!', desc: 'You are maintaining your target.', color: 'var(--success)', date: 'Now' };
    } 
    else {
      // Calculate rate over last ~30 days for more realistic long-term forecast
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      let comparison = sorted.find(e => parseISO(e.date).getTime() <= thirtyDaysAgo.getTime());
      if (!comparison) comparison = oldest; 
      
      if (comparison && comparison.id !== current.id) {
         const weightDiff = current.weight_kg - comparison.weight_kg;
         const daysDiff = Math.max(1, Math.round((parseISO(current.date).getTime() - parseISO(comparison.date).getTime()) / (1000 * 60 * 60 * 24)));
         
         const dailyRate = weightDiff / daysDiff;
         const weeklyRate = dailyRate * 7;
         const distanceToGoal = currentWeight - goalWeight;
         const isLosingWeight = dailyRate < 0;
         const wantsToLoseWeight = distanceToGoal > 0;
         
         // Guard 4 — Plateau
         if (dailyRate > -0.01 && dailyRate < 0.01) {
            forecastView = { status: 'Stagnant', desc: 'Your weight trend has plateaued.', color: 'var(--warning)', date: '--' };
         }
         // Guard 3 — Trending away from goal
         else if ((wantsToLoseWeight && !isLosingWeight) || (!wantsToLoseWeight && isLosingWeight)) {
            forecastView = { status: 'Off Track', desc: 'Your current trend is moving away from the goal.', color: '#ff4757', date: '--' };
         }
         else {
           // Moving in the RIGHT direction
           const daysToGoal = Math.abs(distanceToGoal / dailyRate);
           
           // Guard 5 — Unrealistic forecast
           if (daysToGoal > 730) {
             forecastView = { status: 'Long Term Goal', desc: 'Keep going! A long journey ahead.', color: 'var(--accent-primary)', date: '2+ Years' };
           } else {
             const targetDate = new Date();
             targetDate.setDate(targetDate.getDate() + daysToGoal);
             
             let speedLabel = 'Optimal Pace';
             let speedColor = 'var(--success)';
             if (Math.abs(weeklyRate) > 1.0) {
               speedLabel = 'Very Fast';
               speedColor = 'var(--warning)';
             } else if (Math.abs(weeklyRate) < 0.2) {
               speedLabel = 'Slow & Steady';
               speedColor = '#feca57';
             }
             
             const formattedDate = format(targetDate, 'MMM yyyy');
             forecastView = { 
               status: speedLabel, 
               desc: `Trending perfectly at ${Math.abs(weeklyRate).toFixed(1)}kg/week.`, 
               color: speedColor, 
               date: formattedDate
             };
           }
         }
      }
    }
  }

  // --- Daily Macro Targets Logic ---
  let macroVars = null;
  let macroErrorMessage = null;
  
  if (!currentWeight) {
    macroErrorMessage = "Log your first weight to see targets.";
  } else if (!settings?.age || !settings?.gender || !settings?.activity_level || !settings?.fitness_goal) {
    macroErrorMessage = "Complete your profile in Settings to see targets.";
  } else {
    const { age, gender, activity_level, fitness_goal } = settings;
    const w = currentWeight;
    const h = height_cm;
    
    // BMR (Mifflin-St Jeor)
    let bmr = (10 * w) + (6.25 * h) - (5 * age);
    if (gender === 'Male') bmr += 5; else bmr -= 161;
    
    // TDEE Multiplier
    let mult = 1.2;
    if (activity_level === 'lightly_active') mult = 1.375;
    if (activity_level === 'moderately_active') mult = 1.55;
    if (activity_level === 'very_active') mult = 1.725;
    
    const tdee = bmr * mult;
    
    let targetCals = tdee;
    let targetProtein = w * 1.6;
    
    if (fitness_goal === 'Fat Loss') {
      targetCals = tdee - 400;
      targetProtein = w * 2.2;
    } else if (fitness_goal === 'Muscle Gain') {
      targetCals = tdee + 250;
      targetProtein = w * 1.8;
    }
    
    // Safety Floor
    targetCals = Math.round(Math.max(gender === 'Female' ? 1200 : 1500, targetCals));
    targetProtein = Math.round(targetProtein);
    
    const targetFats = Math.round((targetCals * 0.25) / 9);
    const targetCarbs = Math.round((targetCals - (targetProtein * 4) - (targetFats * 9)) / 4);
    
    const activityLabelMapping = {
      'sedentary': 'Sedentary',
      'lightly_active': 'Lightly active',
      'moderately_active': 'Moderately active',
      'very_active': 'Very active'
    };
  
    macroVars = {
      cals: targetCals,
      protein: targetProtein,
      fats: targetFats,
      carbs: Math.max(0, targetCarbs), // Prevent negatives
      label: `Based on ${fitness_goal.toLowerCase()} goal · ${activityLabelMapping[activity_level]}`
    };
  }

  const handleExport = async () => {
    if (exportRef.current) {
      try {
        const dataUrl = await toPng(exportRef.current, { 
          cacheBust: true, 
          backgroundColor: '#0A0C14', // Match the app's deepest background
          style: { padding: '16px' }
        });
        const link = document.createElement('a');
        link.download = 'fitness-progress.png';
        link.href = dataUrl;
        link.click();
      } catch (err) {
        console.error('Failed to export image', err);
      }
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!weightStr) return;
    
    await activeDb.entries.add({
      id: uuidv4(),
      date,
      weight_kg: parseFloat(weightStr),
      notes,
      created_at: Date.now()
    });
    
    setLogOpen(false);
    setWeightStr('');
    setNotes('');
  };

  const filteredEntries = entries ? entries.filter(e => {
    if (period === 'All') return true;
    const entryDate = parseISO(e.date);
    const now = new Date();
    if (period === '1M') return isAfter(entryDate, subMonths(now, 1));
    if (period === '3M') return isAfter(entryDate, subMonths(now, 3));
    if (period === '6M') return isAfter(entryDate, subMonths(now, 6));
    if (period === '1Y') return isAfter(entryDate, subYears(now, 1));
    return true;
  }) : [];

  const chartData = [...filteredEntries].reverse().map(e => ({
    ...e,
    displayDate: format(parseISO(e.date), period === 'All' || period === '1Y' ? 'MMM yy' : 'MMM dd')
  }));

  const avgWeight = filteredEntries.length > 0 
    ? parseFloat((filteredEntries.reduce((sum, e) => sum + e.weight_kg, 0) / filteredEntries.length).toFixed(1))
    : null;

  const weights = filteredEntries.map(e => e.weight_kg);
  if (goalWeight) weights.push(goalWeight);
  if (avgWeight) weights.push(avgWeight);

  const yDomainMin = weights.length > 0 ? Math.floor(Math.min(...weights)) - 1 : 'dataMin - 1';
  const yDomainMax = weights.length > 0 ? Math.ceil(Math.max(...weights)) + 1 : 'dataMax + 1';

  return (
    <>
      <div className="animate-fade-in flex-col gap-6" style={{ display: 'flex' }}>
        <header className="flex justify-between items-center mt-4">
          <div>
            <h1 style={{ fontSize: '1.75rem' }}>Hello, {isGuest ? 'Guest' : 'Cheppu'}</h1>
            <p style={{ color: 'var(--text-secondary)' }}>{isGuest ? 'Exploring the demo data' : "Let's check your progress."}</p>
          </div>
          <button 
             onClick={handleExport}
             className="btn btn-secondary" 
             style={{ padding: '8px', borderRadius: '12px', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}>
             <Share2 size={20} color="var(--accent-primary)" />
          </button>
        </header>

        <div ref={exportRef} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Grid Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
            <div className="glass-panel text-center" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <Weight size={24} style={{ margin: '0 auto 8px', color: 'var(--accent-primary)' }} />
              <div className="stat-value" style={{ lineHeight: '1.2' }}>{currentWeight ?? '--'}</div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>kg</p>
              {paceBadge && (
                <div style={{ marginTop: '4px', fontSize: '0.75rem', fontWeight: 600, color: paceBadge.color, padding: '2px 8px', borderRadius: '8px', background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)' }}>
                  <span>{paceBadge.icon}</span> {paceBadge.text}
                </div>
              )}
            </div>
            <div className="glass-panel text-center" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <Activity size={24} style={{ margin: '0 auto 8px', color: 'var(--success)' }} />
              <div className="stat-value" style={{ lineHeight: '1.2' }}>{bmi ?? '--'}</div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>BMI</p>
              {bmi && (
                <div style={{ 
                  marginTop: '4px', 
                  fontSize: '0.75rem', 
                  fontWeight: 600, 
                  color: bmiColor, 
                  padding: '2px 8px', 
                  borderRadius: '8px', 
                  background: 'var(--bg-secondary)', 
                  border: '1px solid var(--glass-border)' 
                }}>
                  {bmiCategory}
                </div>
              )}
            </div>
          </div>

        {/* Chart */}
        <div className="glass-panel" style={{ height: '300px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0 }}>Trend</h3>
            <div style={{ display: 'flex', gap: '8px' }}>
              {['1M', '3M', '6M', '1Y', 'All'].map(p => (
                <button 
                  key={p} 
                  onClick={() => setPeriod(p)}
                  style={{ 
                    background: period === p ? 'var(--accent-primary)' : 'transparent',
                    color: period === p ? '#000' : 'var(--text-secondary)',
                    border: '1px solid ' + (period === p ? 'var(--accent-primary)' : 'var(--glass-border)'),
                    borderRadius: '12px',
                    padding: '4px 8px',
                    fontSize: '0.75rem',
                    cursor: 'pointer'
                  }}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                <defs>
                  <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00f2fe" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#4facfe" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="displayDate" stroke="var(--text-secondary)" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--text-secondary)" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} tickLine={false} axisLine={false} domain={[yDomainMin, yDomainMax]} width={30} />
                <Tooltip 
                  contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', borderRadius: '12px', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}
                  itemStyle={{ color: 'var(--accent-primary)', fontWeight: 'bold', fontSize: 14 }}
                  cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 2 }}
                />
                <ReferenceLine y={goalWeight} label={{ position: 'top', value: 'Goal', fill: 'var(--success)', fontSize: 10 }} stroke="var(--success)" strokeDasharray="4 4" opacity={0.8} />
                {avgWeight && <ReferenceLine y={avgWeight} label={{ position: 'bottom', value: 'Avg', fill: 'var(--warning)', fontSize: 10 }} stroke="var(--warning)" strokeDasharray="4 4" opacity={0.4} />}
                <Area 
                  type="monotone" 
                  dataKey="weight_kg" 
                  stroke="var(--accent-primary)" 
                  fillOpacity={1}
                  fill="url(#colorWeight)"
                  strokeWidth={3} 
                  dot={chartData.length > 30 ? false : { r: 3, fill: 'var(--bg-primary)', stroke: 'var(--accent-primary)', strokeWidth: 2 }} 
                  activeDot={{ r: 6, fill: 'var(--accent-primary)', stroke: 'var(--bg-primary)', strokeWidth: 2 }} 
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <p style={{ textAlign: 'center', margin: 'auto', color: 'var(--text-muted)' }}>
              Log a few more entries to see your trend.
            </p>
          )}
        </div>

        {/* Forecast Card */}
        {forecastView && (
          <div className="glass-panel" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
            <div style={{ display: 'flex', gap: '12px', flex: 1 }}>
              <div style={{ background: 'var(--bg-secondary)', padding: '12px', borderRadius: '16px', flexShrink: 0, height: 'max-content' }}>
                <Target size={24} color={forecastView.color} />
              </div>
              <div style={{ flex: 1 }}>
                <h4 style={{ margin: '0 0 4px', fontSize: '1rem', color: forecastView.color }}>{forecastView.status}</h4>
                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: '1.4', paddingRight: '8px' }}>{forecastView.desc}</p>
              </div>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0, minWidth: '80px' }}>
              <p style={{ margin: 0, fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Est. Goal</p>
              <p style={{ margin: '4px 0 0', fontWeight: 'bold', fontSize: '1rem', fontFamily: "'Space Grotesk', sans-serif", whiteSpace: 'nowrap' }}>{forecastView.date}</p>
            </div>
          </div>
        )}

        {/* Daily Macros Card */}
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
             <h3 style={{ margin: 0 }}>Daily Targets</h3>
             <Link to="/settings" style={{ fontSize: '0.75rem', color: 'var(--accent-primary)', textDecoration: 'none' }}>Update &rarr;</Link>
          </div>
          
          {macroErrorMessage ? (
               <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                 {macroErrorMessage}
                 {macroErrorMessage.includes('Complete') && (
                   <span style={{ display: 'block', marginTop: '8px' }}>
                     <Link to="/settings" className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.75rem', display: 'inline-block' }}>Go to Settings</Link>
                   </span>
                 )}
               </p>
          ) : macroVars && (
             <>
               <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', textAlign: 'center' }}>
                 <div>
                   <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Calories</div>
                   <div style={{ fontWeight: 800, fontSize: '1.25rem', fontFamily: "'Space Grotesk', sans-serif" }}>{macroVars.cals}</div>
                   <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>kcal</div>
                 </div>
                 <div>
                   <div style={{ fontSize: '0.75rem', color: 'var(--accent-primary)' }}>Protein</div>
                   <div style={{ fontWeight: 800, fontSize: '1.25rem', fontFamily: "'Space Grotesk', sans-serif" }}>{macroVars.protein}</div>
                   <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>g</div>
                 </div>
                 <div>
                   <div style={{ fontSize: '0.75rem', color: 'var(--warning)' }}>Carbs</div>
                   <div style={{ fontWeight: 800, fontSize: '1.25rem', fontFamily: "'Space Grotesk', sans-serif" }}>{macroVars.carbs}</div>
                   <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>g</div>
                 </div>
                 <div>
                   <div style={{ fontSize: '0.75rem', color: 'var(--success)' }}>Fats</div>
                   <div style={{ fontWeight: 800, fontSize: '1.25rem', fontFamily: "'Space Grotesk', sans-serif" }}>{macroVars.fats}</div>
                   <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>g</div>
                 </div>
               </div>
               <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', borderTop: '1px solid var(--glass-border)', paddingTop: '12px', marginTop: '4px' }}>
                 {macroVars.label}
                 <p style={{ margin: '4px 0 0', fontStyle: 'italic', opacity: 0.7 }}>These are estimates based on your stats. Adjust based on how you feel.</p>
               </div>
             </>
          )}
        </div>

      </div>
      </div>
      <div 
        onClick={() => setLogOpen(true)}
        style={{
          position: 'fixed',
          bottom: 'calc(105px + env(safe-area-inset-bottom))',
          right: '24px',
          background: 'var(--accent-gradient)',
          borderRadius: 'var(--radius-full)',
          width: '56px', height: '56px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: '0 6px 20px var(--accent-glow)',
          zIndex: 40
        }}
      >
        <Plus color="#000" size={32} />
      </div>

      {/* Quick Log Modal */}
      <BottomSheet isOpen={isLogOpen} onClose={() => setLogOpen(false)} title="Quick Log">
        <form onSubmit={handleSave} className="flex-col gap-4 mt-4" style={{ display: 'flex' }}>
          <div className="input-group" style={{ marginBottom: 0 }}>
            <label className="input-label">Date</label>
            <input type="date" className="input-field" value={date} onChange={e => setDate(e.target.value)} required />
          </div>
          <div className="input-group" style={{ marginBottom: 0 }}>
            <label className="input-label">Weight (kg)</label>
            <input type="number" step="0.1" className="input-field" placeholder="0.0" value={weightStr} onChange={e => setWeightStr(e.target.value)} required />
          </div>
          <div className="input-group">
            <label className="input-label">Notes</label>
            <input type="text" className="input-field" placeholder="How do you feel?" value={notes} onChange={e => setNotes(e.target.value)} />
          </div>
          <button type="submit" className="btn btn-primary" style={{ marginTop: '8px' }}>Save Log</button>
        </form>
      </BottomSheet>
    </>
  );
};
