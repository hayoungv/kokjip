import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { BrandHeader } from "./brand-header";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [institutions, courses, sessions, segments, tasks] = await Promise.all([
    prisma.institution.count(),
    prisma.course.count(),
    prisma.session.count(),
    prisma.recordingSegment.count(),
    prisma.judgementTask.count({ where: { status: "PENDING" } }),
  ]);

  const stats = [
    { label: "훈련기관", value: institutions },
    { label: "과정", value: courses },
    { label: "회차", value: sessions },
    { label: "올라온 녹음", value: segments },
    { label: "판정 대기", value: tasks },
  ];

  return (
    <>
      <BrandHeader />

      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-12">
        <h1 className="text-2xl font-bold tracking-tight text-navy">
          강사가 강조한 대목부터 복습합니다
        </h1>
        <p className="mt-2 text-sm text-muted">
          강의 녹음에서 강사가 실무 중요도를 직접 말한 대목을 찾아 복습 순서를
          정해 줍니다.
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
                href="/upload"
                className="flex items-center justify-between rounded-lg bg-brand-soft px-4 py-3 text-sm font-medium text-brand"
              >
                옮긴 글 올리기
                <span aria-hidden>→</span>
              </Link>
            </li>
          </ul>
        </section>
      </main>
    </>
  );
}
