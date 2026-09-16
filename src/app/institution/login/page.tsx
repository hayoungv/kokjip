import { redirect } from "next/navigation";
import { BrandHeader } from "@/app/brand-header";
import { readSession } from "@/lib/session";
import { LoginForm } from "./login-form";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  if (await readSession()) redirect("/institution");

  return (
    <>
      <BrandHeader section="훈련기관" />

      <main className="mx-auto w-full max-w-sm flex-1 px-6 py-16">
        <h1 className="text-xl font-bold text-navy">훈련기관 담당자</h1>
        <p className="mt-1.5 text-sm text-muted">
          수강생의 복습 현황을 확인합니다.
        </p>

        <LoginForm />

        <p className="mt-6 rounded-lg bg-canvas p-3 text-xs leading-relaxed text-muted">
          확인용 계정은 <b className="text-navy">admin@example.com</b> 이고
          비밀번호는 <b className="text-navy">kokjip</b> 입니다.
        </p>
      </main>
    </>
  );
}
