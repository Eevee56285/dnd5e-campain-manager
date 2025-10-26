export type Character = {
  id: string;
  name: string;
  type: 'player' | 'npc' | 'monster';
  maxHp: number;
  armorClass: number;
  dexModifier: number;
  level?: number;
  notes: string;
  createdAt: string;
};

export type Campaign = {
  id: string;
  name: string;
  createdAt: string;
};

export type ActiveCombatant = {
  id: string;
  characterId: string;
  initiative: number;
  currentHp: number;
  tempHp?: number;
  conditions?: string[];
};

export type BattleSession = {
  campaignId: string;
  isActive: boolean;
  combatants: ActiveCombatant[];
  round: number;
  currentTurn: number;
};

const STORAGE_KEYS = {
  CHARACTERS: 'dnd_characters',
  CAMPAIGNS: 'dnd_campaigns',
  BATTLE: 'dnd_battle_session',
};

export const storage = {
  getCharacters(): Character[] {
    const data = localStorage.getItem(STORAGE_KEYS.CHARACTERS);
    return data ? JSON.parse(data) : [];
  },

  saveCharacters(characters: Character[]) {
    localStorage.setItem(STORAGE_KEYS.CHARACTERS, JSON.stringify(characters));
  },

  addCharacter(character: Omit<Character, 'id' | 'createdAt'>): Character {
    const characters = this.getCharacters();
    const newCharacter: Character = {
      ...character,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    characters.push(newCharacter);
    this.saveCharacters(characters);
    return newCharacter;
  },

  updateCharacter(id: string, updates: Partial<Character>) {
    const characters = this.getCharacters();
    const index = characters.findIndex((c) => c.id === id);
    if (index !== -1) {
      characters[index] = { ...characters[index], ...updates };
      this.saveCharacters(characters);
    }
  },

  deleteCharacter(id: string) {
    const characters = this.getCharacters().filter((c) => c.id !== id);
    this.saveCharacters(characters);
  },

  getCampaigns(): Campaign[] {
    const data = localStorage.getItem(STORAGE_KEYS.CAMPAIGNS);
    return data ? JSON.parse(data) : [];
  },

  saveCampaigns(campaigns: Campaign[]) {
    localStorage.setItem(STORAGE_KEYS.CAMPAIGNS, JSON.stringify(campaigns));
  },

  addCampaign(name: string): Campaign {
    const campaigns = this.getCampaigns();
    const newCampaign: Campaign = {
      id: crypto.randomUUID(),
      name,
      createdAt: new Date().toISOString(),
    };
    campaigns.push(newCampaign);
    this.saveCampaigns(campaigns);
    return newCampaign;
  },

  deleteCampaign(id: string) {
    const campaigns = this.getCampaigns().filter((c) => c.id !== id);
    this.saveCampaigns(campaigns);
  },

  getBattleSession(): BattleSession | null {
    const data = localStorage.getItem(STORAGE_KEYS.BATTLE);
    return data ? JSON.parse(data) : null;
  },

  saveBattleSession(session: BattleSession) {
    localStorage.setItem(STORAGE_KEYS.BATTLE, JSON.stringify(session));
  },

  clearBattleSession() {
    localStorage.removeItem(STORAGE_KEYS.BATTLE);
  },
};
