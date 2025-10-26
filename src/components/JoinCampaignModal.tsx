import React, { useState } from 'react';
import { multiplayerStorage } from '../lib/multiplayerStorage';

type JoinCampaignModalProps = {
  onClose: () => void;
  onJoin: (campaign: { id: string; name: string; joinCode?: string }) => void;
};

export function JoinCampaignModal({ onClose, onJoin }: JoinCampaignModalProps) {
  const [joinCode, setJoinCode] = useState('');

  const handleJoin = () => {
    const campaign = multiplayerStorage.getCampaignByJoinCode(joinCode);
    if (campaign) {
      onJoin(campaign);
    } else {
      alert('Invalid join code');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-slate-800 p-6 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-white text-xl font-bold mb-4">Join a Campaign</h2>
        <input
          type="text"
          value={joinCode}
          onChange={(e) => setJoinCode(e.target.value)}
          placeholder="Enter join code"
          className="w-full bg-slate-700 text-white px-3 py-2 rounded mb-4"
        />
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="bg-slate-600 hover:bg-slate-500 text-white px-4 py-2 rounded"
          >
            Cancel
          </button>
          <button
            onClick={handleJoin}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
          >
            Join
          </button>
        </div>
      </div>
    </div>
  );
}
