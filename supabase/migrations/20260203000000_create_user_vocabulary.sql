-- Create user_vocabulary table for storing saved words
CREATE TABLE IF NOT EXISTS user_vocabulary (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  word TEXT NOT NULL,
  phonetic TEXT DEFAULT '',
  part_of_speech TEXT DEFAULT '',
  definition TEXT NOT NULL,
  example TEXT,
  synonyms TEXT[] DEFAULT '{}',
  audio_url TEXT,
  indonesian_translation TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  -- Prevent duplicate words per user
  UNIQUE(user_id, word)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_user_vocabulary_user_id ON user_vocabulary(user_id);
CREATE INDEX IF NOT EXISTS idx_user_vocabulary_word ON user_vocabulary(word);
CREATE INDEX IF NOT EXISTS idx_user_vocabulary_created_at ON user_vocabulary(created_at DESC);

-- Enable Row Level Security
ALTER TABLE user_vocabulary ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own vocabulary"
  ON user_vocabulary
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own vocabulary"
  ON user_vocabulary
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own vocabulary"
  ON user_vocabulary
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own vocabulary"
  ON user_vocabulary
  FOR DELETE
  USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_user_vocabulary_updated_at
  BEFORE UPDATE ON user_vocabulary
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
