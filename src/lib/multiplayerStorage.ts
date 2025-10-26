export type Campaign = {
  id: string;
  name: string;
  createdAt: number;
};

const KEY = 'dnd_campaigns';

export const storage = {
  getCampaigns(): Campaign[] {
    return JSON.parse(localStorage.getItem(KEY) || '[]');
  },
  addCampaign(name: string) {
    const list = this.getCampaigns();
    list.push({ id: crypto.randomUUID(), name, createdAt: Date.now() });
    localStorage.setItem(KEY, JSON.stringify(list));
  },
  deleteCampaign(id: string) {
    const list = this.getCampaigns().filter((c) => c.id !== id);
    localStorage.setItem(KEY, JSON.stringify(list));
  },
};
