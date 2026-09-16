import Link from "next/link";
import { toDateOnly } from "@/domain/lag";
import { readInstructorView } from "@/server/api/instructor";
import { BrandHeader } from "../../brand-header";
import { ConsentForm } from "./consent-form";

export const dynamic = "force-dynamic";

export default async function InstructorPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const view = await readInstructorView(token);

  if (!view) {
    return (
      <>
        <BrandHeader section="강사" />
        <main className="mx-auto w-full max-w-lg flex-1 px-6 py-20">
          <h1 className="text-xl font-bold text-navy">이 주소는 열리지 않습니다</h1>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            주소가 잘못되었거나 유효 기간이 지났습니다. 훈련기관에 다시 요청해 주세요.
          </p>
        </main>
      </>
    );
  }

  if (!view.consentedAt) {
    return (
      <>
        <BrandHeader section="강사" />
        <main className="mx-auto w-full max-w-lg flex-1 px-6 py-12">
          <ConsentForm token={token} courseName={view.course.name} />
        </main>
      </>
    );
  }

  const openSessions = view.sessions.filter((s) => !s.blockedAt).length;

  return (
    <>
      <BrandHeader section="강사" />
      <main className="mx-auto w-full max-w-lg flex-1 px-6 py-12">
        <p className="text-sm text-muted">{view.instructorName} 강사님</p>
        <h1 className="mt-1 text-xl font-bold text-navy">{view.course.name}</h1>
        <p className="mt-2 text-xs text-muted">
          {toDateOnly(view.course.startDate)} ~ {toDateOnly(view.course.endDate)}
        </p>

        <div className="mt-6 rounded-xl bg-mint-soft px-4 py-3 text-sm text-mint">
          녹음을 허용한 과정입니다.
        </div>

        <div className="mt-8 space-y-3">
          <Link
            href={`/instructor/${token}/material`}
            className="block rounded-xl border border-line bg-surface p-5 transition hover:border-brand"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-navy">학습 자료와 목차</p>
              <span className="text-xs text-muted">
                {view.toc.length > 0 ? `목차 ${view.toc.length}개` : "아직 없음"}
              </span>
            </div>
            <p className="mt-1.5 text-sm text-muted">
              {view.toc.length > 0
                ? "목차를 바탕으로 복습 순서를 정합니다."
                : "교안을 올리면 목차를 읽어 복습 순서를 정합니다."}
            </p>
          </Link>

          <Link
            href={`/instructor/${token}/sessions`}
            className="block rounded-xl border border-line bg-surface p-5 transition hover:border-brand"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-navy">회차별 녹음 허용</p>
              <span className="text-xs text-muted">
                {view.sessions.length > 0
                  ? `열린 회차 ${openSessions}개`
                  : "아직 회차 없음"}
              </span>
            </div>
            <p className="mt-1.5 text-sm text-muted">
              특정 날짜의 녹음을 막거나 다시 열 수 있습니다.
            </p>
          </Link>
        </div>
      </main>
    </>
  );
}
