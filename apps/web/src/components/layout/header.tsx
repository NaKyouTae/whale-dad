"use client";

import { useState } from "react";
import Link from "next/link";
import { LogOut, UserRound } from "lucide-react";
import { AuthModal } from "@/components/auth/auth-modal";
import { useCurrentUser, useSignOut } from "@/hooks/use-auth";

export function Header() {
  const { data: user, isPending } = useCurrentUser();
  const signOut = useSignOut();
  const [authOpen, setAuthOpen] = useState(false);

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 h-14 border-b border-grey-200 bg-white/85 backdrop-blur-sm">
        <div className="flex h-full items-center px-4">
          <Link href="/" className="press flex items-center gap-2 rounded-sm px-1 py-1">
            <span className="text-[18px]">🐋</span>
            <span className="text-heading text-grey-900">whale-dad</span>
          </Link>

          <div className="ml-auto flex items-center gap-2">
            {isPending ? (
              // 로그인 여부를 아직 모르는 동안 버튼이 깜빡이지 않도록 자리만 잡아둔다
              <div className="h-9 w-20 animate-pulse rounded-sm bg-grey-100" />
            ) : user ? (
              <>
                <span className="flex items-center gap-1.5 text-caption font-semibold text-grey-700">
                  <UserRound size={15} className="text-grey-400" />
                  {user.username}
                </span>
                <button
                  type="button"
                  onClick={() => signOut.mutate()}
                  disabled={signOut.isPending}
                  aria-label="로그아웃"
                  title="로그아웃"
                  className="press flex size-9 items-center justify-center rounded-sm border border-grey-200 bg-white text-grey-600 hover:bg-grey-50 disabled:opacity-50"
                >
                  <LogOut size={15} />
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setAuthOpen(true)}
                className="press h-9 rounded-sm bg-brand-500 px-3.5 text-[13px] font-semibold text-white hover:bg-brand-600"
              >
                로그인
              </button>
            )}
          </div>
        </div>
      </header>

      {authOpen && <AuthModal onClose={() => setAuthOpen(false)} />}
    </>
  );
}
