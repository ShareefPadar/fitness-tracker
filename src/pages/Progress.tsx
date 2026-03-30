import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useDatabase } from '../context/DatabaseContext';
import { History, Trophy } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Progress: React.FC = () => {
  const { activeDb } = useDatabase();
  const entries = useLiveQuery(() => activeDb.entries.toArray(), [activeDb]);
  const entryCount = entries?.length || 0;

  return (
    <div className="animate-slide-right flex-col gap-6" style={{ display: 'flex' }}>
      <header className="flex justify-between items-center mt-4 mb-4">
        <div>
          <h1 style={{ fontSize: '2rem' }}>Progress</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Celebrate your journey.</p>
        </div>
      </header>

      <div className="glass-panel" style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Total Logs</p>
          <div className="stat-value">{entryCount}</div>
        </div>
        <Link to="/history" className="btn btn-secondary">
          <History size={20} />
          View History
        </Link>
      </div>

      <h3 className="mb-4">Milestones</h3>
      <div className="flex-col gap-4" style={{ display: 'flex' }}>
        {entryCount > 0 ? (
          <div className="glass-panel animate-fade-in" style={{ display: 'flex', alignItems: 'center', gap: '16px', opacity: 0, animationDelay: '0.1s' }}>
            <div style={{ background: 'var(--accent-glow)', padding: '12px', borderRadius: '50%' }}>
              <Trophy size={24} color="var(--accent-primary)" />
            </div>
            <div>
              <strong style={{ fontSize: '1.125rem' }}>First Step</strong>
              <p style={{ color: 'var(--text-secondary)' }}>You logged your baseline. Amazing start.</p>
            </div>
          </div>
        ) : (
          <div className="glass-panel text-center">
            <Trophy size={32} color="var(--text-muted)" style={{ margin: '0 auto 8px' }} />
            <p style={{ color: 'var(--text-muted)' }}>First milestone drops after log one.</p>
          </div>
        )}

        {entryCount >= 5 && (
          <div className="glass-panel animate-fade-in" style={{ display: 'flex', alignItems: 'center', gap: '16px', opacity: 0, animationDelay: '0.2s' }}>
            <div style={{ background: 'rgba(16, 185, 129, 0.2)', padding: '12px', borderRadius: '50%' }}>
              <Trophy size={24} color="var(--success)" />
            </div>
            <div>
              <strong style={{ fontSize: '1.125rem' }}>Consistency Key</strong>
              <p style={{ color: 'var(--text-secondary)' }}>5 logs completed. You're building habits.</p>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};
