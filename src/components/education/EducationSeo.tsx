import { SITE_OG_DESCRIPTION, SITE_OG_TITLE } from "@/lib/siteLinkPreview";
import { useEffect } from "react";

const TITLE = "교육·강사 | 린코 명함·블로그·영상·프로그램·AI 제작 교육";
const DESCRIPTION =
  "명함디자인, 블로그, 영상제작, 프로그램 제작, AI 제작교육까지 온·오프라인 교육과 강사 신청을 한곳에서 진행합니다.";
const KEYWORDS = "린코, 교육, 강사, 명함디자인, 블로그, 영상, 프로그램, AI 교육";

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
