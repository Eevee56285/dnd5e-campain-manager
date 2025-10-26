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
      <button onClick={() => applyDamage(c.id, 1)} className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded text-xs">-1</button>
      <button onClick={() => applyHeal(c.id, 1)} className="bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded text-xs">+1</button>

      {/*  any-amount input  */}
      <input
        type="number"
        placeholder="#"
        className="w-14 bg-slate-700 border border-slate-600 text-white rounded px-2 py-1 text-center text-xs"
        onKeyDown={(e) => {
          const val = parseInt((e.target as HTMLInputElement).value);
          if (Number.isNaN(val)) return;
          if (e.key === 'Enter') {
            val < 0 ? applyDamage(c.id, -val) : applyHeal(c.id, val);
            (e.target as HTMLInputElement).value = '';
          }
        }}
      />

      <button onClick={() => startEdit(c)} className="text-gray-400 hover:text-white"><Edit3 size={14} /></button>

      {/*  temp HP  */}
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
