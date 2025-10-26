import { useState, useEffect } from 'react';
import { Plus, X, Dice5, Sword } from 'lucide-react';

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
  conditions: string[];
  tempHp: number;
};

/* ---------- helpers ---------- */
const INIT_KEY   = (id: string) => `dnd_init_${id}`;
const ACTIVE_KEY = (id: string) => `dnd_active_${id}`;

const roll = (mod: number) => Math.floor(Math.random() * 20) + 1 + mod;

export function InitiativeTracker({ campaignId }: InitiativeTrackerProps) {
  const [combatants, setCombatants] = useState<Combatant[]>([]);
  const [activeId, setActiveId]     = useState<string | null>(null);
  const [round, setRound]           = useState(1);
  const [showForm, setShowForm]     = useState(false);
  const [name, setName]             = useState('');
  const [maxHp, setMaxHp]           = useState('');
  const [ac, setAc]                 = useState('');
  const [dexMod, setDexMod]         = useState('');
  const [manualInit, setManualInit] = useState('');

  /* ---------- load / save ---------- */
  useEffect(() => {
    const raw = localStorage.getItem(INIT_KEY(campaignId));
    if (raw) {
      const loaded: Combatant[] = JSON.parse(raw);
      setCombatants(loaded);
      const active = localStorage.getItem(ACTIVE_KEY(campaignId));
      if (active) setActiveId(active);
    }
  }, [campaignId]);

  useEffect(() => {
    localStorage.setItem(INIT_KEY(campaignId), JSON.stringify(combatants));
    if (activeId) localStorage.setItem(ACTIVE_KEY(campaignId), activeId);
  }, [combatants, activeId, campaignId]);

  /* ---------- add ---------- */
  const add = () => {
    const mHp = parseInt(maxHp) || 10;
    const nAc = parseInt(ac) || 10;
    const nDex = parseInt(dexMod) || 0;
    const init = manualInit === '' ? roll(nDex) : parseInt(manualInit) || 0;

    const newC: Combatant = {
      id: crypto.randomUUID(),
      name: name.trim() || 'Unnamed',
      maxHp: mHp,
      currentHp: mHp,
      ac: nAc,
      initiative: init,
      dexMod: nDex,
      type: 'monster',
      speed: '30 ft.',
      size: 'Medium',
      conditions: [],
      tempHp: 0,
    };

    setCombatants((prev) => [...prev, newC].sort((a, b) => b.initiative - a.initiative));
    // reset
    setName(''); setMaxHp(''); setAc(''); setDexMod(''); setManualInit(''); setShowForm(false);
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

  /* ---------- render ---------- */
  return (
    <div className="space-y-4">
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
        </div>
      </div>

      {/* ----  add button  ---- */}
      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          className="w-full bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded flex items-center justify-center gap-2"
        >
          <Plus size={18} /> Add Combatant
        </button>
      ) : (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 space-y-3">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" className="w-full bg-slate-700 border border-slate-600 text-white rounded px-3 py-2" />
          <div className="flex gap-2">
            <input type="number" value={maxHp} onChange={(e) => setMaxHp(e.target.value)} placeholder="Max HP" className="w-full bg-slate-700 border border-slate-600 text-white rounded px-3 py-2" />
            <input type="number" value={ac} onChange={(e) => setAc(e.target.value)} placeholder="AC" className="w-full bg-slate-700 border border-slate-600 text-white rounded px-3 py-2" />
            <input type="number" value={dexMod} onChange={(e) => setDexMod(e.target.value)} placeholder="Dex mod" className="w-full bg-slate-700 border border-slate-600 text-white rounded px-3 py-2" />
          </div>
          <input value={manualInit} onChange={(e) => setManualInit(e.target.value)} placeholder="Manual initiative (leave blank to roll)" className="w-full bg-slate-700 border border-slate-600 text-white rounded px-3 py-2" />
          <div className="flex gap-2">
            <button onClick={add} className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded">Add</button>
            <button onClick={() => setShowForm(false)} className="flex-1 bg-slate-600 hover:bg-slate-500 text-white px-4 py-2 rounded">Cancel</button>
          </div>
        </div>
      )}

      {/* ----  list  ---- */}
      {combatants.length === 0 && <p className="text-gray-400 text-center py-8">No combatants yet.</p>}

      {combatants.map((c, idx) => {
        const isActive = c.id === activeId;
        const pct = barPct(c.currentHp, c.maxHp);
        const barColor = pct <= 0 ? 'bg-red-600' : pct <= 50 ? 'bg-yellow-500' : 'bg-green-500';
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
                  <h3 className="text-white font-bold">{c.name}</h3>
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
          </div>
        );
      })}
    </div>
  );
}
