import { useState, useEffect } from 'react';
import { storage, type Character } from '../lib/storage';
import { Plus, Edit2, Trash2, User, Users, Skull, X, Save, Download, UploadCloud } from 'lucide-react';

/* ---------- 5e field list ---------- */
const EMPTY_5E_SHEET = {
  name: '',
  type: 'player' as 'player' | 'npc' | 'monster',
  maxHp: '',
  armorClass: '',
  dexModifier: '',
  level: '',
  notes: '',

  /* basics */
  race: '',
  class: '',
  background: '',
  alignment: '',

  /* abilities */
  str: '',
  dex: '',
  con: '',
  int: '',
  wis: '',
  cha: '',

  /* derived */
  proficiencyBonus: '',
  speed: '',
  hitDice: '',

  /* combat */
  initiativeBonus: '',
  spellSaveDC: '',
  attackBonus: '',

  /* skills (proficient true/false) */
  skills: Object.fromEntries(
    [
      'Acrobatics', 'Animal Handling', 'Arcana', 'Athletics', 'Deception',
      'History', 'Insight', 'Intimidation', 'Investigation', 'Medicine',
      'Nature', 'Perception', 'Performance', 'Persuasion', 'Religion',
      'Sleight of Hand', 'Stealth', 'Survival'
    ].map(s => [s, false])
  ) as Record<string, boolean>,

  /* equipment & features */
  equipment: '',
  featuresTraits: '',
  spells: '',
  gold: '',
};

