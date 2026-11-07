// src/modules/GatewayManagement/Components/GatewayEvents/EventDetails.tsx

import React from 'react';

interface Props {
  eventId: string | null;
}

export const EventDetails: React.FC<Props> = ({ eventId }) => {
  if (!eventId) {
    return (
      <div style={{ padding: 16, fontSize: 11, color: '#64748B', textAlign: 'center' }}>
        Select an event to see its details.
      </div>
    );
  }

  return (
    <div style={{ padding: 16, fontSize: 11, color: '#64748B' }}>
      Event details are displayed inline in the log. Full details will be
      available when the backend exposes a dedicated events endpoint.
    </div>
  );
};