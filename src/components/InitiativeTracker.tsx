import { useState, useEffect } from 'react';
import { Plus, X, Dice5, Sword } from 'lucide-react';

type InitiativeTrackerProps = { campaignId: string };

type LibraryCharacter = {
  id: string;
  name: string;
  maxHp: number;
  type: 'player' | 'npc' | 'monster';
  armorClass?: number;
  dexModifier?: number;
  notes?: string;
};

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
  conditions: string[];
  tempHp: number;
};

/* ---------- remote full monster list ---------- */
const MONSTERS_URL = 'https://raw.githubusercontent.com/nick-aschenbach/dnd-data/refs/heads/main/data/monsters.json';

/* ---------- helpers ---------- */
const HEALTH_KEY = (id: string) => `dnd_health_${id}`;
const CHAR_KEY   = 'dnd_characters';
const INIT_KEY   = (id: string) => `dnd_init_${id}`;
const ACTIVE_KEY = (id: string) => `dnd_active_${id}`;

const barPct = (cur: number, max: number) =>
  Math.max(0, Math.min(100, ((cur + max) / (max * 2)) * 100));

const barColour = (pct: number) =>
  pct <= 0 ? 'bg-red-600' : pct <= 50 ? 'bg-yellow-500' : 'bg-green-500';

const isExhaustion6 = (conds: string[]) => conds.includes('Exhaustion 6');
const enforceExhaustion6 = (c: Combatant): Combatant =>
  isExhaustion6(c.conditions) && c.currentHp > -c.maxHp
    ? { ...c, currentHp: -c.maxHp }
    : c;

const roll = (mod: number) => Math.floor(Math.random() * 20) + 1 + mod;

