export type MultiplayerCampaign = {
  id: string;
  name: string;
  createdAt: number;
  joinCode?: string;
  ownerId: string;
};

let campaigns: MultiplayerCampaign[] = [];

export const multiplayerStorage = {
  getCampaignsForUser: (userId: string) =>
    campaigns.filter((c) => c.ownerId === userId),
  addCampaign: (name: string, ownerId: string) => {
    const newCampaign = {
      id: crypto.randomUUID(),
      name,
      createdAt: Date.now(),
      joinCode: Math.random().toString(36).substring(2, 8),
      ownerId,
    };
    campaigns.push(newCampaign);
  },
  deleteCampaign: (id: string) => {
    campaigns = campaigns.filter((c) => c.id !== id);
  },
  getCampaignByJoinCode: (code: string) =>
    campaigns.find((c) => c.joinCode === code),
};
