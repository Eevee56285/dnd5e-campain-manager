import { useState, useEffect } from 'react';
import { Plus, Heart, Trash2, Edit3, Check, X } from 'lucide-react';

type HealthTrackerProps = {
  campaignId: string;
};

type Combatant = {
  id: string;
  name: string;
  maxHp: number;
  currentHp: number;
  tempHp: number;
  conditions: string[];
};

const KEY = (id: string) => `dnd_health_${id}`;

export function HealthTracker({ campaignId }: HealthTrackerProps) {
  const [combatants, setCombatants] = useState<Combatant[]>([]);

  /* ---- load / save ---- */
  useEffect(() => {
    const raw = localStorage.getItem(KEY(campaignId));
    if (raw) setCombatants(JSON.parse(raw));
  }, [campaignId]);

  useEffect(() => {
    localStorage.setItem(KEY(campaignId), JSON.stringify(combatants));
  }, [combatants, campaignId]);

  /* ---- manual add ---- */
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newMax, setNewMax] = useState('');

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
    setNewName('');
    setNewMax('');
    setAdding(false);
  };

  /* ---- edit HP ---- */
  const [editing, setEditing] = useState<string | null>(null);
  const [hpEdit, setHpEdit] = useState('');

  const startEdit = (c: Combatant) => {
    setEditing(c.id);
    setHpEdit(String(c.currentHp));
  };

  const saveEdit = (id: string) => {
    const val = parseInt(hpEdit) || 0;
    setCombatants((list) =>
      list.map((x) => (x.id === id ? { ...x, currentHp: val } : x))
    );
    setEditing(null);
  };

  /* ---- damage / heal / temp ---- */
  const applyDamage = (id: string, amount: number) =>
    setCombatants((list) =>
      list.map((c) =>
        c.id === id
          ? { ...c, currentHp: Math.max(0, c.currentHp - amount) }
          : c
      )
    );

  const applyHeal = (id: string, amount: number) =>
    setCombatants((list) =>
      list.map((c) =>
        c.id === id
          ? { ...c, currentHp: Math.min(c.maxHp, c.currentHp + amount) }
          : c
      )
    );

  const setTemp = (id: string, amount: number) =>
    setCombatants((list) =>
      list.map((c) => (c.id === id ? { ...c, tempHp: amount } : c))
    );

  const remove = (id: string) =>
    setCombatants((list) => list.filter((c) => c.id !== id));

  /* ---- render ---- */
  return (
    <div className="space-y-4">
      {/* ---- manual add bar ---- */}
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

      {/* ---- list ---- */}
      {combatants.length === 0 && !adding && (
        <p className="text-gray-400 text-center py-8">No characters added yet.</p>
      )}

      {combatants.map((c) => (
        <div key={c.id} className="bg-slate-800 border border-slate-700 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-white font-bold">{c.name}</h3>
              <div className="flex items-center gap-3 text-sm mt-1">
                <span className="text-gray-400">HP</span>
                {editing === c.id ? (
                  <>
                    <input
                      value={hpEdit}
                      onChange={(e) => setHpEdit(e.target.value)}
                      className="w-16 bg-slate-700 border border-slate-600 text-white rounded px-2 py-1 text-center"
                    />
                    <button onClick={() => saveEdit(c.id)} className="text-green-400"><Check size={14} /></button>
                    <button onClick={() => setEditing(null)} className="text-red-400"><X size={14} /></button>
                  </>
                ) : (
                  <>
                    <span className={c.currentHp <= 0 ? 'text-red-400' : 'text-green-400'}>
                      {c.currentHp} / {c.maxHp}
                    </span>
                    <button onClick={() => startEdit(c)} className="text-gray-400 hover:text-white"><Edit3 size={14} /></button>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* damage / heal */}
              <button onClick={() => applyDamage(c.id, 5)} className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded text-xs">-5</button>
              <button onClick={() => applyHeal(c.id, 5)} className="bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded text-xs">+5</button>

              {/* temp HP */}
              <input
                type="number"
                value={c.tempHp || ''}
                onChange={(e) => setTemp(c.id, parseInt(e.target.value) || 0)}
                placeholder="Temp"
                className="w-16 bg-slate-700 border border-slate-600 text-white rounded px-2 py-1 text-center text-xs"
              />

              <button onClick={() => remove(c.id)} className="text-red-500 hover:text-red-400"><Trash2 size={16} /></button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
