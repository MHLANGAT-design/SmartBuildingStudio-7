// src/modules/DeviceDiscovery/Components/DiscoveryToolbar/DiscoveryToolbar.tsx

import React, { useState, useEffect, useRef } from 'react';

interface Props {
  onStart: () => void;
  onStop: () => void;
  isDiscovering: boolean;
  isLoading: boolean;
}

export const DiscoveryToolbar: React.FC<Props> = ({ 
  onStart, 
  onStop, 
  isDiscovering, 
  isLoading 
}) => {
  const [showActiveStop, setShowActiveStop] = useState(false);
  const lastActiveRef = useRef<number>(0);

  useEffect(() => {
    if (!isDiscovering || isLoading) {
      setShowActiveStop(false);
      return;
    }

    const now = Date.now();
    if (lastActiveRef.current === 0) {
      lastActiveRef.current = now;
    }

    // Only show active stop if we've been discovering for >500ms without interruption
    const timer = setTimeout(() => {
      setShowActiveStop(true);
    }, 500);

    return () => clearTimeout(timer);
  }, [isDiscovering, isLoading]);

  // Reset the "when did we start" marker when discovery ends
  useEffect(() => {
    if (!isDiscovering) lastActiveRef.current = 0;
  }, [isDiscovering]);

  return (
    <div style={{
      height: 48,
      padding: '0 16px',
      background: '#0F1424',
      borderBottom: '1px solid #1F2937',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexShrink: 0,
    }}>
      <div style={{ fontSize: 14, fontWeight: 'bold', color: '#38BDF8' }}>
        Device Discovery
      </div>
      
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={onStart}
          disabled={isDiscovering || isLoading}
          style={{
            padding: '6px 12px',
            background: (isDiscovering || isLoading) ? '#1F2937' : '#1D4ED8',
            color: (isDiscovering || isLoading) ? '#64748B' : '#FFF',
            border: 'none',
            borderRadius: 4,
            fontSize: 12,
            cursor: (isDiscovering || isLoading) ? 'not-allowed' : 'pointer',
            fontWeight: 'bold',
          }}
        >
          {isLoading && !isDiscovering ? 'Starting...' : 'Start Discovery'}
        </button>
        
        <button
          onClick={onStop}
          disabled={!showActiveStop}
          style={{
            padding: '6px 12px',
            background: !showActiveStop ? '#1F2937' : '#991B1B',
            color: !showActiveStop ? '#64748B' : '#FFF',
            border: 'none',
            borderRadius: 4,
            fontSize: 12,
            cursor: !showActiveStop ? 'not-allowed' : 'pointer',
            fontWeight: 'bold',
            transition: 'background 0.2s ease',
          }}
        >
          Stop Discovery
        </button>
      </div>
    </div>
  );
};

export default DiscoveryToolbar;