export function InitiativeTracker({ campaignId }: InitiativeTrackerProps) {
  const [combatants, setCombatants] = useState<Combatant[]>([]);
  const [activeId, setActiveId]     = useState<string | null>(null);
  const [round, setRound]           = useState(1);
  const [menu, setMenu]             = useState<'closed' | 'player' | 'npc' | 'monster'>('closed');
  const [newName, setNewName]       = useState('');
  const [newMax, setNewMax]         = useState('');
  const [newAc, setNewAc]           = useState('');
  const [newDex, setNewDex]         = useState('');
  const [manualInit, setManualInit] = useState('');
  const [library, setLibrary]       = useState<LibraryCharacter[]>([]);
  const [remoteMonsters, setRemote] = useState<Combatant[]>([]);
  const [loading, setLoading]       = useState(false);

  /* ---------- load local library + initiative ---------- */
  useEffect(() => {
    const libRaw = localStorage.getItem(CHAR_KEY);
    if (libRaw) setLibrary(JSON.parse(libRaw));
    const initRaw = localStorage.getItem(INIT_KEY(campaignId));
    if (initRaw) {
      const loaded: Combatant[] = JSON.parse(initRaw);
      setCombatants(loaded.map(enforceExhaustion6));
      const active = localStorage.getItem(ACTIVE_KEY(campaignId));
      if (active) setActiveId(active);
    }
  }, [campaignId]);

  useEffect(() => {
    localStorage.setItem(INIT_KEY(campaignId), JSON.stringify(combatants));
    if (activeId) localStorage.setItem(ACTIVE_KEY(campaignId), activeId);
  }, [combatants, activeId, campaignId]);

  /* ---------- library split ---------- */
  const players = library.filter((c) => c.type === 'player');
  const npcs    = library.filter((c) => c.type === 'npc');

  /* ---------- fetch remote monsters once when Monster menu opened ---------- */
  useEffect(() => {
    if (menu === 'monster' && remoteMonsters.length === 0 && !loading) {
      setLoading(true);
      fetch(MONSTERS_URL)
        .then((r) => r.json())
        .then((data: any[]) => {
          const list: Combatant[] = data.map((m: any) => ({
            name: m.name,
            maxHp: m.hit_points,
            currentHp: m.hit_points,
            ac: m.armor_class,
            initiative: 0, // rolled on add
            dexMod: m.dexterity ? Math.floor((m.dexterity - 10) / 2) : 0,
            type: 'monster',
            speed: m.speed?.walk || '30 ft.',
            size: m.size || 'Medium',
            monsterType: m.type || 'beast',
            alignment: m.alignment || 'unaligned',
            cr: m.challenge_rating?.toString() || '-',
            senses: Object.keys(m.senses || {}).join(', ') || 'passive Perception 10',
            languages: m.languages || '-',
            traits: m.special_abilities?.map((a: any) => a.name) || [],
            actions: m.actions?.map((a: any) => a.name) || [],
            legendary: m.legendary_actions?.map((a: any) => a.name) || [],
            conditions: [],
            tempHp: 0,
          }));
          setRemote(list);
          setLoading(false);
        })
        .catch(() => {
          setRemote([]);
          setLoading(false);
        });
    }
  }, [menu, remoteMonsters.length, loading]);

  /* ---------- add from remote monster ---------- */
  const addMonster = (m: Combatant) => {
    const newC: Combatant = {
      ...m,
      id: crypto.randomUUID(),
      initiative: manualInit === '' ? roll(m.dexMod) : parseInt(manualInit) || 0,
    };
    setCombatants((prev) => [...prev, newC].sort((a, b) => b.initiative - a.initiative));
    setMenu('closed');
  };

  /* ---------- add from library (player / npc) ---------- */
  const addFromLibrary = (c: LibraryCharacter, initRoll?: number) => {
    const newC: Combatant = {
      id: crypto.randomUUID(),
      name: c.name,
      maxHp: c.maxHp,
      currentHp: c.maxHp,
      ac: c.armorClass ?? 10,
      initiative: initRoll ?? (manualInit === '' ? roll(c.dexModifier ?? 0) : parseInt(manualInit) || 0),
      dexMod: c.dexModifier ?? 0,
      type: c.type,
      speed: '30 ft.',
      size: 'Medium',
      conditions: [],
      tempHp: 0,
    };
    setCombatants((prev) => [...prev, newC].sort((a, b) => b.initiative - a.initiative));
    setMenu('closed');
  };

  /* ---------- add custom (inline form) ---------- */
  const [customType, setCustomType] = useState<'player' | 'npc' | 'monster'>('monster');
  const addCustomInline = () => {
    const mHp = parseInt(newMax) || 10;
    const nAc = parseInt(newAc) || 10;
    const nDex = parseInt(newDex) || 0;
    const init = manualInit === '' ? roll(nDex) : parseInt(manualInit) || 0;
    const newC: Combatant = {
      id: crypto.randomUUID(),
      name: newName.trim() || 'Unnamed',
      maxHp: mHp,
      currentHp: mHp,
      ac: nAc,
      initiative: init,
      dexMod: nDex,
      type: customType,
      speed: '30 ft.',
      size: 'Medium',
      conditions: [],
      tempHp: 0,
    };
    setCombatants((prev) => [...prev, newC].sort((a, b) => b.initiative - a.initiative));
    // reset
    setNewName(''); setNewMax(''); setNewAc(''); setNewDex(''); setManualInit(''); setMenu('closed');
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

  const setTemp = (id: string, n: number) =>
    setCombatants((l) => l.map((c) => (c.id === id ? { ...c, tempHp: n } : c)));

  /* ---------- render ---------- */
  return (
    <div className="space-y-4">
      {/* ----  header + tiny add button  ---- */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Sword size={24} className="text-red-600" />
          Initiative Tracker
        </h2>
        <div className="flex items-center gap-3">
          <span className="text-gray-400">Round {round}</span>
          <button onClick={nextTurn} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded flex items-center gap-2">
            <Dice5 size={16} /> Next Turn
          </button>
          {/*  tiny add button  */}
          <div className="relative">
            <button
              onClick={() => setMenu(menu === 'closed' ? 'player' : 'closed')}
              className="w-10 h-10 rounded-full bg-slate-700 hover:bg-slate-600 text-white flex items-center justify-center shadow"
              title="Add"
            >
              <Plus size={18} />
            </button>

            {/*  3-choice pop-over  */}
            {menu !== 'closed' && (
              <div className="absolute right-0 mt-2 w-48 bg-slate-800 border border-slate-700 rounded-lg shadow-lg z-10 p-2 space-y-2">
                <button onClick={() => setMenu('player')} className="w-full flex items-center gap-2 px-3 py-2 rounded hover:bg-slate-700 text-white">
                  <span className="text-lg">🧑</span> Player
                </button>
                <button onClick={() => setMenu('npc')} className="w-full flex items-center gap-2 px-3 py-2 rounded hover:bg-slate-700 text-white">
                  <span className="text-lg">👤</span> NPC
                </button>
                <button onClick={() => setMenu('monster')} className="w-full flex items-center gap-2 px-3 py-2 rounded hover:bg-slate-700 text-white">
                  <span className="text-lg">👹</span> Monster
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ----  content by menu  ---- */}
      {menu === 'player' && (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-white font-semibold">Players from Library</h3>
            <button onClick={() => setMenu('closed')}><X className="text-gray-400 hover:text-white" /></button>
          </div>
          {players.length === 0 && <p className="text-gray-400 text-sm">No players in library.</p>}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-64 overflow-y-auto">
            {players.map((c) => (
              <div key={c.id} className="bg-slate-700 border border-slate-600 rounded-lg p-3">
                <div className="text-white font-semibold">{c.name}</div>
                <div className="text-xs text-gray-400">HP {c.maxHp} · AC {c.armorClass ?? 10} · Init +{c.dexModifier ?? 0}</div>
                <div className="mt-2 flex items-center gap-2">
                  <input
                    value={manualInit}
                    onChange={(e) => setManualInit(e.target.value)}
                    placeholder="Manual roll"
                    className="w-full bg-slate-600 border border-slate-500 text-white rounded px-2 py-1 text-xs"
                  />
                  <button
                    onClick={() => {
                      addFromLibrary(c, manualInit === '' ? undefined : parseInt(manualInit) || 0);
                    }}
                    className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-xs"
                  >
                    Add
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {menu === 'npc' && (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-white font-semibold">NPCs from Library</h3>
            <button onClick={() => setMenu('closed')}><X className="text-gray-400 hover:text-white" /></button>
          </div>
          {npcs.length === 0 && <p className="text-gray-400 text-sm">No NPCs in library.</p>}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-64 overflow-y-auto">
            {npcs.map((c) => (
              <div key={c.id} className="bg-slate-700 border border-slate-600 rounded-lg p-3">
                <div className="text-white font-semibold">{c.name}</div>
                <div className="text-xs text-gray-400">HP {c.maxHp} · AC {c.armorClass ?? 10} · Init +{c.dexModifier ?? 0}</div>
                <div className="mt-2 flex items-center gap-2">
                  <input
                    value={manualInit}
                    onChange={(e) => setManualInit(e.target.value)}
                    placeholder="Manual roll"
                    className="w-full bg-slate-600 border border-slate-500 text-white rounded px-2 py-1 text-xs"
                  />
                  <button
                    onClick={() => {
                      addFromLibrary(c, manualInit === '' ? undefined : parseInt(manualInit) || 0);
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs"
                  >
                    Add
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {menu === 'monster' && (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-white font-semibold">SRD Monsters</h3>
            <button onClick={() => setMenu('closed')}><X className="text-gray-400 hover:text-white" /></button>
          </div>
          {loading && <p className="text-sm text-gray-400">Loading monsters...</p>}
          {!loading && remoteMonsters.length === 0 && <p className="text-sm text-gray-400">Could not load monsters.</p>}
          {!loading && remoteMonsters.length > 0 && (
            <>
              <p className="text-xs text-gray-400">First 200 of full SRD:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-64 overflow-y-auto">
                {remoteMonsters.slice(0, 200).map((m) => (
                  <div key={m.name} className="bg-slate-700 border border-slate-600 rounded-lg p-3">
                    <div className="text-white font-semibold">{m.name}</div>
                    <div className="text-xs text-gray-400">CR {m.cr} · {m.size} {m.monsterType}</div>
                    <div className="mt-2 flex items-center gap-2">
                      <input
                        value={manualInit}
                        onChange={(e) => setManualInit(e.target.value)}
                        placeholder="Manual roll"
                        className="w-full bg-slate-600 border border-slate-500 text-white rounded px-2 py-1 text-xs"
                      />
                      <button
                        onClick={() => {
                          addMonster(m);
                        }}
                        className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded text-xs"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
          <details className="text-sm text-gray-400">
            <summary className="cursor-pointer">Custom monster (home-brew)</summary>
            <div className="mt-2 space-y-2">
              <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Name" className="w-full bg-slate-700 border border-slate-600 text-white rounded px-3 py-2" />
              <div className="flex gap-2">
                <input type="number" value={newMax} onChange={(e) => setNewMax(e.target.value)} placeholder="Max HP" className="w-full bg-slate-700 border border-slate-600 text-white rounded px-3 py-2" />
                <input type="number" value={newAc} onChange={(e) => setNewAc(e.target.value)} placeholder="AC" className="w-full bg-slate-700 border border-slate-600 text-white rounded px-3 py-2" />
                <input type="number" value={newDex} onChange={(e) => setNewDex(e.target.value)} placeholder="Dex mod" className="w-full bg-slate-700 border border-slate-600 text-white rounded px-3 py-2" />
              </div>
              <div className="flex items-center gap-2">
                <input
                  value={manualInit}
                  onChange={(e) => setManualInit(e.target.value)}
                  placeholder="Manual initiative"
                  className="w-full bg-slate-600 border border-slate-500 text-white rounded px-2 py-1 text-sm"
                />
                <button onClick={addCustomInline} className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded">Add Custom</button>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <input type="radio" id="ctMonster" name="ctype" value="monster" checked={customType === 'monster'} onChange={() => setCustomType('monster')} />
                <label htmlFor="ctMonster">Monster</label>
                <input type="radio" id="ctNpc" name="ctype" value="npc" checked={customType === 'npc'} onChange={() => setCustomType('npc')} />
                <label htmlFor="ctNpc">NPC</label>
                <input type="radio" id="ctPlayer" name="ctype" value="player" checked={customType === 'player'} onChange={() => setCustomType('player')} />
                <label htmlFor="ctPlayer">Player</label>
              </div>
            </div>
          </details>
        </div>
      )}

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
                const CONDITIONS = [
                  { name: 'Blinded', emoji: '🙈' }, { name: 'Charmed', emoji: '💕' }, { name: 'Deafened', emoji: '🦻' },
                  { name: 'Frightened', emoji: '😱' }, { name: 'Grappled', emoji: '🤼' }, { name: 'Incapacitated', emoji: '😵' },
                  { name: 'Invisible', emoji: '👻' }, { name: 'Paralyzed', emoji: '🧊' }, { name: 'Petrified', emoji: '🗿' },
                  { name: 'Poisoned', emoji: '🧪' }, { name: 'Prone', emoji: '🛌' }, { name: 'Restrained', emoji: '🔗' },
                  { name: 'Stunned', emoji: '⚡' }, { name: 'Exhaustion', emoji: '😩' }, { name: 'Exhaustion 6', emoji: '💀' },
                ];
                const emo = CONDITIONS.find((x) => x.name === cond)?.emoji || '❓';
                return (
                  <span key={cond} className="bg-slate-700 border border-slate-600 rounded-full px-2 py-1 text-xs text-white flex items-center gap-1">
                    <span>{emo}</span>
                    <span>{cond}</span>
                    <button onClick={() => { /* removeCondition not shown for brevity */ }} className="text-red-400 hover:text-red-300">
                      <X size={10} />
                    </button>
                  </span>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
