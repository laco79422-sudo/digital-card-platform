-- 리워드 광고: ads · ad_events · user_rewards, 공개 목록·조회·클릭 적립 RPC
-- 부정 클릭·IP 제한은 향후 Edge/API 레이어에서 확장 (daily 유저·광고당 1회는 DB 유니크로 보장)

CREATE TABLE IF NOT EXISTS public.ads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid (),
  advertiser_user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  image_url text,
  target_url text,
  ad_type text NOT NULL DEFAULT 'banner',
  status text NOT NULL DEFAULT 'pending',
  budget integer NOT NULL DEFAULT 0 CHECK (budget >= 0),
  spent_budget integer NOT NULL DEFAULT 0 CHECK (spent_budget >= 0),
  cost_per_click integer NOT NULL DEFAULT 100 CHECK (cost_per_click > 0),
  reward_per_click integer NOT NULL DEFAULT 50 CHECK (reward_per_click >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now (),
  CONSTRAINT ads_status_check CHECK (
    status IN ('pending', 'active', 'paused', 'exhausted')
  ),
  CONSTRAINT ads_type_check CHECK (
    ad_type IN ('banner', 'click_reward', 'video_reward', 'card_recommend')
  ),
  CONSTRAINT ads_reward_lte_cpc CHECK (reward_per_click <= cost_per_click)
);

CREATE INDEX IF NOT EXISTS ads_advertiser_idx ON public.ads (advertiser_user_id);

CREATE INDEX IF NOT EXISTS ads_active_list_idx ON public.ads (status, budget)
WHERE
  status = 'active';

COMMENT ON TABLE public.ads IS '광고주 소재·예산 (budget=남은 예산, spent_budget=사용 누적)';

CREATE TABLE IF NOT EXISTS public.ad_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid (),
  ad_id uuid NOT NULL REFERENCES public.ads (id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  event_type text NOT NULL,
  reward_amount integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now (),
  CONSTRAINT ad_events_type_check CHECK (event_type IN ('view', 'click', 'rewarded'))
);

CREATE INDEX IF NOT EXISTS ad_events_ad_idx ON public.ad_events (ad_id);

CREATE INDEX IF NOT EXISTS ad_events_ad_type_idx ON public.ad_events (ad_id, event_type);

CREATE TABLE IF NOT EXISTS public.user_rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid (),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  source_type text NOT NULL,
  source_id uuid,
  amount integer NOT NULL CHECK (amount >= 0),
  status text NOT NULL DEFAULT 'pending',
  reward_calendar_day date NULL,
  created_at timestamptz NOT NULL DEFAULT now (),
  CONSTRAINT user_rewards_source_check CHECK (source_type IN ('ad_click', 'promotion', 'manual')),
  CONSTRAINT user_rewards_status_check CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  CONSTRAINT user_rewards_ad_day_chk CHECK (
    (
      source_type <> 'ad_click'
    )
    OR (
      reward_calendar_day IS NOT NULL
      AND source_id IS NOT NULL
    )
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_user_reward_ad_day ON public.user_rewards (
  user_id,
  source_id,
  reward_calendar_day
)
WHERE
  source_type = 'ad_click';

CREATE INDEX IF NOT EXISTS user_rewards_user_idx ON public.user_rewards (user_id);

ALTER TABLE public.ads ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.ad_events ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.user_rewards ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS ads_select_own ON public.ads;

CREATE POLICY ads_select_own ON public.ads FOR SELECT TO authenticated USING (advertiser_user_id = auth.uid ());

DROP POLICY IF EXISTS ads_insert_own ON public.ads;

CREATE POLICY ads_insert_own ON public.ads FOR INSERT TO authenticated WITH CHECK (advertiser_user_id = auth.uid ());

DROP POLICY IF EXISTS ads_update_own ON public.ads;

CREATE POLICY ads_update_own ON public.ads FOR UPDATE TO authenticated USING (advertiser_user_id = auth.uid ()) WITH CHECK (advertiser_user_id = auth.uid ());

DROP POLICY IF EXISTS ad_events_select_advertiser ON public.ad_events;

CREATE POLICY ad_events_select_advertiser ON public.ad_events FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1
    FROM public.ads a
    WHERE
      a.id = ad_id
      AND a.advertiser_user_id = auth.uid ()
  )
);

DROP POLICY IF EXISTS user_rewards_select_own ON public.user_rewards;

CREATE POLICY user_rewards_select_own ON public.user_rewards FOR SELECT TO authenticated USING (user_id = auth.uid ());

