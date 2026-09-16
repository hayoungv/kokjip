import { z } from "zod";

/**
 * 녹음 올리기 입력 검증.
 *
 * 검증하지 않고 도메인 계층으로 넘어가는 길을 만들지 않는다.
 */

/** 기기 시계와 서버 시계의 차이로 받아들일 수 있는 한계. */
export const MAX_CLOCK_OFFSET_MS = 6 * 60 * 60 * 1000;

const timeRangeSchema = z
  .object({
    fromAt: z.coerce.date(),
    toAt: z.coerce.date(),
  })
  .refine((r) => r.fromAt.getTime() < r.toAt.getTime(), {
    message: "시작 시각이 끝 시각보다 앞서야 합니다.",
  });

const blockSchema = z.object({
  offsetMs: z.number().int().min(0),
  text: z.string().min(1),
});

export const uploadSegmentSchema = z
  .object({
    courseId: z.string().min(1),
    learnerId: z.string().min(1),

    /** 같은 녹음을 두 번 보내도 한 번만 받기 위한 식별자 */
    clientKey: z.string().min(1).max(200),

    /** 녹음이 시작된 실제 시각 */
    startedAt: z.coerce.date(),
    /** 녹음이 끝난 실제 시각 */
    endedAt: z.coerce.date(),

    /** 녹음이 멈춰 소리가 없는 구간 */
    gaps: z.array(timeRangeSchema).default([]),

    /** 기기 시계가 서버보다 얼마나 앞서 있는지 (밀리초) */
    clockOffsetMs: z
      .number()
      .int()
      .min(-MAX_CLOCK_OFFSET_MS, {
        message: "기기 시계가 너무 뒤처져 있습니다.",
      })
      .max(MAX_CLOCK_OFFSET_MS, {
        message: "기기 시계가 너무 앞서 있습니다.",
      })
      .default(0),

    /** 강의 기록 */
    blocks: z.array(blockSchema).min(1, {
      message: "강의 기록이 비어 있습니다.",
    }),
  })
  .refine((v) => v.startedAt.getTime() < v.endedAt.getTime(), {
    message: "녹음 시작 시각이 끝 시각보다 앞서야 합니다.",
    path: ["endedAt"],
  })
  .refine(
    (v) =>
      v.gaps.every(
        (g) =>
          g.fromAt.getTime() >= v.startedAt.getTime() &&
          g.toAt.getTime() <= v.endedAt.getTime(),
      ),
    {
      message: "멈춘 구간이 녹음 범위를 벗어났습니다.",
      path: ["gaps"],
    },
  )
  .refine(
    (v) => {
      const last = v.blocks[v.blocks.length - 1];
      const lengthMs = v.endedAt.getTime() - v.startedAt.getTime();
      return last.offsetMs <= lengthMs;
    },
    {
      message: "강의 기록의 마지막 지점이 녹음 길이를 넘었습니다.",
      path: ["blocks"],
    },
  );

export type UploadSegmentInput = z.infer<typeof uploadSegmentSchema>;
