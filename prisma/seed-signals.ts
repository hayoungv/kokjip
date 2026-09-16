import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import xlsx from "xlsx";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { parseTranscript } from "../src/domain/transcript";

/**
 * 실측 판정 결과 seed.
 *
 * 실측 판정 결과를 넣는다.
 *
 * 선행 검증에서 사람이 확정한 강조 대목 53건을 실제 강의 전사본 위에 얹는다.
 * 지어낸 값이 아니라 측정된 값이므로, 데모에서 보이는 내용이 곧 검증 결과다.
 *
 * 쓰는 자료
 *   - 옮긴 글 원문 2개 (26일 세 교시, 27일 한 교시)
 *   - 판정 결과 엑셀 (원래 후보 68건 + 새로 찾은 43건)
 */

const RESEARCH = "C:/Users/X8893/workspace/business-research-kokjip/콕집";

const TRANSCRIPTS = [
  { day: "26일", file: "[26일] 강의 STT.txt" },
  { day: "27일", file: "[27일] 강의 STT.txt" },
];

const CLASSIFICATION = "KOKJIP_Signal_AI_Classification_v0_2.xlsx";
const DATASET = "KOKJIP_Signal_Dataset_v0.1_HumanReview.xlsx";

/** 과정 시작일. 26일 회차와 27일 회차를 이틀로 나눠 놓는다. */
const DAY_26 = "2026-03-02";
const DAY_27 = "2026-03-03";

/** 각 교시가 시작하는 시각. */
const PERIOD_START: Record<number, string> = {
  1: "09:00",
  2: "11:00",
  3: "14:00",
};

const TYPES = [
  "AVOID",
  "PRACTICAL",
  "CORE",
  "EMPHASIS",
  "MUST",
  "RATIONALE",
  "INSIGHT",
  "REVIEW",
] as const;
type HighlightTypeName = (typeof TYPES)[number];

