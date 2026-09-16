import { notFound } from "next/navigation";
import { PhoneFrame } from "@/app/phone-frame";
import { typeName, type HighlightTypeName } from "@/domain/highlight-type";
import { formatElapsed } from "@/domain/time";
import { prisma } from "@/lib/prisma";
import { readTranscript } from "@/server/api/review";

export const dynamic = "force-dynamic";

export default async function TranscriptPage({
  params,
}: PageProps<"/review/[sessionId]/transcript">) {
  const { sessionId } = await params;

  const [segments, highlights] = await Promise.all([
    readTranscript(sessionId),
    prisma.highlight.findMany({
      where: { sessionId },
      select: { occurredAt: true, type: true },
    }),
  ]);

  if (segments.length === 0) notFound();

  // 강조 말이 붙은 시각을 표시해 두기 위해 모아 둔다.
  const marked = new Map<number, HighlightTypeName>();
  for (const h of highlights) {
    marked.set(h.occurredAt.getTime(), h.type as HighlightTypeName);
  }

  const totalBlocks = segments.reduce((sum, s) => sum + s.blocks.length, 0);

  return (
    <PhoneFrame section="강의 기록 전체" back={`/review/${sessionId}`}>
      <p className="text-xl font-bold text-navy">강의 기록 전체</p>
      <p className="mt-1 text-xs text-muted">
        덩어리 {totalBlocks.toLocaleString()}개 · 화자를 구분하지 않습니다
      </p>

      <p className="mt-4 rounded-lg bg-warning-bg p-3 text-xs leading-relaxed text-warning">
          복습 목록이 놓친 말이 있을 수 있어 강의 기록 전체를 그대로 둡니다.
          질의응답도 함께 들어 있으며 누가 말했는지는 기록하지 않습니다.
        </p>

      {segments.map((segment) => (
        <section key={segment.id} className="mt-6">
          <h2 className="sticky top-0 bg-canvas py-2 text-sm font-semibold text-navy">
              {segment.label}
            </h2>

            <ol className="mt-2 space-y-1">
              {segment.blocks.map((block, index) => {
                const type = marked.get(block.at.getTime());

                return (
                  <li
                    key={index}
                    className={`flex gap-3 rounded-lg px-3 py-2 text-sm leading-relaxed ${
                      type
                        ? "bg-brand-soft"
                        : "bg-surface"
                    }`}
                  >
                    <span className="shrink-0 pt-0.5 font-mono text-[11px] text-muted">
                      {formatElapsed(block.elapsedMs)}
                    </span>
                    <span className={type ? "font-medium text-navy" : "text-navy"}>
                      {block.text}
                      {type && (
                        <span className="ml-2 rounded bg-brand px-1.5 py-0.5 align-middle text-[10px] text-white">
                          {typeName(type)}
                        </span>
                      )}
                    </span>
                  </li>
                );
              })}
            </ol>
        </section>
      ))}
    </PhoneFrame>
  );
}
