import { Trash2 } from 'lucide-react';
import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useDatabase } from '../context/DatabaseContext';
import { useNavigate } from 'react-router-dom';

export const History: React.FC = () => {
  const { activeDb } = useDatabase();
  const entries = useLiveQuery(() => activeDb.entries.orderBy('date').reverse().toArray(), [activeDb]);
  const navigate = useNavigate();

  const handleDelete = async (id: string) => {
    if (confirm('Delete this entry?')) {
      await activeDb.entries.delete(id);
    }
  };

  return (
    <div className="animate-slide-right flex-col gap-6" style={{ display: 'flex' }}>
      <header className="flex justify-between items-center mt-4 mb-4">
        <div>
          <button onClick={() => navigate(-1)} className="btn-ghost" style={{ padding: '0 0 8px 0', border: 'none', textAlign: 'left' }}>
            &larr; Back
          </button>
          <h1 style={{ fontSize: '2rem' }}>History</h1>
          <p style={{ color: 'var(--text-secondary)' }}>All logs across time.</p>
        </div>
      </header>

      <div className="flex-col gap-4" style={{ display: 'flex' }}>
        {entries?.map(e => (
          <div key={e.id} className="glass-panel items-center justify-between flex" style={{ padding: '16px' }}>
            <div>
              <p style={{ fontWeight: 600 }}>{e.date}</p>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                {e.weight_kg}kg
                {e.notes && <p style={{ fontStyle: 'italic', marginTop: '4px' }}>"{e.notes}"</p>}
              </div>
            </div>
            <button className="btn-ghost" onClick={() => handleDelete(e.id)} style={{ border: 'none', color: 'var(--danger)' }}>
              <Trash2 size={20} />
            </button>
          </div>
        ))}
        {!entries?.length && (
          <div className="text-center" style={{ color: 'var(--text-muted)', padding: '32px' }}>
            <p>Your history is empty. Start logging!</p>
          </div>
        )}
      </div>
    </div>
  );
};
