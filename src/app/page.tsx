import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { BrandHeader } from "./brand-header";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [courses, sessions, segments, highlights, tocItems, consent] =
    await Promise.all([
      prisma.course.count(),
      prisma.session.count(),
      prisma.recordingSegment.count(),
      prisma.highlight.count(),
      prisma.tocItem.count(),
      prisma.recordingConsent.findFirst({ orderBy: { createdAt: "asc" } }),
    ]);

  const stats = [
    { label: "과정", value: courses },
    { label: "회차", value: sessions },
    { label: "올라온 녹음", value: segments },
    { label: "강조한 말", value: highlights },
    { label: "목차 항목", value: tocItems },
  ];

  // seed가 값을 고정해 두므로 데모에서는 이 주소로 강사 화면을 열 수 있다.
  const instructorPath = consent ? "/instructor/seed-instructor-token" : null;

  return (
    <>
      <BrandHeader />

      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-12">
        <h1 className="text-3xl font-bold tracking-tight text-navy">
          강의에서 다시 볼 것만 콕.
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          콕집은 매일 쌓이는 강의를 처음부터 다시 볼 필요 없이, 지금 다시 봐야
          할 내용만 골라 필요한 부분부터 효율적으로 복습할 수 있도록 도와주는
          학습 서비스입니다.
        </p>

        <section className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-5">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl border border-line bg-surface p-4"
            >
              <p className="text-2xl font-bold text-navy">{stat.value}</p>
              <p className="mt-0.5 text-xs text-muted">{stat.label}</p>
            </div>
          ))}
        </section>

        <section className="mt-6 rounded-xl border border-line bg-surface p-5">
          <h2 className="text-sm font-semibold text-navy">지금 할 수 있는 것</h2>
          <ul className="mt-3 space-y-2">
            <li>
              <Link
                href="/review"
                className="flex items-center justify-between rounded-lg bg-brand px-4 py-3 text-sm font-medium text-white"
              >
                학습자 화면 — 복습 순서와 다시 듣기
                <span aria-hidden>&gt;</span>
              </Link>
            </li>
            <li>
              <Link
                href="/upload"
                className="flex items-center justify-between rounded-lg bg-brand-soft px-4 py-3 text-sm font-medium text-brand"
              >
                학습자 화면 — 오늘 강의 올리기
                <span aria-hidden>&gt;</span>
              </Link>
            </li>
            {instructorPath && (
              <li>
                <Link
                  href={instructorPath}
                  className="flex items-center justify-between rounded-lg border border-line px-4 py-3 text-sm font-medium text-navy"
                >
                  강사 화면 — 학습 자료와 회차 차단
                  <span aria-hidden>&gt;</span>
                </Link>
              </li>
            )}
            <li>
              <Link
                href="/institution"
                className="flex items-center justify-between rounded-lg border border-line px-4 py-3 text-sm font-medium text-navy"
              >
                훈련기관 화면
                <span aria-hidden>&gt;</span>
              </Link>
            </li>
          </ul>
        </section>
      </main>
    </>
  );
}
