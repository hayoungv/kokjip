import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function Home() {
  const institutionCount = await prisma.institution.count();

  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="text-2xl font-semibold">콕집</h1>
      <p className="mt-2 text-sm text-gray-600">
        강사가 강조한 대목으로 복습 순서를 정해 주는 서비스
      </p>

      <section className="mt-10 rounded-lg border border-gray-200 p-5">
        <h2 className="text-sm font-medium text-gray-900">연결 확인</h2>
        <dl className="mt-3 space-y-1 text-sm text-gray-600">
          <div className="flex gap-2">
            <dt>데이터베이스</dt>
            <dd className="font-medium text-gray-900">연결됨</dd>
          </div>
          <div className="flex gap-2">
            <dt>등록된 훈련기관</dt>
            <dd className="font-medium text-gray-900">{institutionCount}곳</dd>
          </div>
        </dl>
      </section>
    </main>
  );
}
