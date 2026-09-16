import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { parseTocText, withParents } from "../src/domain/toc";

/**
 * 목차와 붙임 seed.
 *
 * 강사가 직접 적은 목차를 넣고, 이미 들어 있는 강조한 말을 그 항목에 붙인다.
 *
 * 붙이는 일은 원래 판정이 두 단계로 한다. 판정을 붙이지 않은 데모에서는
 * 사람이 전사본을 읽고 붙인 결과를 그대로 넣는다. 제품 요구사항 정의서
 * 7장이 말하는 "첫 버전에서 사람이 대신 하는 것"에 해당한다.
 *
 * 붙임의 근거는 말 자체다. 목차 제목의 단어를 전사본에서 찾는 방법은
 * 쓰지 않는다. 실측에서 목차 13개 중 5개만 잡혔다.
 */

const COURSE_ID = "seed-course";

/** 강사가 적은 목차. 빈칸 두 칸이 한 계단이다. */
const TOC = `
1장 AI와 함께 쓰는 기획 문서
  1절 PRD는 통합 원본이다
  2절 SRS와 다이어그램
  3절 문서 품질을 지키는 프롬프팅
2장 AI에게 일을 맡기는 법
  1절 작업 규칙 세우기
  2절 컨텍스트와 토큰 관리
  3절 병렬 작업과 그 한계
3장 태스크 분해와 일정
  1절 태스크를 나누는 단위
  2절 일정 읽기
4장 목표 달성 루프
  1절 완성 조건 정하기
  2절 종료 기준과 반복
5장 고객용 페이지 만들기
  1절 섹션 제목과 구조
  2절 퍼널과 신뢰도
`.trim();

/**
 * 말을 목차 항목에 붙인 결과.
 *
 * 왼쪽은 인용문의 앞부분이고 오른쪽은 목차 항목의 제목이다.
 * 사람이 전사본을 읽고 정한 것이다.
 */
const ATTACHED: Array<[string, string]> = [
  ["PRD는 루티드 문서", "1절 PRD는 통합 원본이다"],
  ["비즈니스 목표가 달성되는지", "1절 PRD는 통합 원본이다"],
  ["SRS는 표준 문서 양식", "2절 SRS와 다이어그램"],
  ["품질에서 또 중요한 게", "2절 SRS와 다이어그램"],
  ["구현 가능", "2절 SRS와 다이어그램"],
  ["최대 노드 30개", "2절 SRS와 다이어그램"],
  ["그 이상이 좀 넘어가기", "2절 SRS와 다이어그램"],
  ["이게 아주 중요한 거지", "3절 문서 품질을 지키는 프롬프팅"],
  ["이게 엄청 중요한 거였어요", "3절 문서 품질을 지키는 프롬프팅"],
  ["반드시 같이 프롬프팅", "3절 문서 품질을 지키는 프롬프팅"],
  ["그걸 한국말에 맞춰서", "3절 문서 품질을 지키는 프롬프팅"],

  ["어 프로젝트 관련은", "1절 작업 규칙 세우기"],
  ["처음에", "1절 작업 규칙 세우기"],
  ["범위 데이터 생성해 줘", "1절 작업 규칙 세우기"],
  ["외부랑 통신해야", "1절 작업 규칙 세우기"],
  ["언제 왜 그렇게 하는지", "1절 작업 규칙 세우기"],
  ["반드시 AI가 알아서 치게", "1절 작업 규칙 세우기"],
  ["그에 맞춰서 AI 작업 규칙을", "1절 작업 규칙 세우기"],
  ["이 프로젝트의 핵심 목표를", "1절 작업 규칙 세우기"],
  ["웬만해서는 내 프로젝트에", "1절 작업 규칙 세우기"],
  ["절대 그거 해", "1절 작업 규칙 세우기"],
  ["딸깍으로 AI한테", "1절 작업 규칙 세우기"],
  ["내가 의사 결정하지 않은", "1절 작업 규칙 세우기"],
  ["토큰이 너무 많이 들고", "2절 컨텍스트와 토큰 관리"],
  ["있는 걸 축약하는 건", "2절 컨텍스트와 토큰 관리"],
  ["병렬로 한 번에", "3절 병렬 작업과 그 한계"],
  ["인간으로 나눴던 거를", "3절 병렬 작업과 그 한계"],
  ["가능한 태스크들에 대해서", "3절 병렬 작업과 그 한계"],

  ["떨어져도 깔끔하게", "1절 태스크를 나누는 단위"],
  ["그냥 뽑았네", "1절 태스크를 나누는 단위"],
  ["그거는 그 작업을 통합하고", "1절 태스크를 나누는 단위"],
  ["CRI가 있는지를", "1절 태스크를 나누는 단위"],
  ["무슨 작업하든지", "1절 태스크를 나누는 단위"],
  ["테스크는 상세해 보이지만", "1절 태스크를 나누는 단위"],
  ["전체 일정이 이렇게", "2절 일정 읽기"],

  ["어떤 방식으로", "1절 완성 조건 정하기"],
  ["완성 조건이 아주", "1절 완성 조건 정하기"],
  ["작업의 전 중후를", "1절 완성 조건 정하기"],
  ["완전히 통과된 경우에만", "2절 종료 기준과 반복"],
  ["이거 파일로 저장한", "2절 종료 기준과 반복"],
  ["코어", "2절 종료 기준과 반복"],
  ["한 번에 깔끔하게", "2절 종료 기준과 반복"],

  ["고객용 페이지를", "1절 섹션 제목과 구조"],
  ["각 섹션의 제목을", "1절 섹션 제목과 구조"],
  ["섹션 1, 2에서", "1절 섹션 제목과 구조"],
  ["그걸 안 보고 랜딩", "1절 섹션 제목과 구조"],
  ["포함되어 있어도", "1절 섹션 제목과 구조"],
  ["이 서비스 화면에 입각해서", "1절 섹션 제목과 구조"],
  ["왓 웨어", "1절 섹션 제목과 구조"],
  ["무엇을 어디에 어떻게", "1절 섹션 제목과 구조"],
  ["어떤 행동을 하라고", "2절 퍼널과 신뢰도"],
  ["모든 상품 서비스의 퍼널", "2절 퍼널과 신뢰도"],
  ["오해하면 불법인데", "2절 퍼널과 신뢰도"],
];

