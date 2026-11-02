// src/modules/DaliProgrammingStudio/Sidebar/DesignExplorer/DesignExplorer.tsx

import React, { useState } from 'react';
import { DaliLineExplorer } from '@/modules/DaliProgrammingStudio/Sidebar/DesignExplorer/DaliLineExplorer';
import { DeviceExplorer } from '@/modules/DaliProgrammingStudio/Sidebar/DesignExplorer/DeviceExplorer';
import { GroupExplorer } from '@/modules/DaliProgrammingStudio/Sidebar/DesignExplorer/GroupExplorer';
import { SceneExplorer } from '@/modules/DaliProgrammingStudio/Sidebar/DesignExplorer/SceneExplorer';
import { GatewayExplorer } from '@/modules/DaliProgrammingStudio/Sidebar/DesignExplorer/GatewayExplorer';

type DesignSection = 'lines' | 'devices' | 'groups' | 'scenes' | 'gateways';

export const DesignExplorer: React.FC = () => {
  const [section, setSection] = useState<DesignSection>('lines');

  return (
    <div>
      <div style={{ marginBottom: 8 }}>
        <select
          value={section}
          onChange={e => setSection(e.target.value as DesignSection)}
          style={{
            width: '100%',
            padding: '4px 8px',
            background: '#0F1424',
            color: '#E5E7EB',
            border: '1px solid #1F2937',
            borderRadius: 4,
            fontSize: 11,
          }}
        >
          <option value="lines">DALI Lines</option>
          <option value="devices">Devices</option>
          <option value="groups">Groups</option>
          <option value="scenes">Scenes</option>
          <option value="gateways">Gateways</option>
        </select>
      </div>
      {section === 'lines' && <DaliLineExplorer />}
      {section === 'devices' && <DeviceExplorer />}
      {section === 'groups' && <GroupExplorer />}
      {section === 'scenes' && <SceneExplorer />}
      {section === 'gateways' && <GatewayExplorer />}
    </div>
  );
};