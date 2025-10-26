import { useState } from 'react';
import { CampaignList } from './components/CampaignList';
import { BattleManager } from './components/BattleManager';
import { DiceRoller } from './components/DiceRoller';

function App() {
  const [selectedCampaign, setSelectedCampaign] = useState<{ id: string; name: string } | null>(null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-3 sm:p-6 pb-20">
      <div className="max-w-6xl mx-auto">
        {selectedCampaign ? (
          <BattleManager
            campaignId={selectedCampaign.id}
            campaignName={selectedCampaign.name}
            onBack={() => setSelectedCampaign(null)}
          />
        ) : (
          <CampaignList
            onSelectCampaign={(id, name) => setSelectedCampaign({ id, name })}
          />
        )}
      </div>
      <DiceRoller />
    </div>
  );
}

export default App;
