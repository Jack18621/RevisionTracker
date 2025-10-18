-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create questions table to store all questions
CREATE TABLE public.questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  paper_id TEXT NOT NULL,
  topic TEXT NOT NULL,
  subtopic TEXT NOT NULL,
  question_type TEXT NOT NULL CHECK (question_type IN ('mcq', 'true-false', 'short-answer', 'fill-blank', 'match-up', 'define', 'exam')),
  question_text TEXT NOT NULL,
  options JSONB, -- For MCQ questions
  correct_answer JSONB, -- Nullable for exam questions that require manual marking
  explanation TEXT,
  marks INTEGER, -- For exam questions
  difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')),
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create user_progress table to track mastery scores
CREATE TABLE public.user_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  mastery_score DECIMAL(5,2) NOT NULL DEFAULT 0 CHECK (mastery_score >= 0 AND mastery_score <= 100),
  total_attempts INTEGER NOT NULL DEFAULT 0,
  correct_attempts INTEGER NOT NULL DEFAULT 0,
  last_answered_at TIMESTAMPTZ,
  confidence_level INTEGER CHECK (confidence_level >= 1 AND confidence_level <= 5),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, question_id)
);

-- Create subtopic_mastery table for aggregated mastery view
CREATE TABLE public.subtopic_mastery (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  paper_id TEXT NOT NULL,
  topic TEXT NOT NULL,
  subtopic TEXT NOT NULL,
  overall_mastery DECIMAL(5,2) NOT NULL DEFAULT 0 CHECK (overall_mastery >= 0 AND overall_mastery <= 100),
  mastered BOOLEAN NOT NULL DEFAULT FALSE,
  last_practiced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, paper_id, topic, subtopic)
);

-- Create indexes for performance
CREATE INDEX idx_questions_paper_topic ON public.questions(paper_id, topic, subtopic);
CREATE INDEX idx_user_progress_user_id ON public.user_progress(user_id);
CREATE INDEX idx_user_progress_mastery ON public.user_progress(mastery_score);
CREATE INDEX idx_subtopic_mastery_user ON public.subtopic_mastery(user_id, paper_id, topic, subtopic);

-- Enable RLS
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subtopic_mastery ENABLE ROW LEVEL SECURITY;

-- RLS Policies for questions (publicly readable)
CREATE POLICY "Questions are viewable by everyone"
  ON public.questions FOR SELECT
  USING (true);

-- RLS Policies for user_progress
CREATE POLICY "Users can view their own progress"
  ON public.user_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own progress"
  ON public.user_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress"
  ON public.user_progress FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for subtopic_mastery
CREATE POLICY "Users can view their own subtopic mastery"
  ON public.subtopic_mastery FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own subtopic mastery"
  ON public.subtopic_mastery FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own subtopic mastery"
  ON public.subtopic_mastery FOR UPDATE
  USING (auth.uid() = user_id);

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_questions_updated_at
  BEFORE UPDATE ON public.questions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_progress_updated_at
  BEFORE UPDATE ON public.user_progress
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_subtopic_mastery_updated_at
  BEFORE UPDATE ON public.subtopic_mastery
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample questions for Geography Paper 1
INSERT INTO public.questions (paper_id, topic, subtopic, question_type, question_text, options, correct_answer, explanation, difficulty, marks) VALUES
('paper1', 'Climate Change', 'Introduction', 'mcq', 'What is the main cause of coastal erosion?', 
 '["Wave action", "Wind", "Rain", "Snow"]', '0', 
 'Wave action is the primary force that causes coastal erosion through hydraulic action and abrasion.', 'easy', null),

('paper1', 'Climate Change', 'Introduction', 'true-false', 'Climate change is causing sea levels to rise.', 
 null, 'true', 
 'Global warming causes thermal expansion of water and melting of ice caps, leading to rising sea levels.', 'easy', null),

('paper1', 'Climate Change', 'Case Studies', 'mcq', 'Which greenhouse gas contributes most to global warming?', 
 '["Carbon Dioxide", "Methane", "Nitrous Oxide", "Water Vapor"]', '0', 
 'While water vapor is abundant, CO2 from human activities is the primary driver of current global warming.', 'medium', null),

('paper1', 'Coastal Landscapes', 'Introduction', 'define', 'Define the term: Longshore Drift', 
 null, '["Movement of sediment along a coastline", "Transportation of material along the coast by waves", "Process where waves move sediment along the beach"]', 
 null, 'easy', null),

('paper1', 'Coastal Landscapes', 'Management', 'exam', 'Explain how wave action causes coastal erosion.', 
 null, null, null, 'medium', 4);
