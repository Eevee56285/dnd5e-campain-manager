import { useState, useEffect } from 'react';
import { Plus, Heart, Trash2, Edit3, Check, X, ChevronDown } from 'lucide-react';

type HealthTrackerProps = { campaignId: string };
type Character = { id: string; name: string; maxHp: number };
type Combatant = {
  id: string;
  name: string;
  maxHp: number;
  currentHp: number;
  tempHp: number;
  conditions: string[];
};

/* ---------- D&D 5e conditions + emoji ---------- */
const CONDITIONS = [
  { name: 'Blinded', emoji: '🙈' },
  { name: 'Charmed', emoji: '💕' },
  { name: 'Deafened', emoji: '🦻' },
  { name: 'Frightened', emoji: '😱' },
  { name: 'Grappled', emoji: '🤼' },
  { name: 'Incapacitated', emoji: '😵' },
  { name: 'Invisible', emoji: '👻' },
  { name: 'Paralyzed', emoji: '🧊' },
  { name: 'Petrified', emoji: '🗿' },
  { name: 'Poisoned', emoji: '🧪' },
  { name: 'Prone', emoji: '🛌' },
  { name: 'Restrained', emoji: '🔗' },
  { name: 'Stunned', emoji: '⚡' },
  { name: 'Unconscious (auto)', emoji: '😴' },
  { name: 'Exhaustion', emoji: '😩' },
];

/* ---------- helpers ---------- */
const HEALTH_KEY = (id: string) => `dnd_health_${id}`;
const CHAR_KEY   = 'dnd_characters';

const barPct = (cur: number, max: number) =>
  Math.max(0, Math.min(100, ((cur + max) / (max * 2)) * 100));

const barColour = (pct: number) =>
  pct <= 0 ? 'bg-red-600' : pct <= 50 ? 'bg-yellow-500' : 'bg-green-500';

