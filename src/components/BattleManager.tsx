import { useState, useEffect } from 'react';
import { ArrowLeft, Swords, BookOpen } from 'lucide-react';
import { InitiativeTracker } from './InitiativeTracker';
import { HealthTracker } from './HealthTracker';
import { CharacterLibrary } from './CharacterLibrary';

type BattleManagerProps = {
  campaignId: string;
  campaignName: string;
  onBack: () => void;
};

type BattleSession = {
  campaignId: string;
  isActive: boolean;
  combatants: any[];
  round: number;
  currentTurn: number;
};

export function BattleManager({ campaignId, campaignName, onBack }: BattleManagerProps) {
  const [battleActive, setBattleActive] = useState(false);
  const [activeTab, setActiveTab] = useState<'characters' | 'initiative' | 'health'>('characters');

  useEffect(() => {
    const session = storage.getBattleSession();
    if (session && session.campaignId === campaignId && session.isActive) {
      setBattleActive(true);
      setActiveTab('initiative');
    }
  }, [campaignId]);

  const startInitiative = () => {
    const session: BattleSession = {
      campaignId,
      isActive: true,
      combatants: [],
      round: 1,
      currentTurn: 0,
    };
    storage.saveBattleSession(session);
    setBattleActive(true);
    setActiveTab('initiative');
  };

  const endBattle = () => {
    if (!confirm('End this battle? All initiative and combat data will be cleared.')) return;
    storage.clearBattleSession();
    setBattleActive(false);
    setActiveTab('characters');
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={20} />
          Back to Campaigns
        </button>
        <h2 className="text-2xl font-bold text-white">{campaignName}</h2>
        {!battleActive ? (
          <button
            onClick={startInitiative}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded flex items-center gap-2 transition-colors"
          >
            <Swords size={20} />
            Start Initiative
          </button>
        ) : (
          <button
            onClick={endBattle}
            className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded transition-colors"
          >
            End Battle
          </button>
        )}
      </div>

      <div className="mb-6 flex gap-2 border-b border-slate-700">
        <button
          onClick={() => setActiveTab('characters')}
          className={`px-4 py-2 font-medium transition-colors flex items-center gap-2 ${
            activeTab === 'characters'
              ? 'text-red-600 border-b-2 border-red-600'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <BookOpen size={18} />
          Character Library
        </button>
        <button
          onClick={() => setActiveTab('initiative')}
          disabled={!battleActive}
          className={`px-4 py-2 font-medium transition-colors flex items-center gap-2 ${
            activeTab === 'initiative'
              ? 'text-red-600 border-b-2 border-red-600'
              : battleActive
              ? 'text-gray-400 hover:text-white'
              : 'text-gray-600 cursor-not-allowed'
          }`}
        >
          <Swords size={18} />
          Initiative Tracker
        </button>
        <button
          onClick={() => setActiveTab('health')}
          disabled={!battleActive}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'health'
              ? 'text-red-600 border-b-2 border-red-600'
              : battleActive
              ? 'text-gray-400 hover:text-white'
              : 'text-gray-600 cursor-not-allowed'
          }`}
        >
          Health Tracker
        </button>
      </div>

      {activeTab === 'characters' && <CharacterLibrary />}
      {activeTab === 'initiative' && battleActive && <InitiativeTracker campaignId={campaignId} />}
      {activeTab === 'health' && battleActive && <HealthTracker campaignId={campaignId} />}

      {!battleActive && activeTab !== 'characters' && (
        <div className="bg-slate-800 border-2 border-dashed border-slate-700 rounded-lg p-12 text-center">
          <Swords size={48} className="mx-auto mb-4 text-slate-600" />
          <p className="text-gray-400 text-lg">Start Initiative to begin tracking combat!</p>
        </div>
      )}
    </div>
  );
}
