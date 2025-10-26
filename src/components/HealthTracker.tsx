import { useState, useEffect } from 'react';
import { Plus, Heart, Trash2, Edit3, Check, X } from 'lucide-react';

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

const HEALTH_KEY  = (id: string) => `dnd_health_${id}`;
const CHAR_KEY    = 'dnd_characters';

export function HealthTracker({ campaignId }: HealthTrackerProps) {
  const [combatants, setCombatants] = useState<Combatant[]>([]);
  const [library, setLibrary]       = useState<Character[]>([]);
  const [showLib, setShowLib]       = useState(false);

  /* ----------  load  ---------- */
  useEffect(() => {
    const raw = localStorage.getItem(HEALTH_KEY(campaignId));
    if (raw) setCombatants(JSON.parse(raw));
    const libRaw = localStorage.getItem(CHAR_KEY);
    if (libRaw) setLibrary(JSON.parse(libRaw));
  }, [campaignId]);

  useEffect(() => {
    localStorage.setItem(HEALTH_KEY(campaignId), JSON.stringify(combatants));
  }, [combatants, campaignId]);

  /* ----------  add from library  ---------- */
  const addFromLibrary = (c: Character) => {
    const exists = combatants.some((x) => x.name === c.name);
    if (exists) return;
    setCombatants((list) => [
      ...list,
      {
        id: crypto.randomUUID(),
        name: c.name,
        maxHp: c.maxHp,
        currentHp: c.maxHp,
        tempHp: 0,
        conditions: [],
      },
    ]);
  };

  /* ----------  manual add  ---------- */
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newMax, setNewMax]   = useState('');

  const addManual = () => {
    const max = parseInt(newMax) || 10;
    if (!newName.trim()) return;
    setCombatants((c) => [
      ...c,
      {
        id: crypto.randomUUID(),
        name: newName.trim(),
        maxHp: max,
        currentHp: max,
        tempHp: 0,
        conditions: [],
      },
    ]);
    setNewName(''); setNewMax(''); setAdding(false);
  };

  /* ----------  HP math  ---------- */
  const [editing, setEditing] = useState<string | null>(null);
  const [hpEdit, setHpEdit]     = useState('');

  const startEdit = (c: Combatant) => {
    setEditing(c.id);
    setHpEdit(String(c.currentHp));
  };

  const saveEdit = (id: string) => {
    const val = parseInt(hpEdit) || 0;
    setCombatants((list) => list.map((x) => (x.id === id ? { ...x, currentHp: val } : x)));
    setEditing(null);
  };

  const applyDamage = (id: string, amount: number) =>
    setCombatants((list) =>
      list.map((c) =>
        c.id === id ? { ...c, currentHp: Math.max(0, c.currentHp - amount) } : c
      )
    );

  const applyHeal = (id: string, amount: number) =>
    setCombatants((list) =>
      list.map((c) =>
        c.id === id ? { ...c, currentHp: Math.min(c.maxHp, c.currentHp + amount) } : c
      )
    );

  const setTemp = (id: string, amount: number) =>
    setCombatants((list) => list.map((c) => (c.id === id ? { ...c, tempHp: amount } : c)));

  const remove = (id: string) => setCombatants((list) => list.filter((c) => c.id !== id));

  /* ----------  render  ---------- */
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

      {/* ----  tracker list  ---- */}
      {combatants.length === 0 && !adding && <p className="text-gray-400 text-center py-8">No characters in tracker.</p>}

      {combatants.map((c) => {
        const pct = Math.max(0, Math.min(100, Math.round((c.currentHp / c.maxHp) * 100)));
        const barColor = pct > 50 ? 'bg-green-500' : pct > 25 ? 'bg-yellow-500' : 'bg-red-500';
        return (
          <div key={c.id} className="bg-slate-800 border border-slate-700 rounded-lg p-4 space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-white font-bold">{c.name}</h3>
              <button onClick={() => remove(c.id)} className="text-red-500 hover:text-red-400"><Trash2 size={16} /></button>
            </div>

            {/*  HP bar  */}
            <div className="w-full bg-slate-700 rounded-full h-4 overflow-hidden">
              <div className={`h-4 ${barColor}`} style={{ width: `${pct}%` }} />
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className={c.currentHp <= 0 ? 'text-red-400' : 'text-gray-300'}>
                {c.currentHp} / {c.maxHp} HP
              </span>
              {c.tempHp > 0 && <span className="text-blue-400">+{c.tempHp} temp</span>}
            </div>

            {/*  controls  */}
            <div className="flex items-center gap-2 mt-2">
              {editing === c.id ? (
                <>
                  <input
                    value={hpEdit}
                    onChange={(e) => setHpEdit(e.target.value)}
                    className="w-16 bg-slate-700 border border-slate-600 text-white rounded px-2 py-1 text-center text-sm"
                  />
                  <button onClick={() => saveEdit(c.id)} className="text-green-400"><Check size={14} /></button>
                  <button onClick={() => setEditing(null)} className="text-red-400"><X size={14} /></button>
                </>
              ) : (
                <>
                  <button onClick={() => startEdit(c)} className="text-gray-400 hover:text-white"><Edit3 size={14} /></button>
                  <button onClick={() => applyDamage(c.id, 5)} className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded text-xs">-5</button>
                  <button onClick={() => applyHeal(c.id, 5)} className="bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded text-xs">+5</button>
                  <input
                    type="number"
                    value={c.tempHp || ''}
                    onChange={(e) => setTemp(c.id, parseInt(e.target.value) || 0)}
                    placeholder="Temp"
                    className="w-16 bg-slate-700 border border-slate-600 text-white rounded px-2 py-1 text-center text-xs"
                  />
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
