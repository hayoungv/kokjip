import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

/**
 * 개발용 씨앗 데이터.
 *
 * 훈련기관 하나, 과정 하나, 강사 하나, 학습자 둘을 넣는다.
 * 실제 데이터가 아니라 화면을 만들며 확인하기 위한 것이다.
 */

const adapter = new PrismaPg({
  connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  const institution = await prisma.institution.upsert({
    where: { id: "seed-institution" },
    create: { id: "seed-institution", name: "한빛직업전문학교" },
    update: {},
  });

  const instructor = await prisma.instructor.upsert({
    where: { id: "seed-instructor" },
    create: {
      id: "seed-instructor",
      name: "이준혁",
      email: "instructor@example.com",
    },
    update: {},
  });

  const course = await prisma.course.upsert({
    where: { id: "seed-course" },
    create: {
      id: "seed-course",
      institutionId: institution.id,
      instructorId: instructor.id,
      name: "서비스 기획 심화 과정",
      startDate: new Date("2026-03-02T00:00:00Z"),
      endDate: new Date("2026-08-28T00:00:00Z"),
      capacity: 30,
    },
    update: {},
  });

  const learners = [
    { id: "seed-learner-1", name: "김지원", email: "jiwon@example.com" },
    { id: "seed-learner-2", name: "박서연", email: "seoyeon@example.com" },
  ];

  for (const l of learners) {
    await prisma.learner.upsert({
      where: { id: l.id },
      create: l,
      update: {},
    });

    await prisma.invite.upsert({
      where: { courseId_email: { courseId: course.id, email: l.email } },
      create: {
        courseId: course.id,
        email: l.email,
        name: l.name,
        acceptedAt: new Date(),
      },
      update: {},
    });

    await prisma.enrollment.upsert({
      where: {
        courseId_learnerId: { courseId: course.id, learnerId: l.id },
      },
      create: {
        courseId: course.id,
        learnerId: l.id,
        joinedOn: new Date("2026-03-02T00:00:00Z"),
      },
      update: {},
    });
  }

  await prisma.recordingConsent.upsert({
    where: {
      instructorId_courseId: {
        instructorId: instructor.id,
        courseId: course.id,
      },
    },
    create: {
      instructorId: instructor.id,
      courseId: course.id,
      tokenHash: "seed-token-hash",
      tokenExpiresAt: new Date("2026-12-31T00:00:00Z"),
      consentedAt: new Date(),
    },
    update: {},
  });

  console.log("씨앗 데이터를 넣었습니다.");
  console.log(`  훈련기관: ${institution.name}`);
  console.log(`  과정: ${course.name} (정원 ${course.capacity}명)`);
  console.log(`  강사: ${instructor.name} — 녹음 허용 완료`);
  console.log(`  학습자: ${learners.map((l) => l.name).join(", ")}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
