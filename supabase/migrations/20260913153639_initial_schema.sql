-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table
CREATE TABLE profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    full_name TEXT,
    phone TEXT,
    avatar_url TEXT,
    preferred_language TEXT DEFAULT 'en',
    location TEXT,
    role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'paid')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Profile Policies
CREATE POLICY "Users can view their own profile."
    ON profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile."
    ON profiles FOR UPDATE
    USING (auth.uid() = id);

-- Projects
CREATE TABLE projects (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    home_type TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own projects" ON projects
    FOR ALL USING (auth.uid() = user_id);

-- Rooms
CREATE TABLE rooms (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
    room_type TEXT NOT NULL,
    length NUMERIC,
    width NUMERIC,
    height NUMERIC,
    budget_range TEXT,
    preferred_style TEXT,
    color_preferences JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own rooms" ON rooms
    FOR ALL USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = rooms.project_id AND projects.user_id = auth.uid()));

-- Room Images
CREATE TABLE room_images (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    room_id UUID REFERENCES rooms(id) ON DELETE CASCADE NOT NULL,
    storage_path TEXT NOT NULL,
    view_label TEXT CHECK (view_label IN ('front', 'side', 'corner')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE room_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own room images" ON room_images
    FOR ALL USING (EXISTS (
        SELECT 1 FROM rooms
        JOIN projects ON projects.id = rooms.project_id
        WHERE rooms.id = room_images.room_id AND projects.user_id = auth.uid()
    ));

-- Analyses
CREATE TABLE analyses (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    room_id UUID REFERENCES rooms(id) ON DELETE CASCADE NOT NULL,
    room_image_id UUID REFERENCES room_images(id) ON DELETE CASCADE NOT NULL,
    overall_score NUMERIC,
    raw_ai_response JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE analyses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own analyses" ON analyses
    FOR SELECT USING (EXISTS (
        SELECT 1 FROM rooms JOIN projects ON projects.id = rooms.project_id
        WHERE rooms.id = analyses.room_id AND projects.user_id = auth.uid()
    ));

-- Analysis Scores
CREATE TABLE analysis_scores (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    analysis_id UUID REFERENCES analyses(id) ON DELETE CASCADE NOT NULL,
    category TEXT CHECK (category IN ('space_utilization', 'lighting', 'color_harmony', 'furniture_layout', 'storage', 'style_consistency')),
    score NUMERIC,
    explanation TEXT
);
ALTER TABLE analysis_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own analysis scores" ON analysis_scores
    FOR SELECT USING (EXISTS (
        SELECT 1 FROM analyses
        JOIN rooms ON rooms.id = analyses.room_id
        JOIN projects ON projects.id = rooms.project_id
        WHERE analyses.id = analysis_scores.analysis_id AND projects.user_id = auth.uid()
    ));

-- Recommendations
CREATE TABLE recommendations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    analysis_id UUID REFERENCES analyses(id) ON DELETE CASCADE NOT NULL,
    category TEXT,
    suggestion TEXT,
    reasoning TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE recommendations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own recommendations" ON recommendations
    FOR SELECT USING (EXISTS (
        SELECT 1 FROM analyses
        JOIN rooms ON rooms.id = analyses.room_id
        JOIN projects ON projects.id = rooms.project_id
        WHERE analyses.id = recommendations.analysis_id AND projects.user_id = auth.uid()
    ));

-- Design Generations
CREATE TABLE design_generations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    room_id UUID REFERENCES rooms(id) ON DELETE CASCADE NOT NULL,
    analysis_id UUID REFERENCES analyses(id) ON DELETE SET NULL,
    style TEXT,
    color_palette JSONB,
    budget_range TEXT,
    design_intensity TEXT,
    provider_used TEXT,
    provider_params JSONB,
    original_image_url TEXT,
    generated_image_urls JSONB,
    budget_breakdown JSONB,
    estimated_total_min NUMERIC,
    estimated_total_max NUMERIC,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE design_generations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own design generations" ON design_generations
    FOR ALL USING (EXISTS (
        SELECT 1 FROM rooms JOIN projects ON projects.id = rooms.project_id
        WHERE rooms.id = design_generations.room_id AND projects.user_id = auth.uid()
    ));

-- Saved Designs
CREATE TABLE saved_designs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    design_generation_id UUID REFERENCES design_generations(id) ON DELETE CASCADE NOT NULL,
    custom_name TEXT,
    is_favorite BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE saved_designs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own saved designs" ON saved_designs
    FOR ALL USING (auth.uid() = user_id);

-- Budget Estimates (Standalone)
CREATE TABLE budget_estimates (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    room_id UUID REFERENCES rooms(id) ON DELETE CASCADE NOT NULL,
    quality_level TEXT,
    total_min NUMERIC,
    total_max NUMERIC,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE budget_estimates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own budget estimates" ON budget_estimates
    FOR ALL USING (EXISTS (
        SELECT 1 FROM rooms JOIN projects ON projects.id = rooms.project_id
        WHERE rooms.id = budget_estimates.room_id AND projects.user_id = auth.uid()
    ));

-- Budget Items
CREATE TABLE budget_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    budget_estimate_id UUID REFERENCES budget_estimates(id) ON DELETE CASCADE NOT NULL,
    category TEXT CHECK (category IN ('civil_work', 'painting', 'electrical', 'lighting', 'furniture', 'carpentry', 'flooring', 'curtains', 'decor', 'false_ceiling')),
    min_amount NUMERIC,
    max_amount NUMERIC,
    user_edited BOOLEAN DEFAULT false
);
ALTER TABLE budget_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own budget items" ON budget_items
    FOR ALL USING (EXISTS (
        SELECT 1 FROM budget_estimates
        JOIN rooms ON rooms.id = budget_estimates.room_id
        JOIN projects ON projects.id = rooms.project_id
        WHERE budget_estimates.id = budget_items.budget_estimate_id AND projects.user_id = auth.uid()
    ));

-- Shared Designs
CREATE TABLE shared_designs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    design_generation_id UUID REFERENCES design_generations(id) ON DELETE CASCADE NOT NULL,
    share_token TEXT UNIQUE NOT NULL,
    is_enabled BOOLEAN DEFAULT true,
    view_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE shared_designs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view enabled shared designs" ON shared_designs
    FOR SELECT USING (is_enabled = true);
CREATE POLICY "Users can manage their own shared designs" ON shared_designs
    FOR ALL USING (EXISTS (
        SELECT 1 FROM design_generations
        JOIN rooms ON rooms.id = design_generations.room_id
        JOIN projects ON projects.id = rooms.project_id
        WHERE design_generations.id = shared_designs.design_generation_id AND projects.user_id = auth.uid()
    ));

-- Chat Sessions
CREATE TABLE chat_sessions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own chat sessions" ON chat_sessions
    FOR ALL USING (auth.uid() = user_id);

-- Chat Messages
CREATE TABLE chat_messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    chat_session_id UUID REFERENCES chat_sessions(id) ON DELETE CASCADE NOT NULL,
    role TEXT CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own chat messages" ON chat_messages
    FOR ALL USING (EXISTS (
        SELECT 1 FROM chat_sessions
        WHERE chat_sessions.id = chat_messages.chat_session_id AND chat_sessions.user_id = auth.uid()
    ));

-- Feedback
CREATE TABLE feedback (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    target_type TEXT CHECK (target_type IN ('analysis', 'design', 'general')),
    target_id UUID,
    rating TEXT CHECK (rating IN ('helpful', 'not_helpful')),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view and create their own feedback" ON feedback
    FOR ALL USING (auth.uid() = user_id);

-- Usage Logs
CREATE TABLE usage_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    action_type TEXT CHECK (action_type IN ('analysis', 'generation', 'chat_message')),
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE usage_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own usage logs" ON usage_logs
    FOR SELECT USING (auth.uid() = user_id);

-- Storage Buckets Setup
INSERT INTO storage.buckets (id, name, public) VALUES ('room-images', 'room-images', false);
INSERT INTO storage.buckets (id, name, public) VALUES ('generated-designs', 'generated-designs', false);
INSERT INTO storage.buckets (id, name, public) VALUES ('profile-images', 'profile-images', false);

-- Storage Policies
-- Room Images Bucket
CREATE POLICY "Users can upload their own room images"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'room-images' AND auth.uid() = owner);

CREATE POLICY "Users can view their own room images"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'room-images' AND auth.uid() = owner);

-- Generated Designs Bucket
CREATE POLICY "Users can upload generated designs"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'generated-designs' AND auth.uid() = owner);

CREATE POLICY "Users can view their own generated designs"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'generated-designs' AND auth.uid() = owner);

-- Profile Images Bucket
CREATE POLICY "Users can manage their own profile images"
    ON storage.objects FOR ALL
    USING (bucket_id = 'profile-images' AND auth.uid() = owner);
