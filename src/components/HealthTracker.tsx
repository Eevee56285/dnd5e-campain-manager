import { useState, useEffect, useMemo } from 'react';
import { storage, type Character, type ActiveCombatant } from '../lib/storage';
import { Heart, Minus, Plus, User, Users, Skull } from 'lucide-react';

type HealthTrackerProps = { campaignId: string };

type CombatantDisplay = ActiveCombatant & { character: Character };

export function HealthTracker({ campaignId }: HealthTrackerProps) {
  /* ---------- state ---------- */
  const [combatants, setCombatants] = useState<CombatantDisplay[]>([]);
  const [hpChanges, setHpChanges] = useState<Record<string, string>>({});

  /* Local mirror of CURRENT hp (characterId -> hp) – drives the bar instantly */
  const [localHp, setLocalHp] = useState<Record<string, number>>({});

  /* ---------- derived data ---------- */
  const characters = useMemo(() => storage.getCharacters(), []);
  const session = useMemo(() => {
    const s = storage.getBattleSession();
    return s?.campaignId === campaignId ? s : null;
  }, [campaignId]);

  /* ---------- central HP writer – updates ALL sources ---------- */
  const syncHp = (characterId: string, newValue: number) => {
    const clamped = Math.max(0, newValue);

    /* 1. battle session (if in combat) */
    if (session) {
      const combatant = session.combatants.find(c => c.characterId === characterId);
      if (combatant) {
        combatant.currentHp = clamped;
        storage.saveBattleSession(session);
      }
    }

    /* 2. character sheet (persists when they leave combat) */
    const ch = characters.find(c => c.id === characterId);
    if (ch) {
      (ch as any).currentHp = clamped; // or add currentHp?:number to Character type
      storage.saveCharacter(ch);
    }

    /* 3. local mirror → instant UI */
    setLocalHp(prev => ({ ...prev, [characterId]: clamped }));
  };

  /* ---------- load / merge list + seed localHp once ---------- */
  useEffect(() => {
    const inSession = session?.combatants ?? [];
    const inSessionIds = new Set(inSession.map(c => c.characterId));
    const charMap = new Map(characters.map(c => [c.id, c]));

    const active: CombatantDisplay[] = inSession
      .map(c => {
        const ch = charMap.get(c.characterId);
        return ch ? { ...c, character: ch } : null;
      })
      .filter((c): c is CombatantDisplay => Boolean(c));

    const roster = characters
      .filter(ch => !inSessionIds.has(ch.id))
      .map((ch): CombatantDisplay => ({
        id: `roster-${ch.id}`,
        characterId: ch.id,
        currentHp: (ch as any).currentHp ?? ch.maxHp,
        initiative: 0,
        character: ch,
      }));

    const merged = [...active, ...roster];
    setCombatants(merged);

    const seed: Record<string, number> = {};
    merged.forEach(c => { seed[c.characterId] = c.currentHp; });
    setLocalHp(seed);
  }, [session, characters]);

  /* ---------- button helpers ---------- */
  const updateHP = (id: string, delta: number) => {
    const characterId = combatants.find(c => c.id === id)?.characterId;
    if (!characterId) return;
    const prev = localHp[characterId] ?? combatants.find(c => c.characterId === characterId)?.currentHp ?? 0;
    syncHp(characterId, prev + delta);
    setHpChanges(prev => ({ ...prev, [id]: '' }));
  };

  const setHP = (id: string, value: number) => {
    const characterId = combatants.find(c => c.id === id)?.characterId;
    if (!characterId) return;
    syncHp(characterId, value);
  };

  /* ---------- util ---------- */
  const getHealthPercentage = (cur: number, max: number) => (max ? (cur / max) * 100 : 0);
  const getHealthColor = (p: number) =>
    p > 66 ? 'bg-green-600' : p > 33 ? 'bg-yellow-600' : p > 0 ? 'bg-red-600' : 'bg-gray-600';

  const typeIcon = (t: string) =>
    t === 'player' ? <User size={24} className="text-blue-400" /> :
    t === 'npc' ? <Users size={24} className="text-green-400" /> :
    <Skull size={24} className="text-red-400" />;

  /* ---------- render ---------- */
  const activeList = combatants.filter(c => !c.id.startsWith('roster-'));
  const rosterList = combatants.filter(c => c.id.startsWith('roster-'));

  const renderCard = (c: CombatantDisplay, readOnly = false) => {
    const hp = localHp[c.characterId] ?? c.currentHp; // real-time value
    const pct = getHealthPercentage(hp, c.character.maxHp);
    const isUnconscious = hp === 0;

    return (
      <div
        key={c.id}
        className={`bg-slate-800 border rounded-lg p-6 transition-all ${
          isUnconscious ? 'border-red-600 opacity-60' : 'border-slate-700'
        } ${readOnly ? 'opacity-80' : 'hover:border-red-600'}`}
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            {typeIcon(c.character.type)}
            <div>
              <h4 className="text-xl font-bold text-white flex items-center gap-2">
                {c.character.name}
                {c.character.level && <span className="text-sm text-gray-400">Lvl {c.character.level}</span>}
                {isUnconscious && <span className="text-red-500 text-sm">(Unconscious)</span>}
              </h4>
              <p className="text-sm text-gray-400">
                AC: {c.character.armorClass} {readOnly ? '' : `| Initiative: ${c.initiative}`}
                {c.character.notes && ` | ${c.character.notes}`}
              </p>
            </div>
          </div>
          <Heart size={24} className="text-red-600" />
        </div>

        {/* health bar */}
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-300 font-medium">Health</span>
              <span className="text-white font-bold text-lg">{hp} / {c.character.maxHp}</span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-6 overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${getHealthColor(pct)}`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>

          {/* controls */}
          {readOnly ? (
            <p className="text-center text-sm text-gray-500">Not in combat</p>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => updateHP(c.id, -(parseInt(hpChanges[c.id] || '1') || 1))}
                  className="bg-red-600 hover:bg-red-700 text-white p-2 rounded transition-colors"
                >
                  <Minus size={20} />
                </button>

                <input
                  type="number"
                  value={hpChanges[c.id] || ''}
                  onChange={(e) => setHpChanges(prev => ({ ...prev, [c.id]: e.target.value }))}
                  placeholder="Amount"
                  className="flex-1 bg-slate-700 border border-slate-600 text-white rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-600 text-center"
                />

                <button
                  onClick={() => updateHP(c.id, parseInt(hpChanges[c.id] || '1') || 1)}
                  className="bg-green-600 hover:bg-green-700 text-white p-2 rounded transition-colors"
                >
                  <Plus size={20} />
                </button>

                <button
                  onClick={() => setHP(c.id, c.character.maxHp)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition-colors font-medium"
                >
                  Full Heal
                </button>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setHP(c.id, Math.floor(c.character.maxHp / 2))}
                  className="flex-1 bg-slate-700 hover:bg-slate-600 text-white px-3 py-2 rounded transition-colors text-sm"
                >
                  50% HP
                </button>
                <button
                  onClick={() => setHP(c.id, 0)}
                  className="flex-1 bg-slate-700 hover:bg-slate-600 text-white px-3 py-2 rounded transition-colors text-sm"
                >
                  Down (0 HP)
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {activeList.length === 0 && rosterList.length === 0 && (
        <div className="bg-slate-800 border-2 border-dashed border-slate-700 rounded-lg p-8 text-center">
          <p className="text-gray-400">No characters in this campaign yet.</p>
        </div>
      )}

      {activeList.length > 0 && (
        <section>
          <h3 className="text-lg font-semibold text-white mb-3">Active Combatants</h3>
          <div className="space-y-4">{activeList.map(c => renderCard(c))}</div>
        </section>
      )}

      {rosterList.length > 0 && (
        <section>
          <h3 className="text-lg font-semibold text-white mb-3">Roster</h3>
          <div className="space-y-4">{rosterList.map(c => renderCard(c, true))}</div>
        </section>
      )}
    </div>
  );
}
