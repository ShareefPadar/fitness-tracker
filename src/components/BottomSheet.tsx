import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { createPortal } from 'react-dom';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({ isOpen, onClose, title, children }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Don't render until client side is active (to ensure document.body exists)
  if (typeof document === 'undefined') return null;

  return createPortal(
    <div 
      className={`bottom-sheet-overlay ${isOpen ? 'open' : ''}`}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bottom-sheet-content animate-fade-in" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h3 style={{ fontSize: '1.25rem', color: 'var(--text-primary)' }}>{title}</h3>
          <button className="btn-ghost" onClick={onClose} style={{ padding: '8px', border: 'none' }}>
            <X size={24} />
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body
  );
};
