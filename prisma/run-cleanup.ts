import "dotenv/config";
import { runCleanup } from "../src/server/api/cleanup";

/**
 * 보관 기간이 지난 것을 지우는 예약 작업.
 *
 * 배포 뒤에는 `pg_cron`이 하루에 한 번 부른다. 지금은 손으로 돌려 확인한다.
 */

runCleanup()
  .then((report) => {
    console.log("지운 것");
    console.log(`  강의 기록 ${report.transcripts}건`);
    console.log(`  목차 항목 ${report.tocItems}건`);
    console.log(`  예외 경로 음성 ${report.audio}건`);
    console.log(`  학습 자료 원본 ${report.materials}건`);
    if (report.overdue.length > 0) {
      console.log("\n기한을 넘긴 채 남아 있던 것");
      for (const line of report.overdue) console.log(`  ${line}`);
    }
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
