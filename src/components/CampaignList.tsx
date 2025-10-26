import { useState, useEffect } from 'react';
import { Plus, Swords, Trash2 } from 'lucide-react';
import { storage, type Campaign } from '../lib/multiplayerStorage';

type Props = { onSelectCampaign: (id: string, name: string) => void };

export function CampaignList({ onSelectCampaign }: Props) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [name, setName] = useState('');
  const [show, setShow] = useState(false);

  useEffect(() => setCampaigns(storage.getCampaigns()), []);

  const create = () => {
    if (!name.trim()) return;
    storage.addCampaign(name.trim());
    setName('');
    setShow(false);
    setCampaigns(storage.getCampaigns());
  };

  const remove = (id: string) => {
    if (!confirm('Delete?')) return;
    storage.deleteCampaign(id);
    setCampaigns(storage.getCampaigns());
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-4xl font-bold text-white flex items-center gap-3">
          <Swords size={36} className="text-red-600" /> D&D Campaign Manager
        </h1>
        <button
          onClick={() => setShow((s) => !s)}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded flex items-center gap-2"
        >
          <Plus size={20} /> New Campaign
        </button>
      </div>

      {show && (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 mb-6">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && create()}
            placeholder="Campaign Name"
            className="w-full bg-slate-700 border border-slate-600 text-white rounded px-3 py-2 mb-3 focus:ring-2 focus:ring-red-600"
            autoFocus
          />
          <div className="flex gap-2">
            <button onClick={create} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded">Create</button>
            <button onClick={() => { setShow(false); setName(''); }} className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded">Cancel</button>
          </div>
        </div>
      )}

      {campaigns.length === 0 ? (
        <div className="bg-slate-800 border-2 border-dashed border-slate-700 rounded-lg p-12 text-center">
          <Swords size={48} className="mx-auto mb-4 text-slate-600" />
          <p className="text-gray-400 text-lg">No campaigns yet. Create one to start!</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {campaigns.map((c) => (
            <div key={c.id} className="bg-slate-800 border border-slate-700 rounded-lg p-6 hover:border-red-600 transition-colors">
              <div className="flex items-center justify-between">
                <button onClick={() => onSelectCampaign(c.id, c.name)} className="flex-1 text-left">
                  <h3 className="text-2xl font-bold text-white mb-2">{c.name}</h3>
                  <p className="text-gray-400 text-sm">Created {new Date(c.createdAt).toLocaleDateString()}</p>
                </button>
                <button onClick={() => remove(c.id)} className="text-red-500 hover:text-red-400 p-2" aria-label="Delete">
                  <Trash2 size={20} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
