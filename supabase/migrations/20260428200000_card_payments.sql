CREATE TABLE IF NOT EXISTS public.card_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  card_id UUID NULL,
  type TEXT DEFAULT 'extra_card',
  amount INTEGER DEFAULT 10900,
  status TEXT DEFAULT 'paid',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS card_payments_user_id_idx ON public.card_payments (user_id);
CREATE INDEX IF NOT EXISTS card_payments_card_id_idx ON public.card_payments (card_id);

ALTER TABLE public.card_payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "card_payments_insert_own" ON public.card_payments;
CREATE POLICY "card_payments_insert_own"
  ON public.card_payments
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "card_payments_select_own" ON public.card_payments;
CREATE POLICY "card_payments_select_own"
  ON public.card_payments
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);
