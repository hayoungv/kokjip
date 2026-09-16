import Link from "next/link";
import { BrandHeader } from "@/app/brand-header";
import { prisma } from "@/lib/prisma";
import { listSessions } from "@/server/api/review";

export const dynamic = "force-dynamic";

function dateLabel(date: Date): string {
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    month: "long",
    day: "numeric",
    weekday: "short",
  }).format(date);
}

export default async function ReviewIndexPage() {
  const learner = await prisma.learner.findFirst({
    orderBy: { joinedAt: "asc" },
  });

  const sessions = learner ? await listSessions(learner.id) : [];

  return (
    <>
      <BrandHeader section="내 수업" />

      <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-8">
        <h1 className="text-2xl font-bold text-navy">복습할 수업</h1>
        <p className="mt-1 text-sm text-muted">
          {learner ? `${learner.name}님의 수업입니다.` : "학습자가 없습니다."}
        </p>

        {sessions.length === 0 ? (
          <p className="mt-8 rounded-xl border border-line bg-surface p-5 text-sm text-muted">
            아직 올라온 수업이 없습니다.
          </p>
        ) : (
          <ul className="mt-6 space-y-3">
            {sessions.map((session) => (
              <li key={session.id}>
                <Link
                  href={`/review/${session.id}`}
                  className="block rounded-xl border border-line bg-surface p-5 transition hover:border-brand"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-navy">
                      {dateLabel(session.date)}
                    </span>
                    {session.blockedAt && (
                      <span className="rounded bg-danger-bg px-2 py-0.5 text-[11px] text-danger">
                        녹음 차단
                      </span>
                    )}
                  </div>

                  <p className="mt-2 text-xs text-muted">
                    녹음 {session._count.segments}개 · 먼저 볼 대목{" "}
                    <b className="text-brand">{session._count.highlights}개</b>
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </>
  );
}
