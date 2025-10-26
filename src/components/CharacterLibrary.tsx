import { useState, useEffect } from 'react';
import { storage, type Character } from '../lib/storage';
import { Plus, Edit2, Trash2, User, Users, Skull, X, Save } from 'lucide-react';

export function CharacterLibrary() {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'player' as 'player' | 'npc' | 'monster',
    maxHp: '',
    armorClass: '',
    dexModifier: '',
    level: '',
    notes: '',
  });

  useEffect(() => {
    loadCharacters();
  }, []);

  const loadCharacters = () => {
    setCharacters(storage.getCharacters());
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'player',
      maxHp: '',
      armorClass: '',
      dexModifier: '',
      level: '',
      notes: '',
    });
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (character: Character) => {
    setFormData({
      name: character.name,
      type: character.type,
      maxHp: character.maxHp.toString(),
      armorClass: character.armorClass.toString(),
      dexModifier: character.dexModifier.toString(),
      level: character.level?.toString() || '',
      notes: character.notes,
    });
    setEditingId(character.id);
    setShowForm(true);
  };

  const handleSubmit = () => {
    if (!formData.name.trim()) return;

    const characterData = {
      name: formData.name,
      type: formData.type,
      maxHp: parseInt(formData.maxHp) || 10,
      armorClass: parseInt(formData.armorClass) || 10,
      dexModifier: parseInt(formData.dexModifier) || 0,
      level: formData.level ? parseInt(formData.level) : undefined,
      notes: formData.notes,
    };

    if (editingId) {
      storage.updateCharacter(editingId, characterData);
    } else {
      storage.addCharacter(characterData);
    }

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
      case 'player':
        return <User size={20} className="text-blue-400" />;
      case 'npc':
        return <Users size={20} className="text-green-400" />;
      case 'monster':
        return <Skull size={20} className="text-red-400" />;
    }
  };

  const groupedCharacters = {
    player: characters.filter((c) => c.type === 'player'),
    npc: characters.filter((c) => c.type === 'npc'),
    monster: characters.filter((c) => c.type === 'monster'),
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-3xl font-bold text-white">Character Library</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded flex items-center gap-2 transition-colors"
        >
          <Plus size={20} />
          Add Character
        </button>
      </div>

      {showForm && (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-white">
              {editingId ? 'Edit Character' : 'New Character'}
            </h3>
            <button onClick={resetForm} className="text-gray-400 hover:text-white">
              <X size={20} />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-slate-700 border border-slate-600 text-white rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-600"
                placeholder="Character name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Type</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    value="player"
                    checked={formData.type === 'player'}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                  />
                  <User size={16} className="text-blue-400" />
                  <span className="text-white">Player</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    value="npc"
                    checked={formData.type === 'npc'}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                  />
                  <Users size={16} className="text-green-400" />
                  <span className="text-white">NPC</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    value="monster"
                    checked={formData.type === 'monster'}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                  />
                  <Skull size={16} className="text-red-400" />
                  <span className="text-white">Monster</span>
                </label>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Max HP</label>
                <input
                  type="number"
                  value={formData.maxHp}
                  onChange={(e) => setFormData({ ...formData, maxHp: e.target.value })}
                  className="w-full bg-slate-700 border border-slate-600 text-white rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-600"
                  placeholder="10"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Armor Class</label>
                <input
                  type="number"
                  value={formData.armorClass}
                  onChange={(e) => setFormData({ ...formData, armorClass: e.target.value })}
                  className="w-full bg-slate-700 border border-slate-600 text-white rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-600"
                  placeholder="10"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">DEX Modifier</label>
                <input
                  type="number"
                  value={formData.dexModifier}
                  onChange={(e) => setFormData({ ...formData, dexModifier: e.target.value })}
                  className="w-full bg-slate-700 border border-slate-600 text-white rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-600"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Level (Optional)</label>
                <input
                  type="number"
                  value={formData.level}
                  onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                  className="w-full bg-slate-700 border border-slate-600 text-white rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-600"
                  placeholder="1"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full bg-slate-700 border border-slate-600 text-white rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-600 h-20"
                placeholder="Class, race, abilities, etc."
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleSubmit}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded flex items-center gap-2 transition-colors"
              >
                <Save size={16} />
                {editingId ? 'Update' : 'Add'}
              </button>
              <button
                onClick={resetForm}
                className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {(['player', 'npc', 'monster'] as const).map((type) => (
          <div key={type}>
            <h3 className="text-xl font-bold text-white mb-3 capitalize flex items-center gap-2">
              {getTypeIcon(type)}
              {type === 'npc' ? 'NPCs' : `${type}s`} ({groupedCharacters[type].length})
            </h3>
            <div className="grid gap-3">
              {groupedCharacters[type].length === 0 ? (
                <div className="bg-slate-800 border-2 border-dashed border-slate-700 rounded-lg p-6 text-center">
                  <p className="text-gray-400">No {type}s added yet</p>
                </div>
              ) : (
                groupedCharacters[type].map((character) => (
                  <div
                    key={character.id}
                    className="bg-slate-800 border border-slate-700 rounded-lg p-4 hover:border-red-600 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        {getTypeIcon(character.type)}
                        <div className="flex-1">
                          <h4 className="text-lg font-bold text-white">
                            {character.name}
                            {character.level && (
                              <span className="text-sm text-gray-400 ml-2">Level {character.level}</span>
                            )}
                          </h4>
                          <p className="text-sm text-gray-400 mt-1">
                            HP: {character.maxHp} | AC: {character.armorClass} | DEX: {character.dexModifier >= 0 ? '+' : ''}
                            {character.dexModifier}
                          </p>
                          {character.notes && (
                            <p className="text-sm text-gray-500 mt-1">{character.notes}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(character)}
                          className="text-blue-400 hover:text-blue-300 transition-colors p-2"
                          aria-label="Edit character"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(character.id)}
                          className="text-red-500 hover:text-red-400 transition-colors p-2"
                          aria-label="Delete character"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
