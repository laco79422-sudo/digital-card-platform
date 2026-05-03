-- 추천·헬퍼·채널 역할 분리: 스키마 보강 및 문서화(주석)
-- 기존 데이터 호환 유지

-- ---------------------------------------------------------------------------
-- 1) card_channels: 스펙의 slug · share_url (옵션, 기본 빈 문자열)
-- ---------------------------------------------------------------------------
ALTER TABLE public.card_channels
  ADD COLUMN IF NOT EXISTS slug text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS share_url text NOT NULL DEFAULT '';

COMMENT ON COLUMN public.card_channels.slug IS '채널 식별용 짧은 키(선택); 링크는 주로 UUID channel 로 전달';
COMMENT ON COLUMN public.card_channels.share_url IS '생성된 공유 URL 캐시(선택)';

-- 타입 확장: 스펙의 friend (= 지인); 기존 acquaintances 유지
DO $$
DECLARE
  cname text;
BEGIN
  SELECT con.conname INTO cname
  FROM pg_constraint con
  WHERE con.conrelid = 'public.card_channels'::regclass
    AND con.contype = 'c'
    AND con.conkey IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM unnest(con.conkey) AS ck(attnum)
      JOIN pg_attribute a ON a.attrelid = con.conrelid AND a.attnum = ck.attnum
      WHERE a.attname = 'type'
    )
  LIMIT 1;

  IF cname IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.card_channels DROP CONSTRAINT %I', cname);
  END IF;
END
$$;

ALTER TABLE public.card_channels
  ADD CONSTRAINT card_channels_type_check
    CHECK (
      type IN (
        'kakao',
        'daangn',
        'blog',
        'youtube',
        'acquaintances',
        'friend',
        'instagram',
        'sms',
        'community',
        'custom'
      )
    );

-- ---------------------------------------------------------------------------
-- 2) card_events: 원문 IP 대신 서버·Edge 에서 채울 해시 필드 (클라이언트에서는 null 허용)
-- ---------------------------------------------------------------------------
ALTER TABLE public.card_events
  ADD COLUMN IF NOT EXISTS ip_hash text NULL;

COMMENT ON COLUMN public.card_events.ip_hash IS '클라이언트에 공인 IP가 없음; Edge/서버에서 해시만 저장 권장';
COMMENT ON TABLE public.card_events IS '유입 분석: channel_id · campaign_id · helper_partner_id. 수익이 아닌 조회·클릭. 추천 수익은 referrals 기준';

-- ---------------------------------------------------------------------------
-- 3) 참조 테이블 주석 (개발자 멘탈 모델)
-- ---------------------------------------------------------------------------
COMMENT ON TABLE public.referrals IS '가입 1회만 연결 referrer_user_id; referral_code 스냅샷; 이후 변경 금지 원칙(앱 RPC 고정)';
COMMENT ON TABLE public.helper_campaigns IS '헬퍼링크 유료 캠페인(실행)·추천 수익과 분리';
COMMENT ON TABLE public.helper_partners IS '헬퍼 실행 주체 프로필; approved 만 공개 선택 등';
COMMENT ON TABLE public.helper_partner_applications IS '스펙 helper_applications: 캠페인 지원·선정 상태';
COMMENT ON TABLE public.campaign_share_links IS '스펙의 유료 helper_links 형태(?campaign=&channel=&helper=); 레거시 public.helper_links 와 별개';
