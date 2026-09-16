import { readHeadings } from "@/domain/heading";
import { normalizeToc, parseTocText, type TocItem } from "@/domain/toc";
import { extractFromFile, extractFromUrl, type MaterialPart } from "./extract";
import { MAX_FILE_BYTES, MAX_FILES, MAX_TEXT_CHARS } from "./limits";

/**
 * 자료 읽는 층.
 *
 * 형식마다 입구가 다르지만 나오는 것은 같다. 제목과 순서와 계층을 가진
 * 목차 항목의 목록이다. 이 층 바깥은 무엇이 들어왔는지 알지 못한다.
 *
 * 이 층은 목차를 확정하지 않는다. 확정은 강사가 한다.
 *
 * 글로 된 자료는 번호 매김 규칙으로 읽는다. 사진이나 PDF처럼 글자를
 * 뽑을 수 없는 자료는 강사가 직접 적는 길로 넘어간다.
 */

export type MaterialKind = "DOCUMENT" | "WEB_PAGE" | "IMAGE" | "TYPED";

export type MaterialInput =
  | { kind: "DOCUMENT" | "IMAGE"; files: File[] }
  | { kind: "WEB_PAGE"; url: string }
  | { kind: "TYPED"; text: string };

export type ReadOutcome =
  | { ok: true; items: TocItem[]; sourceName: string }
  | { ok: false; message: string; sourceName: string };

/** 자료가 어디서 왔는지. 본문이 아니라 이름이나 주소만 남긴다. */
function sourceNameOf(input: MaterialInput): string {
  if (input.kind === "WEB_PAGE") return input.url;
  if (input.kind === "TYPED") return "직접 적기";
  return input.files.map((f) => f.name).join(", ") || "이름 없는 파일";
}

export async function readMaterial(input: MaterialInput): Promise<ReadOutcome> {
  const sourceName = sourceNameOf(input);

  // 직접 적기는 읽을 것이 없다. 적은 그대로가 목차다.
  if (input.kind === "TYPED") {
    const items = parseTocText(input.text);
    return items.length > 0
      ? { ok: true, items, sourceName }
      : { ok: false, message: "적어 주신 목차가 비어 있습니다.", sourceName };
  }

  const gathered = await gather(input);
  if (!gathered.ok) return { ok: false, message: gathered.message, sourceName };

  const text = gathered.parts
    .map((part) => (part.as === "text" ? part.text : ""))
    .join("\n");

  const items = normalizeToc(readHeadings(text));
  return items.length > 0
    ? { ok: true, items, sourceName }
    : {
        ok: false,
        message: "이 자료에서 목차를 찾지 못했습니다. 목차를 직접 적어 주세요.",
        sourceName,
      };
}

type Gathered = { ok: true; parts: MaterialPart[] } | { ok: false; message: string };

/** 읽을 것을 모으고 분량을 잰다. */
async function gather(
  input: Exclude<MaterialInput, { kind: "TYPED" }>,
): Promise<Gathered> {
  if (input.kind === "WEB_PAGE") {
    const result = await extractFromUrl(input.url);
    return result.ok
      ? measure(result.parts)
      : { ok: false, message: result.failure.message };
  }

  if (input.files.length === 0) return { ok: false, message: "파일을 고르지 않았습니다." };
  if (input.files.length > MAX_FILES) {
    return { ok: false, message: `파일은 한 번에 ${MAX_FILES}개까지 올릴 수 있습니다.` };
  }

  const parts: MaterialPart[] = [];

  for (const file of input.files) {
    if (file.size > MAX_FILE_BYTES) {
      const limit = Math.floor(MAX_FILE_BYTES / (1024 * 1024));
      return { ok: false, message: `${file.name}이(가) ${limit}MB를 넘습니다.` };
    }

    const result = await extractFromFile(file);
    if (!result.ok) return { ok: false, message: result.failure.message };
    parts.push(...result.parts);
  }

  return measure(parts);
}

/**
 * 읽을 것이 있는지, 분량이 상한 안인지 본다.
 *
 * 글자를 뽑지 못한 자료는 여기서 걸러 강사가 직접 적는 길로 넘긴다.
 */
function measure(parts: MaterialPart[]): Gathered {
  const chars = parts.reduce((sum, p) => sum + (p.as === "text" ? p.text.length : 0), 0);

  if (chars === 0) {
    return {
      ok: false,
      message: "이 자료에서는 글자를 뽑지 못합니다. 목차를 직접 적어 주세요.",
    };
  }

  if (chars > MAX_TEXT_CHARS) {
    return {
      ok: false,
      message: `글자가 ${MAX_TEXT_CHARS.toLocaleString()}자를 넘습니다. 목차가 있는 쪽만 골라 올려 주세요.`,
    };
  }

  return { ok: true, parts };
}
