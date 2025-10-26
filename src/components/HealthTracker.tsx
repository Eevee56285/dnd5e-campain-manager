import { useState, useEffect } from 'react';
import { storage, type Character, type ActiveCombatant } from '../lib/storage';
import { Heart, Minus, Plus, User, Users, Skull } from 'lucide-react';

type HealthTrackerProps = {
  campaignId: string;
};

type CombatantDisplay = ActiveCombatant & {
  character: Character;
};

export function HealthTracker({ campaignId }: HealthTrackerProps) {
  const [combatants, setCombatants] = useState<CombatantDisplay[]>([]);
  const [hpChanges, setHpChanges] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    loadCombatants();
  }, [campaignId]);

  const loadCombatants = () => {
    const session = storage.getBattleSession();
    if (!session || session.campaignId !== campaignId) {
      setCombatants([]);
      return;
    }

    const characters = storage.getCharacters();
    const combatantsList: CombatantDisplay[] = session.combatants
      .map((c) => {
        const character = characters.find((ch) => ch.id === c.characterId);
        if (!character) return null;
        return { ...c, character };
      })
      .filter((c): c is CombatantDisplay => c !== null)
      .sort((a, b) => a.character.name.localeCompare(b.character.name));

    setCombatants(combatantsList);
  };

  const updateHP = (id: string, change: number) => {
    const session = storage.getBattleSession();
    if (!session) return;

    const combatant = session.combatants.find((c) => c.id === id);
    const character = combatants.find((c) => c.id === id)?.character;
    if (!combatant || !character) return;

    const newHP = Math.max(0, Math.min(character.maxHp, combatant.currentHp + change));
    combatant.currentHp = newHP;

    storage.saveBattleSession(session);
    setHpChanges({ ...hpChanges, [id]: '' });
    loadCombatants();
  };

  const setHP = (id: string, value: number) => {
    const session = storage.getBattleSession();
    if (!session) return;

    const combatant = session.combatants.find((c) => c.id === id);
    const character = combatants.find((c) => c.id === id)?.character;
    if (!combatant || !character) return;

    const newHP = Math.max(0, Math.min(character.maxHp, value));
    combatant.currentHp = newHP;

    storage.saveBattleSession(session);
    loadCombatants();
  };

  const getHealthPercentage = (current: number, max: number) => {
    return (current / max) * 100;
  };

  const getHealthColor = (percentage: number) => {
    if (percentage > 66) return 'bg-green-600';
    if (percentage > 33) return 'bg-yellow-600';
    if (percentage > 0) return 'bg-red-600';
    return 'bg-gray-600';
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'player':
        return <User size={24} className="text-blue-400" />;
      case 'npc':
        return <Users size={24} className="text-green-400" />;
      case 'monster':
        return <Skull size={24} className="text-red-400" />;
    }
  };

  return (
    <div className="space-y-4">
      {combatants.length === 0 ? (
        <div className="bg-slate-800 border-2 border-dashed border-slate-700 rounded-lg p-8 text-center">
          <p className="text-gray-400">No combatants yet. Add some from the Initiative Tracker tab!</p>
        </div>
      ) : (
        combatants.map((combatant) => {
          const healthPercentage = getHealthPercentage(combatant.currentHp, combatant.character.maxHp);
          const isUnconscious = combatant.currentHp === 0;

          return (
            <div
              key={combatant.id}
              className={`bg-slate-800 border rounded-lg p-6 transition-all ${
                isUnconscious ? 'border-red-600 opacity-60' : 'border-slate-700 hover:border-red-600'
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  {getTypeIcon(combatant.character.type)}
                  <div>
                    <h4 className="text-xl font-bold text-white flex items-center gap-2">
                      {combatant.character.name}
                      {combatant.character.level && (
                        <span className="text-sm text-gray-400">Lvl {combatant.character.level}</span>
                      )}
                      {isUnconscious && <span className="text-red-500 text-sm">(Unconscious)</span>}
                    </h4>
                    <p className="text-sm text-gray-400">
                      AC: {combatant.character.armorClass} | Initiative: {combatant.initiative}
                      {combatant.character.notes && ` | ${combatant.character.notes}`}
                    </p>
                  </div>
                </div>
                <Heart size={24} className="text-red-600" />
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-300 font-medium">Health</span>
                    <span className="text-white font-bold text-lg">
                      {combatant.currentHp} / {combatant.character.maxHp}
                    </span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-6 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${getHealthColor(healthPercentage)}`}
                      style={{ width: `${healthPercentage}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const change = parseInt(hpChanges[combatant.id] || '1');
                      updateHP(combatant.id, -change);
                    }}
                    className="bg-red-600 hover:bg-red-700 text-white p-2 rounded transition-colors"
                    aria-label="Decrease HP"
                  >
                    <Minus size={20} />
                  </button>

                  <input
                    type="number"
                    value={hpChanges[combatant.id] || ''}
                    onChange={(e) => setHpChanges({ ...hpChanges, [combatant.id]: e.target.value })}
                    placeholder="Amount"
                    className="flex-1 bg-slate-700 border border-slate-600 text-white rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-600 text-center"
                  />

                  <button
                    onClick={() => {
                      const change = parseInt(hpChanges[combatant.id] || '1');
                      updateHP(combatant.id, change);
                    }}
                    className="bg-green-600 hover:bg-green-700 text-white p-2 rounded transition-colors"
                    aria-label="Increase HP"
                  >
                    <Plus size={20} />
                  </button>

                  <button
                    onClick={() => setHP(combatant.id, combatant.character.maxHp)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition-colors font-medium"
                  >
                    Full Heal
                  </button>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setHP(combatant.id, Math.floor(combatant.character.maxHp / 2))}
                    className="flex-1 bg-slate-700 hover:bg-slate-600 text-white px-3 py-2 rounded transition-colors text-sm"
                  >
                    50% HP
                  </button>
                  <button
                    onClick={() => setHP(combatant.id, 0)}
                    className="flex-1 bg-slate-700 hover:bg-slate-600 text-white px-3 py-2 rounded transition-colors text-sm"
                  >
                    Down (0 HP)
                  </button>
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