export function CharacterLibrary() {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  /* form holds EVERYTHING */
  const [formData, setFormData] = useState(EMPTY_5E_SHEET);

  useEffect(() => {
    loadCharacters();
  }, []);

  const loadCharacters = () => setCharacters(storage.getCharacters());

  const resetForm = () => {
    setFormData(EMPTY_5E_SHEET);
    setEditingId(null);
    setShowForm(false);
  };

  /* ------------- export txt ------------- */
  const exportTxt = (ch: Character & Record<string, any>) => {
    const lines: string[] = [];
    lines.push(`=== ${ch.name} ===`);
    lines.push(`Race: ${ch.race || '-'}  |  Class: ${ch.class || '-'}`);
    lines.push(`Level: ${ch.level || '-'}  |  Background: ${ch.background || '-'}`);
    lines.push(`Alignment: ${ch.alignment || '-'}`);
    lines.push('');
    lines.push(`HP: ${ch.maxHp}  |  AC: ${ch.armorClass}  |  Speed: ${ch.speed || '-'}`);
    lines.push(`Initiative: ${ch.initiativeBonus || '-'}`);
    lines.push('');
    lines.push('ABILITY SCORES');
    ['str', 'dex', 'con', 'int', 'wis', 'cha'].forEach(ab => {
      const score = (ch as any)[ab] || '-';
      const mod = Math.floor(((parseInt(score as string) || 10) - 10) / 2);
      lines.push(`${ab.toUpperCase()}: ${score}  (mod ${mod >= 0 ? '+' : ''}${mod})`);
    });
    lines.push('');
    const profSkills = Object.entries(ch.skills || {})
      .filter(([, v]) => v)
      .map(([k]) => k);
    lines.push('SKILLS (proficient): ' + (profSkills.length ? profSkills.join(', ') : '—'));
    lines.push('');
    lines.push('EQUIPMENT:');
    lines.push(ch.equipment || '—');
    lines.push('');
    lines.push('FEATURES & TRAITS:');
    lines.push(ch.featuresTraits || '—');
    lines.push('');
    lines.push('SPELLS:');
    lines.push(ch.spells || '—');
    lines.push('');
    lines.push('NOTES:');
    lines.push(ch.notes || '—');

    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${ch.name.replace(/[^a-z0-9]/gi, '_')}_sheet.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  /* ------------- edit ------------- */
  const handleEdit = (character: Character & Record<string, any>) => {
    setFormData({
      ...EMPTY_5E_SHEET,
      ...character,
      maxHp: character.maxHp.toString(),
      armorClass: character.armorClass.toString(),
      dexModifier: character.dexModifier.toString(),
      level: character.level?.toString() || '',
      /* abilities */
      str: character.str?.toString() || '',
      dex: character.dex?.toString() || '',
      con: character.con?.toString() || '',
      int: character.int?.toString() || '',
      wis: character.wis?.toString() || '',
      cha: character.cha?.toString() || '',
      proficiencyBonus: character.proficiencyBonus?.toString() || '',
      speed: character.speed?.toString() || '',
      hitDice: character.hitDice || '',
      initiativeBonus: character.initiativeBonus?.toString() || '',
      spellSaveDC: character.spellSaveDC?.toString() || '',
      attackBonus: character.attackBonus?.toString() || '',
      equipment: character.equipment || '',
      featuresTraits: character.featuresTraits || '',
      spells: character.spells || '',
      gold: character.gold?.toString() || '',
      skills: character.skills || EMPTY_5E_SHEET.skills,
    });
    setEditingId(character.id);
    setShowForm(true);
  };

  /* ------------- save ------------- */
  const handleSubmit = () => {
    if (!formData.name.trim()) return;
    const out: any = {
      name: formData.name,
      type: formData.type,
      maxHp: parseInt(formData.maxHp) || 10,
      armorClass: parseInt(formData.armorClass) || 10,
      dexModifier: parseInt(formData.dexModifier) || 0,
      level: formData.level ? parseInt(formData.level) : undefined,
      notes: formData.notes,

      race: formData.race,
      class: formData.class,
      background: formData.background,
      alignment: formData.alignment,

      str: parseInt(formData.str) || 10,
      dex: parseInt(formData.dex) || 10,
      con: parseInt(formData.con) || 10,
      int: parseInt(formData.int) || 10,
      wis: parseInt(formData.wis) || 10,
      cha: parseInt(formData.cha) || 10,

      proficiencyBonus: parseInt(formData.proficiencyBonus) || 2,
      speed: parseInt(formData.speed) || 30,
      hitDice: formData.hitDice,
      initiativeBonus: parseInt(formData.initiativeBonus) || 0,
      spellSaveDC: parseInt(formData.spellSaveDC) || 0,
      attackBonus: parseInt(formData.attackBonus) || 0,

      skills: formData.skills,
      equipment: formData.equipment,
      featuresTraits: formData.featuresTraits,
      spells: formData.spells,
      gold: parseInt(formData.gold) || 0,
    };

    editingId
      ? storage.updateCharacter(editingId, out)
      : storage.addCharacter(out);

    resetForm();
    loadCharacters();
  };

  const handleDelete = (id: string) => {
    if (!confirm('Delete this character?')) return;
    storage.deleteCharacter(id);
    loadCharacters();
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'player': return <User size={20} className="text-blue-400" />;
      case 'npc': return <Users size={20} className="text-green-400" />;
      case 'monster': return <Skull size={20} className="text-red-400" />;
      default: return null;
    }
  };

  const grouped = {
    player: characters.filter(c => c.type === 'player'),
    npc: characters.filter(c => c.type === 'npc'),
    monster: characters.filter(c => c.type === 'monster'),
  };

  /* ---------- JSON IMPORT ---------- */
  const handleJsonFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const arr = JSON.parse(reader.result as string);
        if (!Array.isArray(arr)) throw new Error('JSON is not an array');
        arr.forEach((raw: any) => {
          // ensure at least a name
          if (!raw.name) return;
          // force type if missing
          const typed: any = { ...raw, type: raw.type || 'monster' };
          storage.addCharacter(typed);
        });
        loadCharacters();
      } catch (err) {
        alert('Invalid JSON file.\n' + err);
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // reset so same file can be re-picked
  };

  /* ---------- big form ---------- */
  const FormSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="mb-4">
      <h4 className="text-sm font-semibold text-gray-300 mb-2">{title}</h4>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">{children}</div>
    </div>
  );

  /* ---------- render ---------- */
  return (
    <div className="max-w-6xl mx-auto p-4">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-3xl font-bold text-white">Character Library</h2>
        <div className="flex items-center gap-3">
          {/* ---------- IMPORT JSON ---------- */}
          <label className="cursor-pointer bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded flex items-center gap-2 text-sm transition-colors">
            <UploadCloud size={16} />
            Import JSON
            <input type="file" accept=".json" onChange={handleJsonFile} className="hidden" />
          </label>

          <button onClick={() => setShowForm(!showForm)} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded flex items-center gap-2 transition-colors">
            <Plus size={20} /> Add Character
          </button>
        </div>
      </div>

      {showForm && (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-white">{editingId ? 'Edit Character' : 'New Character'}</h3>
            <button onClick={resetForm} className="text-gray-400 hover:text-white"><X size={20} /></button>
          </div>

          {/* basic info */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Name" className="input" />
            <input value={formData.race} onChange={e => setFormData({ ...formData, race: e.target.value })} placeholder="Race" className="input" />
            <input value={formData.class} onChange={e => setFormData({ ...formData, class: e.target.value })} placeholder="Class" className="input" />
            <input value={formData.background} onChange={e => setFormData({ ...formData, background: e.target.value })} placeholder="Background" className="input" />
          </div>

          {/* abilities */}
          <FormSection title="Abilities">
            {(['str', 'dex', 'con', 'int', 'wis', 'cha'] as const).map(ab => (
              <input key={ab} type="number" value={(formData as any)[ab]} onChange={e => setFormData({ ...formData, [ab]: e.target.value })} placeholder={ab.toUpperCase()} className="input" />
            ))}
          </FormSection>

          {/* combat */}
          <FormSection title="Combat">
            <input type="number" value={formData.maxHp} onChange={e => setFormData({ ...formData, maxHp: e.target.value })} placeholder="Max HP" className="input" />
            <input type="number" value={formData.armorClass} onChange={e => setFormData({ ...formData, armorClass: e.target.value })} placeholder="AC" className="input" />
            <input type="number" value={formData.initiativeBonus} onChange={e => setFormData({ ...formData, initiativeBonus: e.target.value })} placeholder="Init Bonus" className="input" />
            <input type="number" value={formData.speed} onChange={e => setFormData({ ...formData, speed: e.target.value })} placeholder="Speed" className="input" />
          </FormSection>

          {/* skills */}
          <div className="mb-4">
            <h4 className="text-sm font-semibold text-gray-300 mb-2">Skills (proficient)</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {Object.keys(formData.skills).map(s => (
                <label key={s} className="flex items-center gap-2 text-white cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.skills[s]}
                    onChange={e => setFormData({ ...formData, skills: { ...formData.skills, [s]: e.target.checked } })}
                  />
                  {s}
                </label>
              ))}
            </div>
          </div>

          {/* misc */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <textarea value={formData.equipment} onChange={e => setFormData({ ...formData, equipment: e.target.value })} placeholder="Equipment" className="input h-20" />
            <textarea value={formData.featuresTraits} onChange={e => setFormData({ ...formData, featuresTraits: e.target.value })} placeholder="Features & Traits" className="input h-20" />
          </div>
          <textarea value={formData.spells} onChange={e => setFormData({ ...formData, spells: e.target.value })} placeholder="Spells" className="input h-20 mb-4" />

          <textarea value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} placeholder="Notes" className="input h-20 mb-4" />

          <div className="flex gap-2">
            <button onClick={handleSubmit} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded flex items-center gap-2"><Save size={16} /> {editingId ? 'Update' : 'Add'}</button>
            <button onClick={resetForm} className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded">Cancel</button>
          </div>
        </div>
      )}

      {/* list */}
      <div className="space-y-6">
        {(['player', 'npc', 'monster'] as const).map(type => (
          <div key={type}>
            <h3 className="text-xl font-bold text-white mb-3 capitalize flex items-center gap-2">{getTypeIcon(type)} {type === 'npc' ? 'NPCs' : `${type}s`} ({grouped[type].length})</h3>
            <div className="grid gap-3">
              {grouped[type].length === 0 ? (
                <div className="bg-slate-800 border-2 border-dashed border-slate-700 rounded-lg p-6 text-center"><p className="text-gray-400">No {type}s yet</p></div>
              ) : (
                grouped[type].map(ch => (
                  <div key={ch.id} className="bg-slate-800 border border-slate-700 rounded-lg p-4 hover:border-red-600 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        {getTypeIcon(ch.type)}
                        <div className="flex-1">
                          <h4 className="text-lg font-bold text-white">{ch.name} {ch.level && <span className="text-sm text-gray-400 ml-2">Lvl {ch.level}</span>}</h4>
                          <p className="text-sm text-gray-400 mt-1">HP: {ch.maxHp} | AC: {ch.armorClass} | Init: {ch.initiativeBonus || '0'}</p>
                          <p className="text-sm text-gray-500 mt-1">{ch.race} {ch.class} {ch.notes && `| ${ch.notes}`}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => exportTxt(ch)} className="text-green-400 hover:text-green-300 transition-colors p-2" aria-label="Export txt"><Download size={18} /></button>
                        <button onClick={() => handleEdit(ch)} className="text-blue-400 hover:text-blue-300 transition-colors p-2" aria-label="Edit"><Edit2 size={18} /></button>
                        <button onClick={() => handleDelete(ch.id)} className="text-red-500 hover:text-red-400 transition-colors p-2" aria-label="Delete"><Trash2 size={18} /></button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>

      {/* tiny css helper */}
      <style jsx>{`
        .input {
          @apply w-full bg-slate-700 border border-slate-600 text-white rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-600;
        }
      `}</style>
    </div>
  );
}
