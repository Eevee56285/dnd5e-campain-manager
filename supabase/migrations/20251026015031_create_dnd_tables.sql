/*
  # D&D Campaign Manager Schema

  ## Overview
  Creates tables for managing D&D campaigns with initiative tracking, character/monster management, and health tracking.

  ## New Tables
  
  ### `campaigns`
  - `id` (uuid, primary key) - Unique campaign identifier
  - `name` (text) - Campaign name
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### `battles`
  - `id` (uuid, primary key) - Unique battle identifier
  - `campaign_id` (uuid, foreign key) - Associated campaign
  - `name` (text) - Battle name/description
  - `is_active` (boolean) - Whether this battle is currently active
  - `created_at` (timestamptz) - Creation timestamp

  ### `combatants`
  - `id` (uuid, primary key) - Unique combatant identifier
  - `battle_id` (uuid, foreign key) - Associated battle
  - `name` (text) - Character/monster name
  - `type` (text) - 'player' or 'monster'
  - `initiative` (integer) - Initiative roll result
  - `dex_modifier` (integer) - Dexterity modifier (optional)
  - `max_hp` (integer) - Maximum hit points
  - `current_hp` (integer) - Current hit points
  - `armor_class` (integer) - Armor class (optional)
  - `notes` (text) - Additional notes
  - `created_at` (timestamptz) - Creation timestamp

  ## Security
  - Enable RLS on all tables
  - Public access for campaigns (read/write) - designed for single-user or trusted group use
  - Public access for battles (read/write)
  - Public access for combatants (read/write)

  ## Notes
  - This schema supports multiple campaigns, each with multiple battles
  - Each battle can have multiple combatants (players and monsters)
  - Initiative and health tracking are core features
  - RLS policies allow full access for authenticated and anonymous users (suitable for single-user or trusted scenarios)
*/

-- Create campaigns table
CREATE TABLE IF NOT EXISTS campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create battles table
CREATE TABLE IF NOT EXISTS battles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid REFERENCES campaigns(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  is_active boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create combatants table
CREATE TABLE IF NOT EXISTS combatants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  battle_id uuid REFERENCES battles(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('player', 'monster')),
  initiative integer NOT NULL,
  dex_modifier integer DEFAULT 0,
  max_hp integer NOT NULL DEFAULT 10,
  current_hp integer NOT NULL DEFAULT 10,
  armor_class integer DEFAULT 10,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE battles ENABLE ROW LEVEL SECURITY;
ALTER TABLE combatants ENABLE ROW LEVEL SECURITY;

-- Campaigns policies (public access)
CREATE POLICY "Allow public read campaigns"
  ON campaigns FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public insert campaigns"
  ON campaigns FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public update campaigns"
  ON campaigns FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete campaigns"
  ON campaigns FOR DELETE
  TO public
  USING (true);

-- Battles policies (public access)
CREATE POLICY "Allow public read battles"
  ON battles FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public insert battles"
  ON battles FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public update battles"
  ON battles FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete battles"
  ON battles FOR DELETE
  TO public
  USING (true);

-- Combatants policies (public access)
CREATE POLICY "Allow public read combatants"
  ON combatants FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public insert combatants"
  ON combatants FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public update combatants"
  ON combatants FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete combatants"
  ON combatants FOR DELETE
  TO public
  USING (true);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_battles_campaign_id ON battles(campaign_id);
CREATE INDEX IF NOT EXISTS idx_combatants_battle_id ON combatants(battle_id);
CREATE INDEX IF NOT EXISTS idx_combatants_initiative ON combatants(battle_id, initiative DESC);