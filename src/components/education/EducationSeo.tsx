import { SITE_OG_DESCRIPTION, SITE_OG_TITLE } from "@/lib/siteLinkPreview";
import { useEffect } from "react";

const TITLE =
  "AI 블로그 교육 | AI 영상 제작 교육 | 실전 교육신청 | Linko 디지털 명함";
const DESCRIPTION =
  "AI 블로그와 AI 영상 제작을 통해 수익을 만드는 실전 교육. 온라인과 오프라인 강의 모두 제공. 교육 신청과 강사 모집을 함께 진행합니다.";
const KEYWORDS =
  "AI 블로그, AI 영상 제작, AI 수익화, 교육신청, 강사모집, 실전 교육, Linko";

export function EducationSeo() {
  useEffect(() => {
    document.title = TITLE;
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement("meta");
      metaDesc.setAttribute("name", "description");
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute("content", DESCRIPTION);

    let metaKw = document.querySelector('meta[name="keywords"]');
    if (!metaKw) {
      metaKw = document.createElement("meta");
      metaKw.setAttribute("name", "keywords");
      document.head.appendChild(metaKw);
    }
    metaKw.setAttribute("content", KEYWORDS);

    return () => {
      document.title = SITE_OG_TITLE;
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) metaDesc.setAttribute("content", SITE_OG_DESCRIPTION);
    };
  }, []);

  return null;
}
