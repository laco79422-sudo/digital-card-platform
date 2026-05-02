import { Badge } from "@/components/ui/Badge";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Select } from "@/components/ui/Select";
import {
  COURSE_ENROLLMENT_STATUS_LABEL,
  EDUCATION_CATEGORY_LABEL,
} from "@/lib/educationLabels";
import { layout } from "@/lib/ui-classes";
import { cn } from "@/lib/utils";
import type { CourseEnrollmentStatus, EducationApplication } from "@/types/domain";
import { useAppDataStore } from "@/stores/appDataStore";
import { useAuthStore } from "@/stores/authStore";
import { Link } from "react-router-dom";
import { useMemo, useState } from "react";

const menu = [
  { id: "courses", label: "내 교육" },
  { id: "applicants", label: "신청자 관리" },
  { id: "schedule", label: "일정 관리" },
  { id: "notice", label: "공지 작성" },
  { id: "revenue", label: "정산 내역" },
] as const;

export function TeacherDashboardPage() {
  const user = useAuthStore((s) => s.user);
  const teachers = useAppDataStore((s) => s.teachers);
  const offerings = useAppDataStore((s) => s.educationOfferings);
  const applications = useAppDataStore((s) => s.educationApplications);
  const updateEnrollment = useAppDataStore((s) => s.updateEducationApplication);

  const [panel, setPanel] = useState<(typeof menu)[number]["id"]>("courses");

  const myTeacher = useMemo(() => {
    if (!user) return undefined;
    return teachers.find((t) => t.user_id === user.id && t.status === "active");
  }, [teachers, user]);

  const myCourses = useMemo(() => {
    if (!myTeacher) return [];
    return offerings.filter((o) => o.teacher_id === myTeacher.id);
  }, [myTeacher, offerings]);

  const offeringIds = useMemo(() => new Set(myCourses.map((c) => c.id)), [myCourses]);

  const myApplicants = useMemo(() => {
    return applications.filter((a) => a.education_id && offeringIds.has(a.education_id));
  }, [applications, offeringIds]);

  if (!user) return null;

  if (!myTeacher && user.role === "teacher") {
    return (
      <div className={cn(layout.page, "py-16")}>
        <Card>
          <CardHeader>
            <h1 className="text-xl font-bold text-slate-900">프로필 연동 필요</h1>
            <p className="text-sm text-slate-600">
              강사 역할은 부여되어 있지만 로컬 강사 프로필 데이터가 준비되지 않았습니다. 운영팀에 확인해 주세요.
            </p>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (!myTeacher) {
    return (
      <div className={cn(layout.page, "py-16 text-center")}>
        <p className="text-slate-600">강사 권한이 없습니다.</p>
        <Link className="mt-4 inline-block font-semibold text-brand-800" to="/education">
          교육·강사 페이지로
        </Link>
      </div>
    );
  }

  return (
    <div className={cn(layout.page, "py-10 sm:py-12")}>
      <header className="flex flex-col gap-2 border-b border-slate-100 pb-8">
        <p className="text-sm font-semibold text-brand-800">강사</p>
        <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">강사 관리 페이지</h1>
        <p className="text-sm text-slate-600">{myTeacher.name}님 교육을 관리합니다.</p>
      </header>

      <div className="mt-10 flex gap-8">
        <nav className="hidden w-48 shrink-0 flex-col gap-1 md:flex" aria-label="강사 메뉴">
          {menu.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setPanel(item.id)}
              className={cn(
                "rounded-xl px-3 py-3 text-left text-sm font-semibold transition-colors",
                panel === item.id ? "bg-brand-900 text-white" : "text-slate-700 hover:bg-slate-50",
              )}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="min-w-0 flex-1 space-y-6">
          <div className="md:hidden">
            <label className="text-xs font-semibold text-slate-500">메뉴 선택</label>
            <Select className="mt-1 h-11" value={panel} onChange={(e) => setPanel(e.target.value as typeof panel)}>
              {menu.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </Select>
          </div>

          {panel === "courses" ? (
            <Card>
              <CardHeader className="space-y-1">
                <h2 className="text-lg font-bold text-slate-900">내 교육 목록</h2>
                <p className="text-sm text-slate-600">배정된 교육과 모집 현황을 확인합니다.</p>
              </CardHeader>
              <CardContent className="space-y-4">
                {myCourses.length === 0 ? (
                  <p className="rounded-xl bg-slate-50 px-4 py-5 text-sm text-slate-600">
                    현재 귀하에게 연결된 교육 카탈로그가 없습니다. 운영팀 배정 후 이곳에서 확인할 수 있어요.
                  </p>
                ) : (
                  <ul className="divide-y divide-slate-100">
                    {myCourses.map((course) => (
                      <li key={course.id} className="py-4">
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <div>
                            <Badge tone="brand">{EDUCATION_CATEGORY_LABEL[course.category]}</Badge>
                            <h3 className="mt-2 text-base font-bold text-slate-900">{course.title}</h3>
                            <p className="mt-1 text-sm text-slate-600">{course.schedule_summary}</p>
                          </div>
                          <Link to={`/education/${course.id}`} className="text-sm font-bold text-brand-800 hover:underline">
                            상세 페이지
                          </Link>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          ) : null}

          {panel === "applicants" ? (
            <Card>
              <CardHeader className="space-y-1">
                <h2 className="text-lg font-bold text-slate-900">신청자 관리</h2>
                <p className="text-sm text-slate-600">본인 교육에 신청된 회원만 볼 수 있습니다.</p>
              </CardHeader>
              <CardContent>
                {myApplicants.length === 0 ? (
                  <p className="rounded-xl bg-slate-50 px-4 py-5 text-sm text-slate-600">아직 접수 건이 없습니다.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                          <th className="pb-3 pr-4">이름</th>
                          <th className="pb-3 pr-4">연락처</th>
                          <th className="pb-3 pr-4">이메일</th>
                          <th className="pb-3 pr-4">강좌</th>
                          <th className="pb-3 pr-4">방식</th>
                          <th className="pb-3 pr-4">상태</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {myApplicants.map((row: EducationApplication) => {
                          const course = offerings.find((c) => c.id === row.education_id);

                          const statusChoices: CourseEnrollmentStatus[] = [
                            "applied",
                            "reviewing",
                            "approved",
                            "waiting",
                            "canceled",
                            "completed",
                          ];
                          return (
                            <tr key={row.id}>
                              <td className="py-3 font-semibold text-slate-900">{row.name}</td>
                              <td className="py-3 text-slate-700">{row.phone}</td>
                              <td className="py-3 text-slate-700">{row.email}</td>
                              <td className="py-3">{course?.title ?? row.preferred_course_label}</td>
                              <td className="py-3">{row.participation_method === "online" ? "온라인" : "오프라인"}</td>
                              <td className="py-3">
                                <Select
                                  value={row.status}
                                  onChange={(e) =>
                                    updateEnrollment(row.id, { status: e.target.value as CourseEnrollmentStatus })
                                  }
                                  aria-label={`${row.name} 신청 상태`}
                                >
                                  {statusChoices.map((s) => (
                                    <option key={s} value={s}>
                                      {COURSE_ENROLLMENT_STATUS_LABEL[s]}
                                    </option>
                                  ))}
                                </Select>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : null}

          {panel !== "courses" && panel !== "applicants" ? (
            <Card>
              <CardHeader>
                <h2 className="text-lg font-bold text-slate-900">{menu.find((x) => x.id === panel)?.label}</h2>
                <p className="text-sm text-slate-600">
                  {panel === "schedule" && "캘린더·예약 기능은 준비 중입니다. 운영팀에게 일정 변경을 알려 주세요."}
                  {panel === "notice" && "공지 에디터는 추후 제공됩니다. 지금은 수강 커뮤니케이션 채널을 활용해 주세요."}
                  {panel === "revenue" && "정산 대시보드는 준비 중입니다. 과거 정산표는 재무 안내 채널로 전달합니다."}
                </p>
              </CardHeader>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}
