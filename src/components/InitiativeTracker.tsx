import { useState, useEffect } from 'react';
import { Plus, X, Dice5, Sword, Shield, Zap, Star } from 'lucide-react';

type InitiativeTrackerProps = { campaignId: string };

type Combatant = {
  id: string;
  name: string;
  maxHp: number;
  currentHp: number;
  ac: number;
  initiative: number;
  dexMod: number;
  type: 'player' | 'npc' | 'monster';
  speed: string;
  size: string;
  monsterType?: string;
  alignment?: string;
  cr?: string;
  senses?: string;
  languages?: string;
  traits?: string[];
  actions?: string[];
  legendary?: string[];
};

/* ---------- SRD monster list (trimmed to essentials) ---------- */
const SRD_MONSTERS: Omit<Combatant, 'id' | 'currentHp' | 'initiative'>[] = [
  // ----- low CR -----
  { name: 'Acolyte', maxHp: 9, ac: 10, dexMod: 0, type: 'monster', speed: '30 ft.', size: 'Medium', monsterType: 'humanoid', alignment: 'any alignment', cr: '1/4', senses: 'passive Perception 12', languages: 'Common', traits: ['Spellcasting'], actions: ['Club +2 (1d4)'] },
  { name: 'Bandit', maxHp: 11, ac: 12, dexMod: 1, type: 'monster', speed: '30 ft.', size: 'Medium', monsterType: 'humanoid', alignment: 'any non-lawful', cr: '1/8', senses: 'passive Perception 10', languages: 'Common', actions: ['Scimitar +3 (1d6+1)'] },
  { name: 'Wolf', maxHp: 11, ac: 13, dexMod: 2, type: 'monster', speed: '40 ft.', size: 'Medium', monsterType: 'beast', alignment: 'unaligned', cr: '1/4', senses: 'passive Perception 13, keen hearing/smell', languages: '-', traits: ['Pack Tactics', 'Keen Hearing/Smell'], actions: ['Bite +4 (2d4+2)'] },
  { name: 'Goblin', maxHp: 7, ac: 15, dexMod: 2, type: 'monster', speed: '30 ft.', size: 'Small', monsterType: 'humanoid', alignment: 'neutral evil', cr: '1/4', senses: 'darkvision 60 ft.', languages: 'Common, Goblin', traits: ['Nimble Escape'], actions: ['Scimitar +4 (1d6+2)', 'Shortbow +4 (1d6+2)'] },
  { name: 'Skeleton', maxHp: 13, ac: 13, dexMod: 2, type: 'monster', speed: '30 ft.', size: 'Medium', monsterType: 'undead', alignment: 'lawful evil', cr: '1/4', senses: 'darkvision 60 ft.', languages: 'understands Common but can\'t speak', traits: ['Damage Vulnerabilities: bludgeoning', 'Damage Immunities: poison', 'Condition Immunities: exhaustion, poisoned'], actions: ['Shortsword +4 (1d6+2)'] },
  // ----- mid CR -----
  { name: 'Owlbear', maxHp: 59, ac: 13, dexMod: 1, type: 'monster', speed: '40 ft.', size: 'Large', monsterType: 'monstrosity', alignment: 'unaligned', cr: '3', senses: 'darkvision 60 ft.', languages: '-', traits: ['Keen Sight/Smell'], actions: ['Multiattack: 2 claws', 'Beak +7 (2d8+5)', 'Claws +7 (2d6+5)'] },
  { name: 'Phase Spider', maxHp: 32, ac: 13, dexMod: 3, type: 'monster', speed: '30 ft., climb 30 ft.', size: 'Large', monsterType: 'monstrosity', alignment: 'unaligned', cr: '3', senses: 'darkvision 60 ft.', languages: '-', traits: ['Ethereal Jaunt', 'Spider Climb'], actions: ['Bite +5 (2d8+3 + poison)'] },
  { name: 'Displacer Beast', maxHp: 85, ac: 13, dexMod: 2, type: 'monster', speed: '40 ft.', size: 'Large', monsterType: 'monstrosity', alignment: 'lawful evil', cr: '3', senses: 'darkvision 60 ft.', languages: '-', traits: ['Displacement', 'Avoidance'], actions: ['Multiattack: 2 tentacles', 'Tentacle +6 (1d6+4)'] },
  // ----- high CR -----
  { name: 'Stone Giant', maxHp: 126, ac: 17, dexMod: 2, type: 'monster', speed: '40 ft.', size: 'Huge', monsterType: 'giant', alignment: 'neutral', cr: '7', senses: 'darkvision 60 ft.', languages: 'Giant', traits: ['Stone Camouflage'], actions: ['Multiattack: 2 greatclubs', 'Greatclub +9 (3d8+6)', 'Rock +9 (4d10+6)'] },
  { name: 'Young White Dragon', maxHp: 133, ac: 17, dexMod: 0, type: 'monster', speed: '40 ft., fly 80 ft., swim 40 ft.', size: 'Large', monsterType: 'dragon', alignment: 'chaotic evil', cr: '6', senses: 'blindsight 30 ft., darkvision 120 ft.', languages: 'Common, Draconic', traits: ['Ice Walk', 'Multiattack'], actions: ['Bite +7 (2d10+4 + 1d8 cold)', 'Cold Breath (10d8 cold, DC 16)'] },
];

