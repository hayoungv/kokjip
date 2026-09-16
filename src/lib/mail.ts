/**
 * 안내 발송.
 *
 * 무료 구간의 발송 서비스를 쓴다. 설정이 없으면 보내지 않고 그 사실을
 * 그대로 돌려준다. 보내지 못했다고 해서 일이 멈추지는 않는다.
 * 훈련기관이 주소를 직접 전할 수 있기 때문이다.
 */

export type SendResult =
  | { sent: true }
  | { sent: false; reason: "not-configured" | "failed"; message: string };

function isConfigured(): boolean {
  return Boolean(process.env.MAIL_API_KEY && process.env.MAIL_FROM);
}

export async function sendConsentInvite(
  to: string,
  name: string,
  url: string,
): Promise<SendResult> {
  if (!isConfigured()) {
    return {
      sent: false,
      reason: "not-configured",
      message: "발송 서비스가 연결되지 않았습니다. 아래 주소를 강사에게 직접 전해 주세요.",
    };
  }

  const body = [
    `${name} 강사님께`,
    "",
    "담당 과정의 강의 녹음 허용을 여쭙습니다.",
    "아래 주소를 열어 내용을 확인하고 동의해 주세요.",
    "",
    url,
    "",
    "동의하신 뒤에도 회차마다 녹음을 막을 수 있습니다.",
  ].join("\n");

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        authorization: `Bearer ${process.env.MAIL_API_KEY}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.MAIL_FROM,
        to,
        subject: "[콕집] 강의 녹음 허용을 여쭙습니다",
        text: body,
      }),
    });

    if (!response.ok) {
      return { sent: false, reason: "failed", message: `보내지 못했습니다. (${response.status})` };
    }
    return { sent: true };
  } catch {
    return { sent: false, reason: "failed", message: "보내지 못했습니다." };
  }
}