const adapter = new PrismaPg({
  connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  const course = await prisma.course.findUnique({ where: { id: COURSE_ID } });
  if (!course) throw new Error("먼저 npm run db:seed 로 과정을 만들어 주세요.");

  // 이전 목차를 지운다. 붙어 있던 항목은 데이터베이스가 비워 준다.
  await prisma.tocItem.deleteMany({ where: { courseId: COURSE_ID } });

  const items = parseTocText(TOC);
  const ids: string[] = [];
  const idByTitle = new Map<string, string>();

  for (const item of withParents(items)) {
    const created = await prisma.tocItem.create({
      data: {
        courseId: COURSE_ID,
        parentId: item.parentIndex === null ? null : ids[item.parentIndex],
        order: item.order,
        depth: item.depth,
        title: item.title,
      },
    });
    ids.push(created.id);
    idByTitle.set(item.title, created.id);
  }

  console.log(`목차 ${items.length}개를 넣었습니다.`);

  // 자료를 올린 기록. 원본은 두지 않으므로 지워진 것으로 둔다.
  await prisma.courseMaterial.deleteMany({ where: { courseId: COURSE_ID } });
  await prisma.courseMaterial.create({
    data: {
      courseId: COURSE_ID,
      kind: "TYPED",
      sourceName: "직접 적기",
      confirmedAt: new Date(),
      deletedAt: new Date(),
    },
  });

  // 말을 항목에 붙인다.
  const highlights = await prisma.highlight.findMany({
    where: { session: { courseId: COURSE_ID } },
    select: { id: true, quote: true, sessionId: true },
  });

  let attached = 0;
  const topicsBySession = new Map<string, Set<string>>();

  for (const highlight of highlights) {
    const rule = ATTACHED.find(([prefix]) => highlight.quote.startsWith(prefix));
    if (!rule) continue;

    const tocItemId = idByTitle.get(rule[1]);
    if (!tocItemId) {
      console.log(`  목차에 없는 제목: ${rule[1]}`);
      continue;
    }

    await prisma.highlight.update({
      where: { id: highlight.id },
      data: { tocItemId },
    });
    attached += 1;

    const set = topicsBySession.get(highlight.sessionId) ?? new Set<string>();
    set.add(tocItemId);
    topicsBySession.set(highlight.sessionId, set);
  }

  // 회차가 다룬 구간. 그 회차에서 말이 붙은 항목과 그 부모다.
  await prisma.sessionTopic.deleteMany({
    where: { session: { courseId: COURSE_ID } },
  });

  const parentById = new Map(
    (await prisma.tocItem.findMany({ where: { courseId: COURSE_ID } })).map(
      (i) => [i.id, i.parentId],
    ),
  );

  for (const [sessionId, tocItemIds] of topicsBySession) {
    const withAncestors = new Set(tocItemIds);
    for (const id of tocItemIds) {
      const parentId = parentById.get(id);
      if (parentId) withAncestors.add(parentId);
    }

    for (const tocItemId of withAncestors) {
      await prisma.sessionTopic.create({ data: { sessionId, tocItemId } });
    }
  }

  const unattached = highlights.length - attached;
  console.log(`강조한 말 ${highlights.length}건 가운데 ${attached}건을 항목에 붙였습니다.`);
  console.log(`  어느 항목에도 붙지 않은 말 ${unattached}건은 그대로 둡니다.`);
  console.log(`  회차 ${topicsBySession.size}개에 다룬 구간을 기록했습니다.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