/* ---------- helpers ---------- */
const HEALTH_KEY = (id: string) => `dnd_health_${id}`;
const CHAR_KEY   = 'dnd_characters';

const barPct = (cur: number, max: number) =>
  Math.max(0, Math.min(100, ((cur + max) / (max * 2)) * 100));

const barColour = (pct: number) =>
  pct <= 0 ? 'bg-red-600' : pct <= 50 ? 'bg-yellow-500' : 'bg-green-500';

const isExhaustion6 = (conds: string[]) => conds.includes('Exhaustion 6');
const enforceExhaustion6 = (c: Combatant): Combatant =>
  isExhaustion6(c.conditions) && c.currentHp > -c.maxHp
    ? { ...c, currentHp: -c.maxHp }
    : c;

export function InitiativeTracker({ campaignId }: InitiativeTrackerProps) {
  const [combatants, setCombatants] = useState<Combatant[]>([]);
  const [activeId, setActiveId]     = useState<string | null>(null);
  const [round, setRound]           = useState(1);
  const [modal, setModal]           = useState<'closed' | 'player' | 'npc' | 'monster'>('closed');
  const [newName, setNewName]       = useState('');
  const [newMax, setNewMax]         = useState('');
  const [newAc, setNewAc]           = useState('');
  const [newDex, setNewDex]         = useState('');
  const [editing, setEditing]       = useState<string | null>(null);
  const [hpEdit, setHpEdit]         = useState('');
  const [dropdown, setDropdown]     = useState<string | null>(null);

  /* ---------- load + enforce exhaustion 6 ---------- */
  useEffect(() => {
    const key = `dnd_init_${campaignId}`;
    const raw = localStorage.getItem(key);
    if (raw) {
      const loaded: Combatant[] = JSON.parse(raw);
      setCombatants(loaded.map(enforceExhaustion6));
      const active = loaded.find((c) => c.id === localStorage.getItem(`dnd_active_${campaignId}`));
      if (active) setActiveId(active.id);
    }
  }, [campaignId]);

  useEffect(() => {
    const key = `dnd_init_${campaignId}`;
    localStorage.setItem(key, JSON.stringify(combatants));
    if (activeId) localStorage.setItem(`dnd_active_${campaignId}`, activeId);
  }, [combatants, activeId, campaignId]);

  /* ---------- roll ---------- */
  const roll = (dex: number) => Math.floor(Math.random() * 20) + 1 + dex;

  /* ---------- add from SRD monster ---------- */
  const addMonster = (m: typeof SRD_MONSTERS[0]) => {
    const newC: Combatant = {
      id: crypto.randomUUID(),
      name: m.name,
      maxHp: m.maxHp,
      currentHp: m.maxHp,
      ac: m.ac,
      initiative: roll(m.dexMod),
      dexMod: m.dexMod,
      type: 'monster',
      speed: m.speed,
      size: m.size,
      monsterType: m.monsterType,
      alignment: m.alignment,
      cr: m.cr,
      senses: m.senses,
      languages: m.languages,
      traits: m.traits,
      actions: m.actions,
      legendary: m.legendary,
      conditions: [],
      tempHp: 0,
    };
    setCombatants((prev) => [...prev, newC].sort((a, b) => b.initiative - a.initiative));
  };

  /* ---------- add custom (player / npc / custom-monster) ---------- */
  const addCustom = () => {
    const max = parseInt(newMax) || 10;
    const ac = parseInt(newAc) || 10;
    const dex = parseInt(newDex) || 0;
    const newC: Combatant = {
      id: crypto.randomUUID(),
      name: newName.trim() || 'Unnamed',
      maxHp: max,
      currentHp: max,
      ac: ac,
      initiative: roll(dex),
      dexMod: dex,
      type: modal === 'player' ? 'player' : modal === 'npc' ? 'npc' : 'monster',
      speed: '30 ft.',
      size: 'Medium',
      conditions: [],
      tempHp: 0,
    };
    setCombatants((prev) => [...prev, newC].sort((a, b) => b.initiative - a.initiative));
    setNewName(''); setNewMax(''); setNewAc(''); setNewDex('');
    setModal('closed');
  };

  /* ---------- remove ---------- */
  const remove = (id: string) => {
    setCombatants((prev) => prev.filter((c) => c.id !== id));
    if (activeId === id) setActiveId(null);
  };

  /* ---------- next turn ---------- */
  const nextTurn = () => {
    if (combatants.length === 0) return;
    const idx = combatants.findIndex((c) => c.id === activeId);
    const nextIdx = (idx + 1) % combatants.length;
    setActiveId(combatants[nextIdx].id);
    if (nextIdx === 0) setRound((r) => r + 1);
  };

  /* ---------- HP clamp (never above max, down to -max) ---------- */
  const applyDamage = (id: string, amount: number) =>
    setCombatants((l) =>
      l.map((c) =>
        c.id === id
          ? enforceExhaustion6({ ...c, currentHp: Math.min(c.maxHp, Math.max(-c.maxHp, c.currentHp + amount)) })
          : c
      )
    );

  const setHp = (id: string, val: number) =>
    setCombatants((l) =>
      l.map((c) => (c.id === id ? { ...c, currentHp: Math.min(c.maxHp, Math.max(-c.maxHp, val)) } : c))
    );

  const setTemp = (id: string, n: number) =>
    setCombatants((l) => l.map((c) => (c.id === id ? { ...c, tempHp: n } : c)));

  /* ---------- status badge ---------- */
  const statusBadge = (c: Combatant) => {
    if (isExhaustion6(c.conditions)) return { text: 'Dead (Exhaustion 6)', color: 'bg-red-700' };
    if (c.currentHp <= -c.maxHp) return { text: 'Dead', color: 'bg-red-700' };
    if (c.currentHp === 0) return { text: 'Unconscious', color: 'bg-gray-700' };
    if (c.currentHp <= Math.floor(c.maxHp / 2)) return { text: 'Bloodied', color: 'bg-orange-600' };
    return { text: 'Healthy', color: 'bg-green-700' };
  };

  /* ---------- render ---------- */
  return (
    <div className="space-y-4">
      {/* ----  header  ---- */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Sword size={24} className="text-red-600" />
          Initiative Tracker
        </h2>
        <div className="flex items-center gap-3">
          <span className="text-gray-400">Round {round}</span>
          <button
            onClick={nextTurn}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded flex items-center gap-2"
          >
            <Dice5 size={16} /> Next Turn
          </button>
        </div>
      </div>

      {/* ----  add row with 3 round icon buttons  ---- */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setModal('player')}
          className="w-12 h-12 rounded-full bg-green-700 hover:bg-green-600 text-white flex items-center justify-center shadow"
          title="Add Player"
        >
          <span className="text-lg">🧑</span>
        </button>
        <button
          onClick={() => setModal('npc')}
          className="w-12 h-12 rounded-full bg-blue-700 hover:bg-blue-600 text-white flex items-center justify-center shadow"
          title="Add NPC"
        >
          <span className="text-lg">👤</span>
        </button>
        <button
          onClick={() => setModal('monster')}
          className="w-12 h-12 rounded-full bg-purple-700 hover:bg-purple-600 text-white flex items-center justify-center shadow"
          title="Add Monster"
        >
          <span className="text-lg">👹</span>
        </button>
      </div>

      {/* ----  list  ---- */}
      {combatants.length === 0 && <p className="text-gray-400 text-center py-8">No combatants yet.</p>}

      {combatants.map((c, idx) => {
        const isActive = c.id === activeId;
        const pct = barPct(c.currentHp, c.maxHp);
        const barColor = pct <= 0 ? 'bg-red-600' : pct <= 50 ? 'bg-yellow-500' : 'bg-green-500';
        const badge = statusBadge(c);
        return (
          <div
            key={c.id}
            className={`border rounded-lg p-4 transition-all ${isActive ? 'border-red-600 shadow-lg' : 'border-slate-700'}`}
            style={{ backgroundColor: isActive ? '#1f2937' : '#1e293b' }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-gray-400 font-bold text-lg w-8">{idx + 1}</span>
                <div>
                  <h3 className="text-white font-bold flex items-center gap-2">
                    {c.name}
                    {c.type === 'monster' && c.cr && <span className="text-xs text-yellow-400">CR {c.cr}</span>}
                  </h3>
                  <div className={`inline-block px-2 py-1 rounded text-xs text-white ${badge.color}`}>{badge.text}</div>
                </div>
              </div>
              <button onClick={() => remove(c.id)} className="text-red-500 hover:text-red-400"><Trash2 size={16} /></button>
            </div>

            {/*  HP bar  */}
            <div className="flex items-center gap-3 mt-2">
              <div className="flex-1 bg-slate-700 rounded-full h-4 overflow-hidden relative">
                <div className={`h-4 ${barColor} transition-all duration-300`} style={{ width: `${pct}%` }} />
                <div className="absolute inset-0 flex items-center justify-center text-white text-xs font-semibold">
                  {c.currentHp} / {c.maxHp} HP
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => applyDamage(c.id, -1)} className="bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded text-xs">+1</button>
                <button onClick={() => applyDamage(c.id, 1)} className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded text-xs">-1</button>
              </div>
            </div>

            {/*  stats row  */}
            <div className="flex items-center gap-4 text-sm text-gray-300 mt-2">
              <span>AC {c.ac}</span>
              <span>Init {c.initiative}</span>
              <span>Speed {c.speed}</span>
              {c.tempHp > 0 && <span className="text-blue-400">+{c.tempHp} temp</span>}
            </div>

            {/*  traits / actions preview  */}
            {c.traits && c.traits.length > 0 && (
              <details className="mt-2 text-xs text-gray-400">
                <summary className="cursor-pointer">Traits</summary>
                <ul className="list-disc list-inside ml-2">{c.traits.map((t) => <li key={t}>{t}</li>)}</ul>
              </details>
            )}
            {c.actions && c.actions.length > 0 && (
              <details className="mt-1 text-xs text-gray-400">
                <summary className="cursor-pointer">Actions</summary>
                <ul className="list-disc list-inside ml-2">{c.actions.map((a) => <li key={a}>{a}</li>)}</ul>
              </details>
            )}

            {/*  condition chips  */}
            <div className="flex flex-wrap items-center gap-2 mt-2">
              {c.conditions.map((cond) => {
                const emo = CONDITIONS.find((x) => x.name === cond)?.emoji || '❓';
                return (
                  <span key={cond} className="bg-slate-700 border border-slate-600 rounded-full px-2 py-1 text-xs text-white flex items-center gap-1">
                    <span>{emo}</span>
                    <span>{cond}</span>
                    <button onClick={() => removeCondition(c.id, cond)} className="text-red-400 hover:text-red-300">
                      <X size={10} />
                    </button>
                  </span>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* ----  modal  ---- */}
      {modal !== 'closed' && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            {/*  header  */}
            <div className="flex items-center justify-between p-4 border-b border-slate-700">
              <h3 className="text-xl font-bold text-white">Add {modal === 'monster' ? 'Monster' : modal === 'player' ? 'Player' : 'NPC'}</h3>
              <button onClick={() => setModal('closed')} className="text-gray-400 hover:text-white"><X size={20} /></button>
            </div>

            {/*  body  */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {modal === 'monster' ? (
                <>
                  <p className="text-sm text-gray-400">Choose from SRD monsters:</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {SRD_MONSTERS.map((m) => (
                      <button
                        key={m.name}
                        onClick={() => {
                          addMonster(m);
                          setModal('closed');
                        }}
                        className="bg-slate-700 hover:bg-slate-600 border border-slate-600 rounded-lg p-3 text-left transition"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-white font-semibold">{m.name}</div>
                            <div className="text-xs text-gray-400">CR {m.cr} · {m.size} {m.monsterType}</div>
                          </div>
                          <div className="text-xs text-gray-300 text-right">
                            <div>HP {m.maxHp}</div>
                            <div>AC {m.ac}</div>
                            <div>Init +{m.dexMod}</div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                  <details className="text-sm text-gray-400">
                    <summary className="cursor-pointer">Custom monster (home-brew)</summary>
                    <div className="mt-2 space-y-2">
                      <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Name" className="w-full bg-slate-700 border border-slate-600 text-white rounded px-3 py-2" />
                      <div className="flex gap-2">
                        <input type="number" value={newMax} onChange={(e) => setNewMax(e.target.value)} placeholder="Max HP" className="w-full bg-slate-700 border border-slate-600 text-white rounded px-3 py-2" />
                        <input type="number" value={newAc} onChange={(e) => setNewAc(e.target.value)} placeholder="AC" className="w-full bg-slate-700 border border-slate-600 text-white rounded px-3 py-2" />
                        <input type="number" value={newDex} onChange={(e) => setNewDex(e.target.value)} placeholder="Dex mod" className="w-full bg-slate-700 border border-slate-600 text-white rounded px-3 py-2" />
                      </div>
                      <button onClick={addCustom} className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded">Add Custom</button>
                    </div>
                  </details>
                </>
              ) : (
                <div className="space-y-3">
                  <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Name" className="w-full bg-slate-700 border border-slate-600 text-white rounded px-3 py-2" />
                  <div className="flex gap-2">
                    <input type="number" value={newMax} onChange={(e) => setNewMax(e.target.value)} placeholder="Max HP" className="w-full bg-slate-700 border border-slate-600 text-white rounded px-3 py-2" />
                    <input type="number" value={newAc} onChange={(e) => setNewAc(e.target.value)} placeholder="AC" className="w-full bg-slate-700 border border-slate-600 text-white rounded px-3 py-2" />
                    <input type="number" value={newDex} onChange={(e) => setNewDex(e.target.value)} placeholder="Dex mod" className="w-full bg-slate-700 border border-slate-600 text-white rounded px-3 py-2" />
                  </div>
                  <button onClick={addCustom} className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded">Add</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