const adapter = new PrismaPg({
  connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

/** `01:23:45` 또는 `23:45`를 밀리초로 바꾼다. */
function toMs(raw: unknown): number | null {
  const parts = String(raw ?? "").trim().split(":").map(Number);
  if (parts.some(Number.isNaN)) return null;
  if (parts.length === 2) return (parts[0] * 60 + parts[1]) * 1000;
  if (parts.length === 3)
    return ((parts[0] * 60 + parts[1]) * 60 + parts[2]) * 1000;
  return null;
}

/** 날짜 칸에서 몇 일 몇 교시인지 읽는다. 교시가 없으면 1교시로 본다. */
function readDayPeriod(raw: unknown): { day: string; period: number } | null {
  const text = String(raw ?? "");
  const day = text.includes("26일") ? "26일" : text.includes("27일") ? "27일" : null;
  if (!day) return null;
  const matched = /(\d)\s*교시/.exec(text);
  return { day, period: matched ? Number(matched[1]) : 1 };
}

/** 대조하기 좋게 공백과 문장부호를 지운다. */
function normalize(text: unknown): string {
  return String(text ?? "")
    .replace(/\s+/g, "")
    .replace(/[.,?!'"“”‘’·…\-—]/g, "");
}

type Signal = {
  sourceId: string;
  day: string;
  period: number;
  offsetMs: number;
  type: HighlightTypeName;
  strength: number;
  quote: string;
};

/** 엑셀에서 사람이 확정한 대목만 뽑는다. */
function readConfirmedSignals(): Signal[] {
  const book = xlsx.readFile(path.join(RESEARCH, CLASSIFICATION));
  const signals: Signal[] = [];

  // 원래 후보 시트에는 강사 발화 원문 칸이 없다.
  // 아이디로 후보 목록과 이어 붙여 원문을 가져온다.
  const dataset = xlsx.utils.sheet_to_json<Record<string, unknown>>(
    xlsx.readFile(path.join(RESEARCH, DATASET)).Sheets["Signal Dataset"],
    { defval: null },
  );
  const quoteById = new Map<string, string>();
  for (const row of dataset) {
    const quote = String(row["강사 발화 근거"] ?? "").trim();
    if (quote) quoteById.set(String(row["ID"]), quote);
  }

  const sheets: Array<{ name: string; typeKey: string; strengthKey: string }> = [
    { name: "Comparison", typeKey: "Human Type", strengthKey: "Human 강도" },
    {
      name: "New Findings Reclass",
      typeKey: "Human Type",
      strengthKey: "Human 강도",
    },
  ];

  for (const sheet of sheets) {
    const rows = xlsx.utils.sheet_to_json<Record<string, unknown>>(
      book.Sheets[sheet.name],
      { defval: null },
    );

    for (const row of rows) {
      if (String(row["Human Signal"]) !== "Y") continue;

      const where = readDayPeriod(row["날짜"]);
      const offsetMs = toMs(row["타임스탬프"]);
      const type = String(row[sheet.typeKey] ?? "") as HighlightTypeName;
      const quote =
        String(row["강사 발화 근거"] ?? "").trim() ||
        quoteById.get(String(row["ID"])) ||
        "";
      const strength = Number(row[sheet.strengthKey] ?? 2);

      if (!where || offsetMs === null || !TYPES.includes(type) || !quote) {
        continue;
      }

      signals.push({
        sourceId: String(row["ID"]),
        day: where.day,
        period: where.period,
        offsetMs,
        type,
        strength: Number.isFinite(strength) ? Math.min(3, Math.max(1, strength)) : 2,
        quote,
      });
    }
  }

  return signals;
}

async function main() {
  const course = await prisma.course.findUnique({
    where: { id: "seed-course" },
    include: { enrollments: true },
  });
  if (!course) {
    throw new Error("먼저 npm run db:seed 로 과정을 만들어 주세요.");
  }

  const learnerId = course.enrollments[0]?.learnerId;
  if (!learnerId) throw new Error("과정에 학습자가 없습니다.");

  // 이전 결과를 지우고 다시 넣는다.
  await prisma.session.deleteMany({ where: { courseId: course.id } });

  const signals = readConfirmedSignals();
  console.log(`사람이 확정한 대목 ${signals.length}건을 읽었습니다.`);

  let matched = 0;
  let unmatched = 0;

  for (const { day, file } of TRANSCRIPTS) {
    const text = fs.readFileSync(path.join(RESEARCH, file), "utf8");
    const recordings = parseTranscript(text);
    const date = day === "26일" ? DAY_26 : DAY_27;

    const session = await prisma.session.create({
      data: { courseId: course.id, date: new Date(`${date}T00:00:00Z`) },
    });

    for (const [index, recording] of recordings.entries()) {
      const period = index + 1;
      const startedAt = new Date(
        `${date}T${PERIOD_START[period] ?? "09:00"}:00+09:00`,
      );
      const endedAt = new Date(
        startedAt.getTime() + recording.lastOffsetMs + 60_000,
      );

      const segment = await prisma.recordingSegment.create({
        data: {
          sessionId: session.id,
          learnerId,
          clientKey: `${day}-${period}교시`,
          startedAt,
          endedAt,
          gaps: [],
          clockOffsetMs: 0,
          isCanonical: index === 0,
          transcript: {
            create: {
              blocks: recording.blocks.map((b) => ({
                at: new Date(startedAt.getTime() + b.offsetMs).toISOString(),
                text: b.text,
              })),
            },
          },
        },
      });

      await prisma.coveredRange.create({
        data: { sessionId: session.id, fromAt: startedAt, toAt: endedAt },
      });

      const mine = signals.filter((s) => s.day === day && s.period === period);

      for (const signal of mine) {
        // 인용문이 실제로 그 자리에 있는지 대조한다.
        // 맞으면 그 덩어리의 시각을 쓰고, 못 찾으면 엑셀의 시각을 그대로 쓴다.
        const needle = normalize(signal.quote).slice(0, 12);
        const found = recording.blocks.find(
          (b) => needle.length >= 6 && normalize(b.text).includes(needle),
        );

        if (found) matched += 1;
        else unmatched += 1;

        const offsetMs = found ? found.offsetMs : signal.offsetMs;

        await prisma.highlight.upsert({
          where: {
            sessionId_occurredAt_type: {
              sessionId: session.id,
              occurredAt: new Date(startedAt.getTime() + offsetMs),
              type: signal.type,
            },
          },
          create: {
            sessionId: session.id,
            sourceSegmentId: segment.id,
            type: signal.type,
            strength: signal.strength,
            quote: signal.quote,
            occurredAt: new Date(startedAt.getTime() + offsetMs),
          },
          update: {},
        });
      }

      console.log(
        `  ${day} ${period}교시 — 덩어리 ${recording.blocks.length}개 · 강조 대목 ${mine.length}건`,
      );
    }
  }

  const total = await prisma.highlight.count();
  const byType = await prisma.highlight.groupBy({
    by: ["type"],
    _count: true,
    orderBy: { _count: { type: "desc" } },
  });

  console.log(`\n넣은 강조 대목 ${total}건`);
  console.log(`  인용문이 원문과 맞은 것 ${matched}건 / 못 찾은 것 ${unmatched}건`);
  console.log("  유형별: " + byType.map((r) => `${r.type} ${r._count}`).join(" · "));
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
