"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AuthUser, SignInInput, SignUpInput } from "@whale-dad/shared";
import { api } from "@/lib/api";

const AUTH_KEY = ["auth", "me"] as const;

/** 현재 로그인한 계정. 로그인 안 했으면 null */
export function useCurrentUser() {
  return useQuery({
    queryKey: AUTH_KEY,
    queryFn: () => api<AuthUser | null>("/auth/me"),
    // 인증 상태는 자주 바뀌지 않으므로 폴링하지 않는다
    refetchInterval: false,
    staleTime: 60_000,
  });
}

function useAfterAuthChange() {
  const queryClient = useQueryClient();

  return (user: AuthUser | null) => {
    queryClient.setQueryData(AUTH_KEY, user);
    // 처치자 이름이 바뀔 수 있으니 채널 목록도 다시 받는다
    void queryClient.invalidateQueries({ queryKey: ["boss-channels"] });
  };
}

export function useSignIn() {
  const onAuthChange = useAfterAuthChange();

  return useMutation({
    mutationFn: (input: SignInInput) =>
      api<AuthUser>("/auth/sign-in", { method: "POST", body: JSON.stringify(input) }),
    onSuccess: onAuthChange,
  });
}

/** 회원가입하면 서버가 쿠키를 내려주므로 곧바로 로그인 상태가 된다 */
export function useSignUp() {
  const onAuthChange = useAfterAuthChange();

  return useMutation({
    mutationFn: (input: SignUpInput) =>
      api<AuthUser>("/auth/sign-up", { method: "POST", body: JSON.stringify(input) }),
    onSuccess: onAuthChange,
  });
}

export function useSignOut() {
  const onAuthChange = useAfterAuthChange();

  return useMutation({
    mutationFn: () => api<{ ok: true }>("/auth/sign-out", { method: "POST" }),
    onSuccess: () => onAuthChange(null),
  });
}
