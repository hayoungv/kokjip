"use server";

import { uploadSegment } from "@/server/api/segments";
import { uploadSegmentSchema } from "@/validation/segment";

export type SubmitState =
  | { ok: true; lines: string[] }
  | { ok: false; error: string };

export async function submitSegment(raw: unknown): Promise<SubmitState> {
  const parsed = uploadSegmentSchema.safeParse(raw);

  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { ok: false, error: first?.message ?? "입력이 올바르지 않습니다." };
  }

  try {
    const result = await uploadSegment(parsed.data);

    if (result.alreadyUploaded) {
      return {
        ok: true,
        lines: [
          `${result.sessionDate} 회차에 이미 올라온 녹음입니다. 다시 처리하지 않았습니다.`,
        ],
      };
    }

    const fmt = (d: Date) =>
      new Intl.DateTimeFormat("ko-KR", {
        timeZone: "Asia/Seoul",
        hour: "2-digit",
        minute: "2-digit",
      }).format(d);

    const lines = [
      `${result.sessionDate} 회차에 등록했습니다.`,
      result.isCanonical
        ? "이 회차의 첫 녹음이라 정본이 되었습니다."
        : "이미 정본이 있어 덮이지 않은 구간만 처리합니다.",
    ];

    if (result.queuedRanges.length === 0) {
      lines.push("이미 처리된 구간이라 판정할 것이 없습니다.");
    } else {
      lines.push(
        `판정 대기열에 ${result.queuedRanges.length}개 구간을 넣었습니다.`,
        ...result.queuedRanges.map(
          (r) => `  ${fmt(r.fromAt)} ~ ${fmt(r.toAt)}`,
        ),
      );
    }

    return { ok: true, lines };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "알 수 없는 오류입니다.";
    return { ok: false, error: message };
  }
}
