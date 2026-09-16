import { prisma } from "@/lib/prisma";
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
      <main className="mx-auto max-w-2xl px-6 py-16">
        <h1 className="text-xl font-semibold">과정이 없습니다</h1>
        <p className="mt-2 text-sm text-gray-600">
          먼저 <code className="rounded bg-gray-100 px-1">npm run db:seed</code>
          를 실행해 개발용 자료를 넣어 주세요.
        </p>
      </main>
    );
  }

  const learners = course.enrollments.map((e) => e.learner);

  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="text-xl font-semibold">옮긴 글 올리기</h1>
      <p className="mt-2 text-sm text-gray-600">{course.name}</p>

      <div className="mt-10">
        <UploadForm
          courseId={course.id}
          courseName={course.name}
          learners={learners}
        />
      </div>
    </main>
  );
}