export function HealthTracker({ campaignId }: HealthTrackerProps) {
  const [combatants, setCombatants] = useState<Combatant[]>([]);
  const [library, setLibrary]       = useState<Character[]>([]);
  const [showLib, setShowLib]       = useState(false);
  const [adding, setAdding]         = useState(false);
  const [newName, setNewName]       = useState('');
  const [newMax, setNewMax]         = useState('');
  const [editing, setEditing]       = useState<string | null>(null);
  const [hpEdit, setHpEdit]         = useState('');
  const [dropdown, setDropdown]     = useState<string | null>(null);

  /* ---------- load ---------- */
  useEffect(() => {
    const raw = localStorage.getItem(HEALTH_KEY(campaignId));
    if (raw) setCombatants(JSON.parse(raw));
    const libRaw = localStorage.getItem(CHAR_KEY);
    if (libRaw) setLibrary(JSON.parse(libRaw));
  }, [campaignId]);

  useEffect(() => {
    localStorage.setItem(HEALTH_KEY(campaignId), JSON.stringify(combatants));
  }, [combatants, campaignId]);

  /* ---------- library add ---------- */
  const addFromLibrary = (c: Character) => {
    if (combatants.some((x) => x.name === c.name)) return;
    setCombatants((l) => [
      ...l,
      { id: crypto.randomUUID(), name: c.name, maxHp: c.maxHp, currentHp: c.maxHp, tempHp: 0, conditions: [] },
    ]);
  };

  /* ---------- manual add ---------- */
  const addManual = () => {
    const max = parseInt(newMax) || 10;
    if (!newName.trim()) return;
    setCombatants((l) => [
      ...l,
      { id: crypto.randomUUID(), name: newName.trim(), maxHp: max, currentHp: max, tempHp: 0, conditions: [] },
    ]);
    setNewName(''); setNewMax(''); setAdding(false);
  };

  /* ---------- HP edit ---------- */
  const startEdit = (c: Combatant) => { setEditing(c.id); setHpEdit(String(c.currentHp)); };
  const saveEdit  = (id: string) => {
    const val = parseInt(hpEdit) || 0;
    setCombatants((l) => l.map((x) => (x.id === id ? { ...x, currentHp: val } : x)));
    setEditing(null);
  };

  /* ---------- damage / heal (negative allowed to -max) ---------- */
  const apply = (id: string, amount: number) =>
    setCombatants((l) =>
      l.map((c) =>
        c.id === id
          ? { ...c, currentHp: Math.max(-c.maxHp, c.currentHp + amount) }
          : c
      )
    );

  const setTemp = (id: string, n: number) =>
    setCombatants((l) => l.map((c) => (c.id === id ? { ...c, tempHp: n } : c)));

  const remove = (id: string) => setCombatants((l) => l.filter((c) => c.id !== id));

  /* ---------- status badge ---------- */
  const statusBadge = (c: Combatant) => {
    if (c.currentHp <= -c.maxHp) return { text: 'Dead', color: 'bg-red-700' };
    if (c.currentHp === 0) return { text: 'Unconscious', color: 'bg-gray-700' };
    if (c.currentHp <= Math.floor(c.maxHp / 2)) return { text: 'Bloodied', color: 'bg-orange-600' };
    return { text: 'Healthy', color: 'bg-green-700' };
  };

  /* ---------- condition add ---------- */
  const addCondition = (id: string, cond: { name: string; emoji: string }) => {
    setCombatants((l) =>
      l.map((c) =>
        c.id === id && !c.conditions.includes(cond.name)
          ? { ...c, conditions: [...c.conditions, cond.name] }
          : c
      )
    );
    setDropdown(null);
  };

  const removeCondition = (id: string, name: string) =>
    setCombatants((l) =>
      l.map((c) =>
        c.id === id ? { ...c, conditions: c.conditions.filter((x) => x !== name) } : c
      )
    );

  /* ---------- render ---------- */
  return (
    <div className="space-y-4">
      {/* ----  library row  ---- */}
      {library.length > 0 && (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">Add from Library</span>
            <button onClick={() => setShowLib((s) => !s)} className="text-gray-400 hover:text-white">
              {showLib ? <X size={16} /> : <Plus size={16} />}
            </button>
          </div>
          {showLib && (
            <div className="flex flex-wrap gap-2">
              {library.map((c) => (
                <div key={c.id} className="bg-slate-700 rounded px-3 py-2 flex items-center gap-2 text-sm">
                  <span className="text-white">{c.name}</span>
                  <span className="text-gray-400">({c.maxHp} HP)</span>
                  <button onClick={() => addFromLibrary(c)} className="text-green-400 hover:text-green-300">
                    <Plus size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ----  manual add  ---- */}
      {!adding ? (
        <button
          onClick={() => setAdding(true)}
          className="w-full bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded flex items-center justify-center gap-2"
        >
          <Plus size={18} /> Add Character
        </button>
      ) : (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-3 flex flex-wrap items-center gap-2">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Name"
            className="flex-1 bg-slate-700 border border-slate-600 text-white rounded px-3 py-2 focus:ring-2 focus:ring-red-600"
          />
          <input
            type="number"
            value={newMax}
            onChange={(e) => setNewMax(e.target.value)}
            placeholder="Max HP"
            className="w-24 bg-slate-700 border border-slate-600 text-white rounded px-3 py-2 focus:ring-2 focus:ring-red-600"
          />
          <button onClick={addManual} className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded"><Check size={16} /></button>
          <button onClick={() => { setAdding(false); setNewName(''); setNewMax(''); }} className="bg-slate-600 hover:bg-slate-500 text-white px-3 py-2 rounded"><X size={16} /></button>
        </div>
      )}

      {/* ----  tracker cards  ---- */}
      {combatants.length === 0 && !adding && <p className="text-gray-400 text-center py-8">No characters in tracker.</p>}

      {combatants.map((c) => {
        const pct = barPct(c.currentHp, c.maxHp);
        const barColor = pct <= 0 ? 'bg-red-600' : pct <= 50 ? 'bg-yellow-500' : 'bg-green-500';
        const badge = statusBadge(c);
        return (
          <div key={c.id} className="bg-slate-800 border border-slate-700 rounded-lg p-4 space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-white font-bold">{c.name}</h3>
              <button onClick={() => remove(c.id)} className="text-red-500 hover:text-red-400"><Trash2 size={16} /></button>
            </div>

            {/*  status badge  */}
            <div className={`inline-block px-2 py-1 rounded text-xs text-white ${badge.color}`}>{badge.text}</div>

            {/*  HP bar with buttons on the right  */}
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-slate-700 rounded-full h-6 overflow-hidden relative">
                <div
                  className={`h-6 ${barColor} transition-all duration-300 ease-out`}
                  style={{ width: `${pct}%` }}
                />
                <div className="absolute inset-0 flex items-center justify-center text-white text-xs font-semibold">
                  {c.currentHp} / {c.maxHp} HP
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button onClick={() => apply(c.id, -1)} className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm">-1</button>
                <button onClick={() => apply(c.id, 1)} className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm">+1</button>
              </div>
            </div>

            {c.tempHp > 0 && <div className="text-blue-400 text-sm">+{c.tempHp} temp</div>}

            {/*  any-amount + edit + temp  */}
            <div className="flex items-center gap-2">
              {editing === c.id ? (
                <>
                  <input
                    value={hpEdit}
                    onChange={(e) => setHpEdit(e.target.value)}
                    className="w-20 bg-slate-700 border border-slate-600 text-white rounded px-2 py-1 text-sm"
                  />
                  <button onClick={() => saveEdit(c.id)} className="text-green-400"><Check size={14} /></button>
                  <button onClick={() => setEditing(null)} className="text-red-400"><X size={14} /></button>
                </>
              ) : (
                <>
                  <input
                    type="number"
                    placeholder="Any #"
                    className="w-20 bg-slate-700 border border-slate-600 text-white rounded px-2 py-1 text-sm"
                    onKeyDown={(e) => {
                      const val = parseInt((e.target as HTMLInputElement).value);
                      if (Number.isNaN(val)) return;
                      if (e.key === 'Enter') {
                        apply(c.id, val);
                        (e.target as HTMLInputElement).value = '';
                      }
                    }}
                  />
                  <button onClick={() => startEdit(c)} className="text-gray-400 hover:text-white"><Edit3 size={14} /></button>
                  <input
                    type="number"
                    value={c.tempHp || ''}
                    onChange={(e) => setTemp(c.id, parseInt(e.target.value) || 0)}
                    placeholder="Temp"
                    className="w-20 bg-slate-700 border border-slate-600 text-white rounded px-2 py-1 text-sm"
                  />
                </>
              )}
            </div>

            {/*  condition chips  */}
            <div className="flex flex-wrap items-center gap-2 mt-2">
              {c.conditions.map((cond) => {
                const emo = CONDITIONS.find((x) => x.name === cond)?.emoji || '❓';
                return (
                  <span
                    key={cond}
                    className="bg-slate-700 border border-slate-600 rounded-full px-2 py-1 text-xs text-white flex items-center gap-1 animate-fadeIn"
                  >
                    <span>{emo}</span>
                    <span>{cond}</span>
                    <button onClick={() => removeCondition(c.id, cond)} className="text-red-400 hover:text-red-300">
                      <X size={12} />
                    </button>
                  </span>
                );
              })}

              {/*  add condition dropdown  */}
              <div className="relative">
                <button
                  onClick={() => setDropdown(dropdown === c.id ? null : c.id)}
                  className="bg-slate-700 border border-slate-600 rounded-full px-2 py-1 text-xs text-white flex items-center gap-1 hover:bg-slate-600"
                >
                  <Plus size={12} />
                  <ChevronDown size={12} />
                </button>
                {dropdown === c.id && (
                  <div className="absolute left-0 mt-1 w-48 bg-slate-800 border border-slate-700 rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
                    {CONDITIONS.map((cond) => (
                      <button
                        key={cond.name}
                        onClick={() => addCondition(c.id, cond)}
                        className="w-full text-left px-3 py-2 text-sm text-white hover:bg-slate-700 flex items-center gap-2"
                      >
                        <span>{cond.emoji}</span>
                        <span>{cond.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
