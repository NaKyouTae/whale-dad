"use client";

import { useState } from "react";
import { Button, Input, Modal } from "@/components/ui";
import { useSignIn, useSignUp } from "@/hooks/use-auth";

type Mode = "signIn" | "signUp";

const COPY: Record<Mode, { title: string; submit: string; switchTo: Mode; switchLabel: string }> = {
  signIn: {
    title: "로그인",
    submit: "로그인",
    switchTo: "signUp",
    switchLabel: "회원가입",
  },
  signUp: {
    title: "회원가입",
    submit: "회원가입하고 시작하기",
    switchTo: "signIn",
    switchLabel: "이미 계정이 있어요",
  },
};

export function AuthModal({ onClose }: { onClose: () => void }) {
  const [mode, setMode] = useState<Mode>("signIn");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const signIn = useSignIn();
  const signUp = useSignUp();
  const active = mode === "signIn" ? signIn : signUp;
  const copy = COPY[mode];

  const submit = () => {
    if (!username.trim() || !password) return;
    active.mutate({ username: username.trim(), password }, { onSuccess: onClose });
  };

  const switchMode = () => {
    setMode(copy.switchTo);
    signIn.reset();
    signUp.reset();
  };

  return (
    <Modal
      title={copy.title}
      description={
        mode === "signIn"
          ? "처치를 기록하려면 로그인이 필요해요"
          : "계정과 비밀번호만 있으면 바로 시작할 수 있어요"
      }
      onClose={onClose}
      footer={
        <div className="flex w-full flex-col gap-2">
          <Button
            variant="primary"
            full
            disabled={active.isPending || !username.trim() || !password}
            onClick={submit}
          >
            {active.isPending ? "처리 중…" : copy.submit}
          </Button>
          {/* 로그인 버튼 밑에 회원가입 버튼 */}
          <Button variant="secondary" full disabled={active.isPending} onClick={switchMode}>
            {copy.switchLabel}
          </Button>
        </div>
      }
    >
      <form
        className="flex flex-col gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <Input
          label="계정"
          value={username}
          autoComplete="username"
          maxLength={20}
          placeholder="한글, 영문, 숫자"
          onChange={(e) => setUsername(e.target.value)}
        />
        <Input
          label="비밀번호"
          type="password"
          value={password}
          autoComplete={mode === "signIn" ? "current-password" : "new-password"}
          maxLength={72}
          placeholder={mode === "signUp" ? "4자 이상" : undefined}
          onChange={(e) => setPassword(e.target.value)}
        />

        {active.isError && (
          <p role="alert" className="text-caption text-danger">
            {active.error instanceof Error ? active.error.message : "잠시 후 다시 시도해 주세요"}
          </p>
        )}

        {/* Enter 로도 제출되도록 폼 안에 숨은 버튼을 둔다 */}
        <button type="submit" hidden />
      </form>
    </Modal>
  );
}
