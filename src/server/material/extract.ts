import { MAX_TEXT_CHARS } from "./limits";

/**
 * 올라온 자료에서 판정에 넣을 것을 뽑는다.
 *
 * 형식마다 하는 일이 다르다. 글자를 뽑을 수 있으면 글자를 뽑고,
 * 뽑을 수 없으면 파일을 그대로 넘긴다. 어느 쪽이든 이 파일 바깥은
 * 무엇이 들어왔는지 알지 못한다.
 */

/** 판정 서비스가 그림으로 받는 형식. */
export type ImageMediaType = "image/png" | "image/jpeg" | "image/webp" | "image/gif";

/** 판정 서비스에 넣을 한 덩어리. */
export type MaterialPart =
  | { as: "text"; text: string }
  | { as: "image"; mediaType: ImageMediaType; base64: string }
  | { as: "document"; mediaType: "application/pdf"; base64: string };

export type ExtractFailure = {
  reason: "unsupported" | "empty" | "too-large" | "fetch-failed";
  message: string;
};

export type ExtractResult =
  | { ok: true; parts: MaterialPart[] }
  | { ok: false; failure: ExtractFailure };

const TEXT_TYPES = new Map<string, true>([
  ["txt", true],
  ["md", true],
  ["markdown", true],
  ["csv", true],
  ["html", true],
  ["htm", true],
]);

const IMAGE_TYPES = new Map<string, ImageMediaType>([
  ["png", "image/png"],
  ["jpg", "image/jpeg"],
  ["jpeg", "image/jpeg"],
  ["webp", "image/webp"],
  ["gif", "image/gif"],
]);

function extensionOf(name: string): string {
  const at = name.lastIndexOf(".");
  return at < 0 ? "" : name.slice(at + 1).toLowerCase();
}

/** 태그를 걷어 내고 글자만 남긴다. */
export function stripTags(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, "\n")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** 올라온 파일 하나에서 넣을 것을 뽑는다. */
export async function extractFromFile(file: File): Promise<ExtractResult> {
  const extension = extensionOf(file.name);

  if (TEXT_TYPES.has(extension)) {
    const raw = await file.text();
    const text = extension === "html" || extension === "htm" ? stripTags(raw) : raw.trim();
    if (text === "") {
      return { ok: false, failure: { reason: "empty", message: "파일에서 글자를 찾지 못했습니다." } };
    }
    return { ok: true, parts: [{ as: "text", text: text.slice(0, MAX_TEXT_CHARS) }] };
  }

  const imageType = IMAGE_TYPES.get(extension);
  if (imageType) {
    const base64 = Buffer.from(await file.arrayBuffer()).toString("base64");
    return { ok: true, parts: [{ as: "image", mediaType: imageType, base64 }] };
  }

  if (extension === "pdf") {
    const base64 = Buffer.from(await file.arrayBuffer()).toString("base64");
    return { ok: true, parts: [{ as: "document", mediaType: "application/pdf", base64 }] };
  }

  return {
    ok: false,
    failure: {
      reason: "unsupported",
      message: `${extension ? `.${extension} ` : ""}형식에서는 글자를 뽑지 못합니다. 목차를 직접 적어 주세요.`,
    },
  };
}

/** 겉 껍데기만 왔는지 가려내는 표시들. */
const SHELL_MARKS = [
  "JavaScript must be enabled",
  "Please enable JavaScript",
  "자바스크립트를 사용",
  "noscript",
];

/** 내용이 오지 않고 겉 껍데기만 왔는지. */
export function isShell(text: string): boolean {
  if (text.trim().length < 300) return true;
  return SHELL_MARKS.some((mark) => text.includes(mark));
}

/**
 * 공개된 웹 페이지에서 글자를 뽑는다.
 *
 * 내용을 화면에서 그려 내는 페이지는 주소를 열어도 겉 껍데기만 온다.
 * 노션이 그렇다. 그런 페이지는 읽지 못한다고 알리고 강사가 직접 적는
 * 길로 넘긴다. 사이트마다 다른 내부 경로를 쫓지 않는다. 그 경로는
 * 공개된 약속이 아니라 언제든 바뀐다.
 */
export async function extractFromUrl(url: string): Promise<ExtractResult> {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return { ok: false, failure: { reason: "fetch-failed", message: "주소의 모양이 올바르지 않습니다." } };
  }

  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    return { ok: false, failure: { reason: "fetch-failed", message: "웹 주소만 받습니다." } };
  }

  let html: string;
  try {
    const response = await fetch(parsed, {
      headers: { "user-agent": "kokjip/1.0" },
      redirect: "follow",
    });
    if (!response.ok) {
      return { ok: false, failure: { reason: "fetch-failed", message: `페이지를 열지 못했습니다. (${response.status})` } };
    }
    html = await response.text();
  } catch {
    return { ok: false, failure: { reason: "fetch-failed", message: "페이지를 열지 못했습니다." } };
  }

  const text = stripTags(html);

  if (isShell(text)) {
    return {
      ok: false,
      failure: {
        reason: "empty",
        message:
          "이 페이지는 내용을 화면에서 그려 내는 방식이라 주소만으로는 읽지 못합니다. 목차를 직접 적어 주세요.",
      },
    };
  }

  return { ok: true, parts: [{ as: "text", text: text.slice(0, MAX_TEXT_CHARS) }] };
}