GRANT SELECT, INSERT, UPDATE ON public.ads TO authenticated;

GRANT SELECT ON public.ad_events TO authenticated;

GRANT SELECT ON public.user_rewards TO authenticated;

CREATE OR REPLACE FUNCTION public.ads_before_write ()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at := now ();
  IF TG_OP = 'INSERT' THEN
    IF NEW.budget >= NEW.cost_per_click THEN
      NEW.status := 'active';
    ELSE
      NEW.status := 'paused';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS ads_before_ins_up ON public.ads;

CREATE TRIGGER ads_before_ins_up
BEFORE INSERT OR UPDATE ON public.ads FOR EACH ROW
EXECUTE PROCEDURE public.ads_before_write ();

CREATE OR REPLACE FUNCTION public.list_public_reward_ads ()
RETURNS TABLE (
  id uuid,
  title text,
  description text,
  image_url text,
  target_url text,
  ad_type text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    a.id,
    a.title,
    a.description,
    a.image_url,
    a.target_url,
    a.ad_type
  FROM
    public.ads a
  WHERE
    a.status = 'active'
    AND a.budget >= a.cost_per_click
    AND a.ad_type IN ('banner', 'click_reward')
  ORDER BY
    a.created_at DESC
  LIMIT 48;
$$;

GRANT EXECUTE ON FUNCTION public.list_public_reward_ads () TO anon,
authenticated;

CREATE OR REPLACE FUNCTION public.record_ad_view (p_ad_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid ();
BEGIN
  IF EXISTS (
    SELECT
      1
    FROM
      public.ads a
    WHERE
      a.id = p_ad_id
      AND a.status = 'active'
      AND a.budget >= a.cost_per_click
  ) THEN
    INSERT INTO public.ad_events (ad_id, user_id, event_type, reward_amount)
      VALUES (p_ad_id, uid, 'view', 0);
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.record_ad_view (uuid) TO anon,
authenticated;

CREATE OR REPLACE FUNCTION public.claim_ad_click_reward (p_ad_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid ();
  ad_row public.ads%ROWTYPE;
  seoul_day date;
  dup boolean;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  SELECT
    * INTO ad_row
  FROM
    public.ads
  WHERE
    id = p_ad_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'ad_not_found';
  END IF;

  IF ad_row.advertiser_user_id = uid THEN
    RAISE EXCEPTION 'own_ad';
  END IF;

  IF ad_row.status <> 'active' THEN
    RAISE EXCEPTION 'ad_inactive';
  END IF;

  IF ad_row.budget < ad_row.cost_per_click THEN
    RAISE EXCEPTION 'insufficient_budget';
  END IF;

  seoul_day := (timezone('Asia/Seoul', now ()))::date;

  SELECT
    EXISTS (
      SELECT
        1
      FROM
        public.user_rewards ur
      WHERE
        ur.user_id = uid
        AND ur.source_type = 'ad_click'
        AND ur.source_id = p_ad_id
        AND ur.reward_calendar_day = seoul_day
    ) INTO dup;

  IF dup THEN
    RAISE EXCEPTION 'daily_limit';
  END IF;

  UPDATE public.ads a
  SET
    budget = a.budget - a.cost_per_click,
    spent_budget = a.spent_budget + a.cost_per_click,
    status = CASE
      WHEN (a.budget - a.cost_per_click) < a.cost_per_click THEN 'exhausted'::text
      ELSE a.status
    END,
    updated_at = now ()
  WHERE
    a.id = p_ad_id;

  INSERT INTO public.ad_events (ad_id, user_id, event_type, reward_amount)
    VALUES (p_ad_id, uid, 'click', 0);

  INSERT INTO public.ad_events (ad_id, user_id, event_type, reward_amount)
    VALUES (p_ad_id, uid, 'rewarded', ad_row.reward_per_click);

  INSERT INTO public.user_rewards (
    user_id,
    source_type,
    source_id,
    amount,
    status,
    reward_calendar_day
  )
    VALUES (uid, 'ad_click', p_ad_id, ad_row.reward_per_click, 'confirmed', seoul_day);

  RETURN jsonb_build_object(
    'ok',
    TRUE,
    'reward_amount',
    ad_row.reward_per_click,
    'target_url',
    ad_row.target_url
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.claim_ad_click_reward (uuid) TO authenticated;

COMMENT ON FUNCTION public.claim_ad_click_reward (uuid) IS '클릭 리워드: 예산 차감·일 1회·본인 광고 제외';
