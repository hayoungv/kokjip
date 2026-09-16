"use client";

import { useActionState } from "react";
import { login, type LoginState } from "./actions";

export function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(
    login,
    null,
  );

  return (
    <form action={action} className="mt-8 space-y-4">
      <div>
        <label
          htmlFor="email"
          className="block text-xs font-medium text-navy"
        >
          이메일
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          required
          className="mt-1.5 w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm"
        />
      </div>

      <div>
        <label
          htmlFor="password"
          className="block text-xs font-medium text-navy"
        >
          비밀번호
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="mt-1.5 w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm"
        />
      </div>

      {state?.error && (
        <p className="rounded-lg bg-danger-bg px-3 py-2 text-xs text-danger">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-navy py-2.5 text-sm font-medium text-white disabled:opacity-40"
      >
        {pending ? "확인하는 중" : "들어가기"}
      </button>
    </form>
  );
}
