import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useDatabase } from '../context/DatabaseContext';
import { BottomSheet } from '../components/BottomSheet';
import { Plus, Weight, Activity, Flame } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { format, parseISO, subMonths, subYears, isAfter } from 'date-fns';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

export const Home: React.FC = () => {
  const { activeDb, isGuest } = useDatabase();
  const entries = useLiveQuery(() => activeDb.entries.orderBy('date').reverse().toArray());
  const settings = useLiveQuery(() => activeDb.settings.get(1));
  const [isLogOpen, setLogOpen] = useState(false);
  const [period, setPeriod] = useState('All');

  // Form State
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [weightStr, setWeightStr] = useState('');
  const [bfStr, setBfStr] = useState('');
  const [notes, setNotes] = useState('');

  const currentWeight = entries?.length ? entries[0].weight_kg : null;
  const currentBF = entries?.length ? entries[0].body_fat_pct : null;
  const height_cm = settings?.height_cm || 175; 
  const bmi = currentWeight ? (currentWeight / Math.pow(height_cm / 100, 2)).toFixed(1) : null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!weightStr) return;
    
    await activeDb.entries.add({
      id: uuidv4(),
      date,
      weight_kg: parseFloat(weightStr),
      body_fat_pct: bfStr ? parseFloat(bfStr) : undefined,
      notes,
      created_at: Date.now()
    });
    
    setLogOpen(false);
    setWeightStr('');
    setBfStr('');
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

  const goalWeight = settings?.goal_weight_kg || 70;
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
        </header>

        {/* Grid Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
          <div className="glass-panel text-center">
            <Weight size={24} style={{ margin: '0 auto 8px', color: 'var(--accent-primary)' }} />
            <div className="stat-value">{currentWeight ?? '--'}</div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>kg</p>
          </div>
          <div className="glass-panel text-center">
            <Flame size={24} style={{ margin: '0 auto 8px', color: 'var(--warning)' }} />
            <div className="stat-value">{currentBF ?? '--'}</div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>% Body Fat</p>
          </div>
          <div className="glass-panel text-center" style={{ gridColumn: 'span 2' }}>
            <Activity size={24} style={{ margin: '0 auto 8px', color: 'var(--success)' }} />
            <div style={{ display: 'flex', justifyContent: 'space-around' }}>
              <div>
                <div className="stat-value" style={{ fontSize: '1.5rem' }}>{bmi ?? '--'}</div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>BMI</p>
              </div>
              <div>
                <div className="stat-value" style={{ fontSize: '1.5rem' }}>{entries?.length || 0}</div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Logs</p>
              </div>
            </div>
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
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="input-label">Weight (kg)</label>
              <input type="number" step="0.1" className="input-field" placeholder="0.0" value={weightStr} onChange={e => setWeightStr(e.target.value)} required />
            </div>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="input-label">Body Fat (%)</label>
              <input type="number" step="0.1" className="input-field" placeholder="Optional" value={bfStr} onChange={e => setBfStr(e.target.value)} />
            </div>
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
