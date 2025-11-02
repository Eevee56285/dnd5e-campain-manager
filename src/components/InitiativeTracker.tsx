import { useState, useEffect } from 'react';
import { storage, type Character, type ActiveCombatant } from '../lib/storage';
import { Plus, Trash2, User, Users, Skull, Dices } from 'lucide-react';

type InitiativeTrackerProps = {
  campaignId: string;
};

type CombatantDisplay = ActiveCombatant & {
  character: Character;
};

export function InitiativeTracker({ campaignId }: InitiativeTrackerProps) {
  const [combatants, setCombatants] = useState<CombatantDisplay[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedCharacterId, setSelectedCharacterId] = useState('');
  const [initiativeRoll, setInitiativeRoll] = useState('');
  const [useAutoRoll, setUseAutoRoll] = useState(false);
  const [availableCharacters, setAvailableCharacters] = useState<Character[]>([]);

  useEffect(() => {
    loadCombatants();
    setAvailableCharacters(storage.getCharacters());
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
      .sort((a, b) => b.initiative - a.initiative);

    setCombatants(combatantsList);
  };

  const addCombatant = () => {
    if (!selectedCharacterId) return;

    const character = availableCharacters.find((c) => c.id === selectedCharacterId);
    if (!character) return;

    let initiative: number;
    if (useAutoRoll) {
      const roll = Math.floor(Math.random() * 20) + 1;
      initiative = roll + character.dexModifier;
    } else {
      initiative = parseInt(initiativeRoll) || 0;
    }

    const session = storage.getBattleSession();
    if (!session) return;

    const newCombatant: ActiveCombatant = {
      id: crypto.randomUUID(),
      characterId: character.id,
      initiative,
      currentHp: character.maxHp,
      tempHp: 0,
      conditions: [],
    };

    session.combatants.push(newCombatant);
    storage.saveBattleSession(session);

    setSelectedCharacterId('');
    setInitiativeRoll('');
    setUseAutoRoll(false);
    setShowForm(false);
    loadCombatants();
  };

  const removeCombatant = (id: string) => {
    const session = storage.getBattleSession();
    if (!session) return;

    session.combatants = session.combatants.filter((c) => c.id !== id);
    storage.saveBattleSession(session);
    loadCombatants();
  };

  const rollInitiativeForCharacter = (characterId: string) => {
    const character = availableCharacters.find((c) => c.id === characterId);
    if (!character) return;

    const roll = Math.floor(Math.random() * 20) + 1;
    const dexMod = character.dexModifier || 0;
    const total = roll + dexMod;
    setInitiativeRoll(total.toString());
    
    // Show the roll breakdown
    alert(`🎲 Initiative Roll!\n\nDie: ${roll}\nDEX Modifier: ${dexMod >= 0 ? '+' : ''}${dexMod}\nTotal: ${total}`);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'player':
        return <User size={18} className="sm:w-5 sm:h-5 text-blue-400" />;
      case 'npc':
        return <Users size={18} className="sm:w-5 sm:h-5 text-green-400" />;
      case 'monster':
        return <Skull size={18} className="sm:w-5 sm:h-5 text-red-400" />;
    }
  };

  const selectedCharacter = availableCharacters.find((c) => c.id === selectedCharacterId);

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-red-600 hover:bg-red-700 active:scale-95 text-white px-3 sm:px-4 py-2 rounded flex items-center gap-2 transition-all text-sm sm:text-base"
        >
          <Plus size={18} className="sm:w-5 sm:h-5" />
          <span className="hidden xs:inline">Add Combatant</span>
          <span className="xs:hidden">Add</span>
        </button>
      </div>

      {showForm && (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 sm:p-6 mb-4 sm:mb-6">
          <h3 className="text-lg sm:text-xl font-bold text-white mb-4">Add Combatant</h3>

          <div className="space-y-3 sm:space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Select Character</label>
              <select
                value={selectedCharacterId}
                onChange={(e) => setSelectedCharacterId(e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 text-white rounded px-3 py-2.5 sm:py-2 focus:outline-none focus:ring-2 focus:ring-red-600"
              >
                <option value="">Choose a character...</option>
                {availableCharacters.map((char) => (
                  <option key={char.id} value={char.id}>
                    {char.name} ({char.type})
                  </option>
                ))}
              </select>
            </div>

            {selectedCharacter && (
              <>
                <div className="bg-slate-700 rounded p-3 text-xs sm:text-sm text-gray-300">
                  <p>
                    <strong>HP:</strong> {selectedCharacter.maxHp} | <strong>AC:</strong>{' '}
                    {selectedCharacter.armorClass} | <strong>DEX:</strong>{' '}
                    {selectedCharacter.dexModifier >= 0 ? '+' : ''}
                    {selectedCharacter.dexModifier}
                    {selectedCharacter.level && (
                      <>
                        {' '}
                        | <strong>Lvl:</strong> {selectedCharacter.level}
                      </>
                    )}
                  </p>
                  {selectedCharacter.notes && <p className="mt-1 text-gray-400">{selectedCharacter.notes}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Initiative</label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        checked={!useAutoRoll}
                        onChange={() => setUseAutoRoll(false)}
                        className="text-red-600"
                      />
                      <span className="text-white text-sm sm:text-base">Enter Initiative Roll</span>
                    </label>
                    {!useAutoRoll && (
                      <div className="flex gap-2">
                        <input
                          type="number"
                          value={initiativeRoll}
                          onChange={(e) => setInitiativeRoll(e.target.value)}
                          placeholder="Initiative"
                          className="flex-1 bg-slate-700 border border-slate-600 text-white rounded px-3 py-2.5 sm:py-2 focus:outline-none focus:ring-2 focus:ring-red-600"
                        />
                        <button
                          onClick={() => rollInitiativeForCharacter(selectedCharacterId)}
                          className="bg-slate-600 hover:bg-slate-500 active:scale-95 text-white px-3 py-2.5 sm:py-2 rounded flex items-center gap-2 transition-all"
                          title="Roll initiative"
                        >
                          <Dices size={18} />
                        </button>
                      </div>
                    )}

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        checked={useAutoRoll}
                        onChange={() => setUseAutoRoll(true)}
                        className="text-red-600"
                      />
                      <span className="text-white text-sm sm:text-base">Auto-roll with DEX</span>
                    </label>
                  </div>
                </div>
              </>
            )}

            <div className="flex gap-2">
              <button
                onClick={addCombatant}
                disabled={!selectedCharacterId || (!useAutoRoll && !initiativeRoll)}
                className="flex-1 sm:flex-none bg-red-600 hover:bg-red-700 active:scale-95 text-white px-4 py-2.5 sm:py-2 rounded transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add
              </button>
              <button
                onClick={() => {
                  setShowForm(false);
                  setSelectedCharacterId('');
                  setInitiativeRoll('');
                  setUseAutoRoll(false);
                }}
                className="flex-1 sm:flex-none bg-slate-700 hover:bg-slate-600 active:scale-95 text-white px-4 py-2.5 sm:py-2 rounded transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {combatants.length === 0 ? (
          <div className="bg-slate-800 border-2 border-dashed border-slate-700 rounded-lg p-6 sm:p-8 text-center">
            <p className="text-gray-400 text-sm sm:text-base">
              No combatants yet. Add characters to start tracking initiative!
            </p>
          </div>
        ) : (
          combatants.map((combatant) => (
            <div
              key={combatant.id}
              className="bg-slate-800 border border-slate-700 rounded-lg p-3 sm:p-4 hover:border-red-600 active:border-red-500 transition-colors"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
                  <div className="bg-red-600 text-white font-bold rounded-full w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center text-lg sm:text-xl flex-shrink-0">
                    {combatant.initiative ?? 0}
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2 flex-1 min-w-0">
                    {getTypeIcon(combatant.character.type)}
                    <div className="min-w-0 flex-1">
                      <h4 className="text-base sm:text-lg font-bold text-white truncate">
                        {combatant.character.name}
                        {combatant.character.level && (
                          <span className="text-xs sm:text-sm text-gray-400 ml-1 sm:ml-2">Lvl {combatant.character.level}</span>
                        )}
                      </h4>
                      <p className="text-xs sm:text-sm text-gray-400 truncate">
                        AC: {combatant.character.armorClass} | HP: {combatant.currentHp}/{combatant.character.maxHp} | DEX: {combatant.character.dexModifier >= 0 ? '+' : ''}{combatant.character.dexModifier}
                      </p>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => removeCombatant(combatant.id)}
                  className="text-red-500 hover:text-red-400 active:scale-95 transition-all p-1.5 sm:p-2 flex-shrink-0"
                  aria-label="Remove combatant"
                >
                  <Trash2 size={18} className="sm:w-5 sm:h-5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
