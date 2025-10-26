import { supabase } from './supabase';

export type UserRole = 'dm' | 'player';

export type CampaignMember = {
  id: string;
  campaignId: string;
  userId: string;
  username: string;
  role: UserRole;
  assignedCharacterIds: string[];
  joinedAt: string;
};

export type MultiplayerCampaign = {
  id: string;
  name: string;
  joinCode: string;
  ownerId: string;
  createdAt: string;
};

export const multiplayerStorage = {
  // Generate a 6-character join code
  generateJoinCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  },

  // Create a new campaign with join code
  async createCampaign(name: string, userId: string, username: string): Promise<MultiplayerCampaign | null> {
    try {
      const joinCode = this.generateJoinCode();
      
      const { data: campaign, error: campaignError } = await supabase
        .from('campaigns')
        .insert({
          name,
          join_code: joinCode,
          owner_id: userId,
        })
        .select()
        .single();

      if (campaignError) throw campaignError;

      // Add creator as DM
      const { error: memberError } = await supabase
        .from('campaign_members')
        .insert({
          campaign_id: campaign.id,
          user_id: userId,
          username,
          role: 'dm',
          assigned_character_ids: [],
        });

      if (memberError) throw memberError;

      return {
        id: campaign.id,
        name: campaign.name,
        joinCode: campaign.join_code,
        ownerId: campaign.owner_id,
        createdAt: campaign.created_at,
      };
    } catch (error) {
      console.error('Error creating campaign:', error);
      return null;
    }
  },

  // Join campaign with code
  async joinCampaign(joinCode: string, userId: string, username: string): Promise<MultiplayerCampaign | null> {
    try {
      // Find campaign by join code
      const { data: campaign, error: campaignError } = await supabase
        .from('campaigns')
        .select('*')
        .eq('join_code', joinCode.toUpperCase())
        .single();

      if (campaignError) throw campaignError;

      // Check if already a member
      const { data: existingMember } = await supabase
        .from('campaign_members')
        .select('*')
        .eq('campaign_id', campaign.id)
        .eq('user_id', userId)
        .single();

      if (!existingMember) {
        // Add as player
        const { error: memberError } = await supabase
          .from('campaign_members')
          .insert({
            campaign_id: campaign.id,
            user_id: userId,
            username,
            role: 'player',
            assigned_character_ids: [],
          });

        if (memberError) throw memberError;
      }

      return {
        id: campaign.id,
        name: campaign.name,
        joinCode: campaign.join_code,
        ownerId: campaign.owner_id,
        createdAt: campaign.created_at,
      };
    } catch (error) {
      console.error('Error joining campaign:', error);
      return null;
    }
  },

  // Get user's campaigns
  async getUserCampaigns(userId: string): Promise<MultiplayerCampaign[]> {
    try {
      const { data: members, error: membersError } = await supabase
        .from('campaign_members')
        .select('campaign_id')
        .eq('user_id', userId);

      if (membersError) throw membersError;

      const campaignIds = members.map(m => m.campaign_id);

      const { data: campaigns, error: campaignsError } = await supabase
        .from('campaigns')
        .select('*')
        .in('id', campaignIds);

      if (campaignsError) throw campaignsError;

      return campaigns.map(c => ({
        id: c.id,
        name: c.name,
        joinCode: c.join_code,
        ownerId: c.owner_id,
        createdAt: c.created_at,
      }));
    } catch (error) {
      console.error('Error getting campaigns:', error);
      return [];
    }
  },

  // Get campaign members
  async getCampaignMembers(campaignId: string): Promise<CampaignMember[]> {
    try {
      const { data, error } = await supabase
        .from('campaign_members')
        .select('*')
        .eq('campaign_id', campaignId);

      if (error) throw error;

      return data.map(m => ({
        id: m.id,
        campaignId: m.campaign_id,
        userId: m.user_id,
        username: m.username,
        role: m.role,
        assignedCharacterIds: m.assigned_character_ids || [],
        joinedAt: m.joined_at,
      }));
    } catch (error) {
      console.error('Error getting members:', error);
      return [];
    }
  },

  // Assign characters to a player
  async assignCharacters(memberId: string, characterIds: string[]): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('campaign_members')
        .update({ assigned_character_ids: characterIds })
        .eq('id', memberId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error assigning characters:', error);
      return false;
    }
  },

  // Get user's role in campaign
  async getUserRole(campaignId: string, userId: string): Promise<UserRole | null> {
    try {
      const { data, error } = await supabase
        .from('campaign_members')
        .select('role')
        .eq('campaign_id', campaignId)
        .eq('user_id', userId)
        .single();

      if (error) throw error;
      return data.role;
    } catch (error) {
      console.error('Error getting user role:', error);
      return null;
    }
  },

  // Get assigned characters for a user
  async getAssignedCharacters(campaignId: string, userId: string): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('campaign_members')
        .select('assigned_character_ids')
        .eq('campaign_id', campaignId)
        .eq('user_id', userId)
        .single();

      if (error) throw error;
      return data.assigned_character_ids || [];
    } catch (error) {
      console.error('Error getting assigned characters:', error);
      return [];
    }
  },

  // Subscribe to campaign updates
  subscribeToCampaign(campaignId: string, callback: () => void) {
    const channel = supabase
      .channel(`campaign-${campaignId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'battles',
          filter: `campaign_id=eq.${campaignId}`,
        },
        callback
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'combatants',
        },
        callback
      )
      .subscribe();

    return channel;
  },
};
