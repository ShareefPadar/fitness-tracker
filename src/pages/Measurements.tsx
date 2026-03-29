import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useDatabase } from '../context/DatabaseContext';
import { v4 as uuidv4 } from 'uuid';
import { format } from 'date-fns';
import { Ruler } from 'lucide-react';

export const Measurements: React.FC = () => {
  const { activeDb } = useDatabase();
  const measurements = useLiveQuery(() => activeDb.measurements.orderBy('date').reverse().toArray());
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [waist, setWaist] = useState('');
  const [chest, setChest] = useState('');
  const [hips, setHips] = useState('');
  const [arms, setArms] = useState('');

  const current = measurements?.[0];

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!waist && !chest && !hips && !arms) return;
    
    await activeDb.measurements.add({
      id: uuidv4(),
      date,
      waist_cm: waist ? parseFloat(waist) : undefined,
      chest_cm: chest ? parseFloat(chest) : undefined,
      hips_cm: hips ? parseFloat(hips) : undefined,
      arms_cm: arms ? parseFloat(arms) : undefined,
    });
    
    setWaist(''); setChest(''); setHips(''); setArms('');
  };

  return (
    <div className="animate-slide-right flex-col gap-6" style={{ display: 'flex' }}>
      <header className="flex justify-between items-center mt-4 mb-4">
        <div>
          <h1 style={{ fontSize: '2rem' }}>Stats</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Log optional body measurements.</p>
        </div>
      </header>

      <div className="glass-panel text-center mb-6">
        <Ruler size={32} style={{ margin: '0 auto 16px', color: 'var(--accent-primary)' }} />
        <h2 className="stat-value" style={{ fontSize: '1.5rem', marginBottom: '8px' }}>Log New Sizes</h2>
        <form onSubmit={handleSave} className="flex-col gap-4 mt-6 text-left" style={{ display: 'flex' }}>
          <div className="input-group">
            <label className="input-label">Date</label>
            <input type="date" className="input-field" value={date} onChange={e => setDate(e.target.value)} required />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="input-group">
              <label className="input-label">Waist (cm)</label>
              <input type="number" step="0.1" className="input-field" placeholder={current?.waist_cm ? String(current.waist_cm) : '0.0'} value={waist} onChange={e => setWaist(e.target.value)} />
            </div>
            <div className="input-group">
              <label className="input-label">Chest (cm)</label>
              <input type="number" step="0.1" className="input-field" placeholder={current?.chest_cm ? String(current.chest_cm) : '0.0'} value={chest} onChange={e => setChest(e.target.value)} />
            </div>
            <div className="input-group">
              <label className="input-label">Hips (cm)</label>
              <input type="number" step="0.1" className="input-field" placeholder={current?.hips_cm ? String(current.hips_cm) : '0.0'} value={hips} onChange={e => setHips(e.target.value)} />
            </div>
            <div className="input-group">
              <label className="input-label">Arms (cm)</label>
              <input type="number" step="0.1" className="input-field" placeholder={current?.arms_cm ? String(current.arms_cm) : '0.0'} value={arms} onChange={e => setArms(e.target.value)} />
            </div>
          </div>
          <button type="submit" className="btn btn-primary" style={{ marginTop: '16px' }}>Save Sizes</button>
        </form>
      </div>

      <h3 className="mb-4">Recent History</h3>
      <div className="flex-col gap-4" style={{ display: 'flex' }}>
        {measurements?.slice(0, 3).map((m) => (
          <div key={m.id} className="glass-panel" style={{ padding: '16px', display: 'flex', justifyContent: 'space-between' }}>
            <div>
              <strong>{m.date}</strong>
             <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '4px' }}>
                {m.waist_cm && `W: ${m.waist_cm} `}
                {m.chest_cm && `C: ${m.chest_cm} `}
                {m.hips_cm && `H: ${m.hips_cm} `}
                {m.arms_cm && `A: ${m.arms_cm} `}
              </div>
            </div>
          </div>
        ))}
        {!measurements?.length && (
          <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Optional — add whenever you feel like it.</p>
        )}
      </div>
    </div>
  );
};
