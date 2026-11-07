// src/modules/GatewayManagement/Components/GatewayRegistry/GatewayList.tsx

import React, { useMemo, useState } from 'react';
import type { Gateway } from '@/modules/GatewayManagement/Models/Gateway';
import { GatewayCard } from '@/modules/GatewayManagement/Components/GatewayRegistry/GatewayCard';

interface Props {
  gateways: Gateway[];
  selectedGatewayId: string | null;
  onSelect: (gatewayId: string) => void;
}

type SortKey = 'name' | 'status' | 'lastSeen';
type SortDir = 'asc' | 'desc';
type StatusFilter = Gateway['connectionStatus'] | 'ALL';

const STATUS_OPTIONS: StatusFilter[] = [
  'ALL', 'Connected', 'Connecting', 'Reconnecting', 'Disconnected', 'Error',
];

export const GatewayList: React.FC<Props> = ({ gateways, selectedGatewayId, onSelect }) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    const filtered = gateways.filter(g => {
      if (statusFilter !== 'ALL' && g.connectionStatus !== statusFilter) return false;
      if (!term) return true;
      return (
        g.name.toLowerCase().includes(term) ||
        g.identifier.toLowerCase().includes(term) ||
        g.id.toLowerCase().includes(term) ||
        g.endpointHost.toLowerCase().includes(term)
      );
    });

    const sorted = [...filtered].sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case 'name':
          cmp = a.name.localeCompare(b.name);
          break;
        case 'status':
          cmp = a.connectionStatus.localeCompare(b.connectionStatus);
          break;
        case 'lastSeen':
          cmp = (a.lastSeenAt ?? '').localeCompare(b.lastSeenAt ?? '');
          break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return sorted;
  }, [gateways, search, statusFilter, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, height: '100%' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search name, identifier, endpoint…"
          style={{
            padding: '5px 8px',
            background: '#1E293B',
            color: '#E5E7EB',
            border: '1px solid #1F2937',
            borderRadius: 4,
            fontSize: 11,
            outline: 'none',
          }}
        />
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {STATUS_OPTIONS.map(opt => (
            <button
              key={opt}
              onClick={() => setStatusFilter(opt)}
              style={{
                padding: '2px 8px',
                borderRadius: 10,
                border: '1px solid',
                borderColor: statusFilter === opt ? '#38BDF8' : '#1F2937',
                background: statusFilter === opt ? '#0EA5E922' : 'transparent',
                color: statusFilter === opt ? '#38BDF8' : '#94A3B8',
                fontSize: 10,
                cursor: 'pointer',
              }}
            >
              {opt}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 6, fontSize: 10, color: '#64748B' }}>
          <span>Sort:</span>
          {(['name', 'status', 'lastSeen'] as SortKey[]).map(key => (
            <button
              key={key}
              onClick={() => toggleSort(key)}
              style={{
                background: 'transparent',
                border: 'none',
                padding: 0,
                color: sortKey === key ? '#38BDF8' : '#94A3B8',
                cursor: 'pointer',
                fontSize: 10,
                textDecoration: sortKey === key ? 'underline' : 'none',
              }}
            >
              {key} {sortKey === key ? (sortDir === 'asc' ? '↑' : '↓') : ''}
            </button>
          ))}
        </div>
        <div style={{ fontSize: 10, color: '#64748B' }}>
          {visible.length} of {gateways.length} gateway{gateways.length === 1 ? '' : 's'}
        </div>
      </div>

      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
        {visible.length === 0 ? (
          <div style={{ padding: 16, fontSize: 11, color: '#64748B', textAlign: 'center' }}>
            {gateways.length === 0
              ? 'No gateways registered yet.'
              : 'No gateways match the current filter.'}
          </div>
        ) : (
          visible.map(g => (
            <GatewayCard
              key={g.id}
              gateway={g}
              selected={g.id === selectedGatewayId}
              onSelect={onSelect}
            />
          ))
        )}
      </div>
    </div>
  );
};