import { redirect } from "next/navigation";
import { BrandHeader } from "@/app/brand-header";
import { LAG_THRESHOLD_DAYS } from "@/domain/lag";
import { readSession, endSession } from "@/lib/session";
import { readInstitutionView } from "@/server/api/institution";
import { ConsentPanel } from "./consent-panel";

export const dynamic = "force-dynamic";

async function logout() {
  "use server";
  await endSession();
  redirect("/institution/login");
}

export default async function InstitutionPage() {
  const adminId = await readSession();
  if (!adminId) redirect("/institution/login");

  const view = await readInstitutionView(adminId);
  if (!view) redirect("/institution/login");

  const lagging = view.courses.flatMap((c) =>
    c.learners.filter((l) => l.lagging),
  );
  const totalLearners = view.courses.reduce(
    (sum, c) => sum + c.learners.length,
    0,
  );

  return (
    <>
      <BrandHeader section="훈련기관" />

      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-8">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-navy">
              {view.institutionName}
            </h1>
            <p className="mt-1 text-sm text-muted">
              복습 현황을 확인하고 뒤처지는 수강생에게 연락합니다.
            </p>
          </div>
          <form action={logout}>
            <button
              type="submit"
              className="rounded-lg bg-canvas px-3 py-2 text-xs text-muted"
            >
              나가기
            </button>
          </form>
        </div>

        <section className="mt-8 grid grid-cols-3 gap-3">
          <div className="rounded-xl border border-line bg-surface p-4">
            <p className="text-2xl font-bold text-navy">{totalLearners}</p>
            <p className="mt-0.5 text-xs text-muted">수강생</p>
          </div>
          <div className="rounded-xl border border-line bg-surface p-4">
            <p className="text-2xl font-bold text-navy">
              {view.courses.length}
            </p>
            <p className="mt-0.5 text-xs text-muted">운영 과정</p>
          </div>
          <div
            className={`rounded-xl border p-4 ${
              lagging.length > 0
                ? "border-danger bg-danger-bg"
                : "border-line bg-surface"
            }`}
          >
            <p
              className={`text-2xl font-bold ${
                lagging.length > 0 ? "text-danger" : "text-navy"
              }`}
            >
              {lagging.length}
            </p>
            <p
              className={`mt-0.5 text-xs ${
                lagging.length > 0 ? "text-danger" : "text-muted"
              }`}
            >
              확인 필요
            </p>
          </div>
        </section>

        {view.courses.map((course) => (
          <section
            key={course.id}
            className="mt-6 rounded-xl border border-line bg-surface"
          >
            <div className="border-b border-line px-5 py-4">
              <h2 className="text-sm font-semibold text-navy">{course.name}</h2>
              <p className="mt-0.5 text-xs text-muted">
                강의가 올라온 날 {course.lectureDays}일 · 수강생{" "}
                {course.learners.length}명
              </p>
            </div>

            <ConsentPanel
              courseId={course.id}
              instructorName={course.consent.instructorName}
              instructorEmail={course.consent.instructorEmail}
              consented={course.consent.consentedAt !== null}
              reminderCount={course.consent.reminderCount}
              tocCount={course.consent.tocCount}
            />

            <ul className="divide-y divide-line">
              {course.learners.map((learner) => (
                <li
                  key={learner.learnerId}
                  className="flex flex-wrap items-center gap-3 px-5 py-3.5"
                >
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-brand-soft text-xs font-bold text-brand">
                    {learner.name.slice(0, 1)}
                  </span>

                  <div className="min-w-0">
                    <p className="text-sm font-medium text-navy">
                      {learner.name}
                    </p>
                    <p className="text-[11px] text-muted">
                      {learner.lastViewedDate
                        ? `마지막 복습 ${learner.lastViewedDate}`
                        : "복습 기록 없음"}
                    </p>
                  </div>

                  <div className="ml-auto text-right">
                    {learner.lagging ? (
                      <span className="rounded-md bg-danger-bg px-2.5 py-1 text-xs font-medium text-danger">
                        {learner.missedDays}일째 열지 않음
                      </span>
                    ) : learner.missedDays > 0 ? (
                      <span className="rounded-md bg-warning-bg px-2.5 py-1 text-xs text-warning">
                        {learner.missedDays}일째 열지 않음
                      </span>
                    ) : (
                      <span className="rounded-md bg-mint-soft px-2.5 py-1 text-xs text-mint">
                        복습 중
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ))}

        <p className="mt-6 rounded-lg bg-canvas p-4 text-xs leading-relaxed text-muted">
          복습 목록을 {LAG_THRESHOLD_DAYS}일 연속 열지 않으면 확인이 필요한
          것으로 봅니다. 강의가 올라온 날만 세므로 강의가 없는 날은 연속을 끊지도
          올리지도 않습니다. 이 화면에서 강의 내용이나 복습 목록의 내용은 볼 수
          없습니다.
        </p>
      </main>
    </>
  );
}
