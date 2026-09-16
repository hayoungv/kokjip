import { prisma } from "@/lib/prisma";
import { BrandHeader } from "../brand-header";
import { UploadForm } from "./upload-form";

export const dynamic = "force-dynamic";

export default async function UploadPage() {
  const course = await prisma.course.findFirst({
    orderBy: { createdAt: "asc" },
    include: {
      enrollments: {
        where: { leftOn: null },
        include: { learner: { select: { id: true, name: true } } },
        orderBy: { joinedOn: "asc" },
      },
    },
  });

  if (!course) {
    return (
      <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-16">
        <h1 className="text-xl font-bold text-navy">과정이 없습니다</h1>
        <p className="mt-2 text-sm text-muted">
          먼저 <code className="rounded bg-canvas px-1">npm run db:seed</code>
          를 실행해 seed 데이터를 넣어 주세요.
        </p>
      </main>
    );
  }

  const learners = course.enrollments.map((e) => e.learner);

  return (
    <>
      <BrandHeader section="강의 기록 올리기" />
      <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-12">
        <p className="text-sm text-muted">{course.name}</p>

        <div className="mt-8">
          <UploadForm
            courseId={course.id}
            courseName={course.name}
            learners={learners}
          />
        </div>
      </main>
    </>
  );
}
