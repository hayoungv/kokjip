import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // 마이그레이션은 직접 연결 주소로 한다.
    // 없으면 실행용 주소를 그대로 쓴다.
    url: process.env["DIRECT_URL"] ?? process.env["DATABASE_URL"],
  },
});
