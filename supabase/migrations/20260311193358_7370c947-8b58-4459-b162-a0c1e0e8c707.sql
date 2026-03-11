
CREATE TABLE public.feedback_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL,
  "group" text NOT NULL,
  tag text NOT NULL,
  count integer NOT NULL DEFAULT 1,
  long_description text NOT NULL DEFAULT '',
  children jsonb NOT NULL DEFAULT '[]'::jsonb,
  source text NOT NULL DEFAULT 'voice',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.feedback_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read feedback entries"
  ON public.feedback_entries FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can insert feedback entries"
  ON public.feedback_entries FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

ALTER PUBLICATION supabase_realtime ADD TABLE public.feedback_entries;
