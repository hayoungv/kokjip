import "dotenv/config";
import { runConsentReminders } from "../src/server/api/instructor";

/**
 * 동의하지 않은 강사에게 다시 안내하는 예약 작업.
 *
 * 배포 뒤에는 `pg_cron`이 하루에 한 번 부른다.
 * 지금은 손으로 돌려 확인한다.
 */

const baseUrl = process.env.APP_BASE_URL ?? "http://localhost:3000";

runConsentReminders(baseUrl)
  .then((count) => {
    console.log(count > 0 ? `안내를 ${count}건 보냈습니다.` : "보낼 안내가 없습니다.");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
