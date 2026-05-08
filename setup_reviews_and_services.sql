-- 1. Add helpful_votes column to existing reviews table
ALTER TABLE public.reviews 
ADD COLUMN IF NOT EXISTS helpful_votes integer DEFAULT 0;

-- 2. Create provider_services table
CREATE TABLE IF NOT EXISTS public.provider_services (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    provider_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    service_category_id uuid REFERENCES public.service_categories(id) ON DELETE CASCADE,
    title text NOT NULL,
    description text,
    price text,
    active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS logic for provider_services
ALTER TABLE public.provider_services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON public.provider_services
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for providers representing themselves" ON public.provider_services
    FOR INSERT WITH CHECK (auth.uid() = provider_id);

CREATE POLICY "Enable update for providers representing themselves" ON public.provider_services
    FOR UPDATE USING (auth.uid() = provider_id);

CREATE POLICY "Enable delete for providers representing themselves" ON public.provider_services
    FOR DELETE USING (auth.uid() = provider_id);
