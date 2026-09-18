"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // 타이머는 클라이언트가 매초 계산하므로 잦은 재조회가 필요 없다.
            // 다른 사람이 기록한 처치를 반영하기 위해 30초마다만 다시 받아온다.
            refetchInterval: 30_000,
            staleTime: 10_000,
            retry: 1,
          },
        },
      }),
  );

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
