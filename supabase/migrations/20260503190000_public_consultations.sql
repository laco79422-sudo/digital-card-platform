-- 공개 명함 문의 접수 — 상담하기(문의폼 폴백) 저장

CREATE TABLE IF NOT EXISTS public.consultations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id uuid NOT NULL REFERENCES public.business_cards(id) ON DELETE CASCADE,
  owner_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  customer_name text NOT NULL DEFAULT '',
  customer_contact text NOT NULL DEFAULT '',
  message text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'read', 'closed')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_consultations_card ON public.consultations(card_id);
CREATE INDEX IF NOT EXISTS idx_consultations_owner ON public.consultations(owner_id);

CREATE OR REPLACE FUNCTION public.consultations_set_owner_from_card()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.owner_id IS NULL THEN
    SELECT bc.user_id INTO NEW.owner_id
    FROM public.business_cards bc
    WHERE bc.id = NEW.card_id
    LIMIT 1;
  END IF;
  IF NEW.owner_id IS NULL THEN
    RAISE EXCEPTION 'consultations missing owner for card %', NEW.card_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_consultations_set_owner ON public.consultations;
CREATE TRIGGER tr_consultations_set_owner
  BEFORE INSERT ON public.consultations
  FOR EACH ROW
  EXECUTE PROCEDURE public.consultations_set_owner_from_card();

ALTER TABLE public.consultations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "consultations_public_insert" ON public.consultations;
CREATE POLICY "consultations_public_insert"
  ON public.consultations FOR INSERT TO anon, authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.business_cards bc
      WHERE bc.id = consultations.card_id
        AND COALESCE(bc.is_archived, false) IS FALSE
        AND (
          (
            bc.is_public IS TRUE
          )
          OR (
            auth.uid() IS NOT NULL
            AND (bc.user_id = auth.uid() OR bc.owner_id = auth.uid())
          )
        )
    )
    AND LENGTH(TRIM(consultations.customer_name)) >= 1
    AND LENGTH(TRIM(consultations.customer_contact)) >= 1
    AND LENGTH(TRIM(consultations.message)) >= 1
  );

DROP POLICY IF EXISTS "consultations_owner_select" ON public.consultations;
CREATE POLICY "consultations_owner_select"
  ON public.consultations FOR SELECT TO authenticated
  USING (owner_id = auth.uid());

GRANT SELECT, INSERT ON public.consultations TO anon, authenticated;
