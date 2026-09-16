"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";
import { startSession } from "@/lib/session";

const loginSchema = z.object({
  email: z.email({ message: "이메일 형식이 아닙니다." }),
  password: z.string().min(1, { message: "비밀번호를 넣어 주세요." }),
});

export type LoginState = { error: string } | null;

export async function login(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "입력이 올바르지 않습니다." };
  }

  const admin = await prisma.institutionAdmin.findUnique({
    where: { email: parsed.data.email },
  });

  // 이메일이 없을 때와 비밀번호가 틀릴 때를 같은 말로 답한다.
  // 어느 쪽인지 알려 주면 어떤 이메일이 등록돼 있는지 알아낼 수 있다.
  const failed = "이메일이나 비밀번호가 맞지 않습니다.";

  if (!admin) return { error: failed };

  const ok = await verifyPassword(parsed.data.password, admin.passwordHash);
  if (!ok) return { error: failed };

  await startSession(admin.id);
  redirect("/institution");
}
