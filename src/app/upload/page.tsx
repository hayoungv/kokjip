import { toDateOnly } from "@/domain/lag";
import { prisma } from "@/lib/prisma";
import { canRecordOn } from "@/server/api/instructor";
import { PhoneFrame } from "../phone-frame";
import { UploadForm } from "./upload-form";

export const dynamic = "force-dynamic";

/**
 * 학습자의 녹음 화면.
 *
 * 앱에서는 녹음 버튼을 누르면 기기가 녹음하고 기기 안에서 글로 옮겨
 * 스스로 올린다. 웹 데모에는 마이크가 없으므로 이미 글로 옮긴 파일을
 * 골라 올리는 것으로 그 자리를 대신한다. 서버가 받는 것과 지켜야 할
 * 규칙은 앱에서 올릴 때와 똑같다.
 */

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
      <PhoneFrame section="녹음" tab="/upload">
        <h1 className="text-xl font-bold text-navy">과정이 없습니다</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          먼저 <code className="rounded bg-canvas px-1">npm run db:seed</code>를
          실행해 seed를 넣어 주세요.
        </p>
      </PhoneFrame>
    );
  }

  const learners = course.enrollments.map((e) => e.learner);
  const first = learners[0];

  // 강사가 동의했는지, 오늘 회차를 막았는지 본다.
  const permission = first
    ? await canRecordOn(first.id, new Date())
    : { allowed: false, reason: "no-enrollment" as const, message: "학습자가 없습니다." };

  return (
    <PhoneFrame section="녹음" tab="/upload">
      <p className="text-xs text-muted">{course.name}</p>
      <h1 className="mt-1 text-xl font-bold text-navy">오늘 강의 올리기</h1>

      {permission.allowed ? (
        <p className="mt-3 rounded-xl bg-mint-soft px-4 py-3 text-sm text-mint">
          {toDateOnly(new Date())} · 녹음할 수 있습니다.
        </p>
      ) : (
        <p className="mt-3 rounded-xl bg-warning-bg px-4 py-3 text-sm text-warning">
          {permission.message}
        </p>
      )}

      <p className="mt-4 rounded-xl bg-canvas px-4 py-3 text-xs leading-relaxed text-muted">
        앱에서는 녹음 버튼을 누르면 기기가 녹음하고, 기기 안에서 글로 옮겨 스스로
        올립니다. 음성은 기기를 떠나지 않습니다. 이 웹 화면에는 마이크가 없으므로
        이미 글로 옮긴 파일을 골라 그 자리를 대신합니다.
      </p>

      {permission.allowed && (
        <div className="mt-6">
          <UploadForm
            courseId={course.id}
            courseName={course.name}
            learners={learners}
          />
        </div>
      )}
    </PhoneFrame>
  );
}
