import { notFound } from "next/navigation";
import { BrandHeader } from "@/app/brand-header";
import { prisma } from "@/lib/prisma";
import { readReviewDay, recordListView } from "@/server/api/review";
import { ReviewList } from "./review-list";

export const dynamic = "force-dynamic";

function dateLabel(date: Date): string {
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  }).format(date);
}

export default async function ReviewPage({
  params,
}: PageProps<"/review/[sessionId]">) {
  const { sessionId } = await params;
  const day = await readReviewDay(sessionId);

  if (!day) notFound();

  // 화면이 열린 것을 기록한다. 뒤처짐 판정의 유일한 근거다.
  const learner = await prisma.learner.findFirst({
    orderBy: { joinedAt: "asc" },
  });
  if (learner) {
    await recordListView(learner.id, sessionId);
  }

  return (
    <>
      <BrandHeader section="오늘의 복습" />

      <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-8">
        <ReviewList
          sessionId={day.sessionId}
          dateLabel={dateLabel(day.date)}
          segments={day.segments.map((s) => ({ id: s.id, label: s.label }))}
          items={day.items.map((item) => ({
            id: item.id,
            type: item.type,
            strength: item.strength,
            quote: item.quote,
            occurredAtIso: item.occurredAt.toISOString(),
            segment: item.segment,
          }))}
        />
      </main>
    </>
  );
}
