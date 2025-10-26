import { useState, useEffect } from 'react';
import { storage, type Campaign } from '../lib/storage';
import { Plus, Swords, Trash2 } from 'lucide-react';

type CampaignListProps = {
  onSelectCampaign: (campaignId: string, campaignName: string) => void;
};

export function CampaignList({ onSelectCampaign }: CampaignListProps) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [newCampaignName, setNewCampaignName] = useState('');
  const [showInput, setShowInput] = useState(false);

  useEffect(() => {
    loadCampaigns();
  }, []);

  const loadCampaigns = () => {
    setCampaigns(storage.getCampaigns());
  };

  const createCampaign = () => {
    if (!newCampaignName.trim()) return;
    storage.addCampaign(newCampaignName);
    setNewCampaignName('');
    setShowInput(false);
    loadCampaigns();
  };

  const deleteCampaign = (id: string) => {
    if (!confirm('Delete this campaign?')) return;
    storage.deleteCampaign(id);
    loadCampaigns();
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-4xl font-bold text-white flex items-center gap-3">
          <Swords size={36} className="text-red-600" />
          D&D Campaign Manager
        </h1>
        <button
          onClick={() => setShowInput(!showInput)}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded flex items-center gap-2 transition-colors"
        >
          <Plus size={20} />
          New Campaign
        </button>
      </div>

      {showInput && (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 mb-6">
          <input
            type="text"
            value={newCampaignName}
            onChange={(e) => setNewCampaignName(e.target.value)}
            placeholder="Campaign Name"
            onKeyDown={(e) => e.key === 'Enter' && createCampaign()}
            className="w-full bg-slate-700 border border-slate-600 text-white rounded px-3 py-2 mb-3 focus:outline-none focus:ring-2 focus:ring-red-600"
            autoFocus
          />
          <div className="flex gap-2">
            <button
              onClick={createCampaign}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded transition-colors"
            >
              Create
            </button>
            <button
              onClick={() => {
                setShowInput(false);
                setNewCampaignName('');
              }}
              className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="grid gap-4">
        {campaigns.length === 0 ? (
          <div className="bg-slate-800 border-2 border-dashed border-slate-700 rounded-lg p-12 text-center">
            <Swords size={48} className="mx-auto mb-4 text-slate-600" />
            <p className="text-gray-400 text-lg">No campaigns yet. Create one to get started!</p>
          </div>
        ) : (
          campaigns.map((campaign) => (
            <div
              key={campaign.id}
              className="bg-slate-800 border border-slate-700 rounded-lg p-6 hover:border-red-600 transition-colors"
            >
              <div className="flex items-center justify-between">
                <button
                  onClick={() => onSelectCampaign(campaign.id, campaign.name)}
                  className="flex-1 text-left"
                >
                  <h3 className="text-2xl font-bold text-white mb-2">{campaign.name}</h3>
                  <p className="text-gray-400 text-sm">
                    Created {new Date(campaign.createdAt).toLocaleDateString()}
                  </p>
                </button>
                <button
                  onClick={() => deleteCampaign(campaign.id)}
                  className="text-red-500 hover:text-red-400 transition-colors p-2"
                  aria-label="Delete campaign"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
