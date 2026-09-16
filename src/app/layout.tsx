import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "콕집",
  description:
    "강사가 실무에서 중요하다고 직접 말한 대목으로 복습 순서를 정해 주는 서비스",
  icons: { icon: "/brand/icon.png" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
