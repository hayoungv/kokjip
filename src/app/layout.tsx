import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "콕집 — 강의에서 다시 볼 것만 콕.",
  description:
    "콕집은 매일 쌓이는 강의를 처음부터 다시 볼 필요 없이, 지금 다시 봐야 할 내용만 골라 필요한 부분부터 효율적으로 복습할 수 있도록 도와주는 학습 서비스입니다.",
  icons: { icon: "/brand/icon.png" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
