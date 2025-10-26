/********************************************************************
 *  SINGLE-FILE "MULTIPLAYER" – STORED IN LOCALSTORAGE
 *  - Every campaign gets a random "room" string (joinCode).
 *  - Any browser that types the code loads the SAME campaign list
 *    from a shared localStorage key.
 *  - Works across tabs on the same machine OR across machines
 *    if you sync the join code (Discord, email, etc.).
 ********************************************************************/

export type MultiplayerCampaign = {
  id: string;
  name: string;
  createdAt: number;
  joinCode: string;
  ownerId: string;
};

/* ---------- helpers ---------- */
const KEY = (code: string) => `dnd_room_${code.toLowerCase()}`;

const loadRoom = (code: string): MultiplayerCampaign[] =>
  JSON.parse(localStorage.getItem(KEY(code)) || '[]');

const saveRoom = (code: string, list: MultiplayerCampaign[]) =>
  localStorage.setItem(KEY(code), JSON.stringify(list));

/* ---------- public API (same names as before) ---------- */
export const multiplayerStorage = {
  /* campaigns this user owns / is in */
  getCampaignsForUser(userId: string) {
    const allRooms = new Set<string>();
    // find every room this user has ever touched
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)!;
      if (k.startsWith('dnd_room_')) allRooms.add(k.replace('dnd_room_', ''));
    }
    const out: MultiplayerCampaign[] = [];
    allRooms.forEach(code => out.push(...loadRoom(code).filter(c => c.ownerId === userId)));
    return out;
  },

  /* create a new campaign in a new room */
  addCampaign(name: string, ownerId: string) {
    const code = Math.random().toString(36).substring(2, 8);
    const campaign: MultiplayerCampaign = {
      id: crypto.randomUUID(),
      name,
      createdAt: Date.now(),
      joinCode: code,
      ownerId
    };
    const room = loadRoom(code);
    room.push(campaign);
    saveRoom(code, room);
    return campaign;
  },

  deleteCampaign(id: string) {
    // remove from whichever room it lives in
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)!;
      if (!k.startsWith('dnd_room_')) continue;
      const room = JSON.parse(localStorage.getItem(k) || '[]') as MultiplayerCampaign[];
      const filtered = room.filter(c => c.id !== id);
      if (filtered.length !== room.length) {
        localStorage.setItem(k, JSON.stringify(filtered));
        break;
      }
    }
  },

  /* join existing room by code */
  getCampaignByJoinCode(code: string) {
    const list = loadRoom(code.toLowerCase());
    return list.length ? list[0] : null; // return first campaign as representative
  },

  /* add current user to an existing room (so it appears in their list) */
  joinCampaign(code: string, userId: string) {
    const room = loadRoom(code.toLowerCase());
    if (!room.length) return null;
    // mark user as participant by storing an empty dummy campaign with their ID
    const dummy: MultiplayerCampaign = {
      id: crypto.randomUUID(),
      name: 'Joined Room',
      createdAt: Date.now(),
      joinCode: code.toLowerCase(),
      ownerId: userId
    };
    room.push(dummy);
    saveRoom(code.toLowerCase(), room);
    return room[0]; // return real campaign
  }
};
