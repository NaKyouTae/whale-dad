# whale-dad — 고래 아빠를 위하여

## 프로젝트 구조

Turborepo + pnpm 모노레포:

- `apps/server/` — NestJS 12 + Prisma 7 + Supabase (port **20000**, prefix `/api`)
- `apps/web/` — Next.js 16 (App Router) (port **20001**)
- `packages/shared/` — 서버·프론트 공유 타입/상수 (`@whale-dad/shared`)

## 기술 스택

### 서버 (apps/server)

- NestJS 12, Prisma 7 (driver adapter `@prisma/adapter-pg`), Supabase PostgreSQL
- Swagger — dev 환경에서만 `/api/docs` 로 노출
- Supabase Storage — `SupabaseService` (service_role 키, 서버 전용)

### 프론트 (apps/web)

- Next.js 16 + React 19 + Tailwind CSS v4 (`@theme` 토큰, config 파일 없음)
- class-variance-authority + clsx + tailwind-merge (`cn()`)
- lucide-react — 아이콘 / framer-motion — 애니메이션
- React Hook Form + Zod — 폼 / @tanstack/react-query — 서버 상태
- date-fns — 날짜 포맷

## 기능 — 여두목 보스 (`/boss`)

메이플플래닛 여두목 보스 젠 타이머. **처치 후 3시간이 지나면 출현**하고, 채널은 기본 1~231.

- **채널 목록은 DB 테이블 `boss_channels`** — 하드코딩 금지. 게임 패치로 채널 수가 바뀌면
  `POST /api/boss-channels/sync` 로 범위를 바꾼다. `packages/shared` 의 `BOSS_CHANNEL_MIN/MAX` 는
  시드와 UI 기본값일 뿐 실제 목록의 근거가 아니다
- **젠 시각은 저장하지 않는다** — `lastKilledAt` 만 저장하고 `earliestSpawnAt`(+3h) /
  `latestSpawnAt`(+5h) 은 서버가 계산해 내려준다. 재출현 간격은
  `BOSS_SPAWN_MIN_HOURS` / `BOSS_SPAWN_MAX_HOURS` 상수
- **등급(SAFE/CAUTION/DANGER/SPAWNED/UNKNOWN) 판정은 클라이언트가 매초** `lib/boss.ts` 의
  `getTiming()` 으로 한다. 서버는 등급을 내려주지 않는다 — 폴링 없이 카운트다운이 살아 있어야 하므로
- **등급 기준은 출현 시각(처치 +3h)까지 남은 시간** — 1시간 초과 안전 / 1시간 이하 주의 /
  10분 이하 위험 / 0 이하 출현. 경계값은 `BOSS_CAUTION_BEFORE_MS`, `BOSS_DANGER_BEFORE_MS` 상수
- 등급의 라벨·설명·색은 전부 `lib/boss.ts` 의 `GRADE_LABEL` / `GRADE_DESCRIPTION` / `GRADE_STYLE`
  한 곳에 있다. 카드와 ⓘ 기준표가 같은 값을 쓰므로 색을 컴포넌트에 직접 박지 말 것
- **시계 오차 보정** — 목록 응답의 `serverNow` 를 `useNow(serverNow)` 에 넘겨 기기 시계가 틀어져도
  타이머가 맞도록 한다. 렌더 중에 `Date.now()` 를 호출하지 말 것 (React Compiler `purity` 규칙 위반)
- 채널이 232개라 `ChannelCard` 는 `memo` 로 감싸 **표시되는 초가 바뀔 때만** 리렌더한다
- **채널 위치는 채널 번호 순으로 고정** — 정렬/필터로 순서를 바꾸지 말 것. 채널을 눈으로 찾는
  화면이라 위치가 움직이면 못 쓴다. 상태는 순서가 아니라 **카드 색**으로만 구분한다
- 카드는 **채널 번호 + 타이머 두 줄**. 한 줄에 놓이는 개수는 반응형
  (`grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10`) — 좁은 화면에서
  가로 스크롤이 생기면 안 된다. 카드 최소 높이는 터치 영역 확보용 44px. 여기에 배지·버튼을 더 넣지 말 것.
  **카드 클릭은 확인 모달만 연다** — 클릭 한 번으로 바로 기록하면 실수로 눌렀을 때 타이머가
  날아가므로, 기록은 `KillConfirmDialog` 안에서만 일어나게 할 것
- 처치자 이름은 채널 번호와 **같은 줄**에 붙인다 (두 줄 규칙을 깨지 않기 위해)

## 인증

계정(username) + 비밀번호. 이메일·인증 메일 없음. **username 이 곧 표시 이름**이다.

- 비밀번호 해싱은 Node 내장 **scrypt** (`auth/password.ts`) — bcrypt 등 네이티브 의존성을 넣지 말 것
- 토큰은 **httpOnly 쿠키**(`whale_dad_token`). dev 는 `SameSite=Lax`(localhost 끼리는 같은 site),
  prod 는 `SameSite=None; Secure`. 토큰을 localStorage 에 두지 말 것
- **읽기는 공개, 쓰기는 로그인 필요** — 새 엔드포인트를 만들 때 조회가 아니면 `@UseGuards(JwtAuthGuard)`
- 프론트에서 로그인 상태는 `useCurrentUser()` 하나로만 읽는다. 로그인/가입은 `AuthModal` 한 곳

## 테마 (다크/라이트)

기본 다크. `globals.css` 의 `[data-theme="dark"]` 에서 **`--color-white` 와 grey 계단을 통째로 뒤집어**
`bg-white` / `text-grey-*` 가 자동으로 따라오게 한다.

- 새 색을 쓸 때 **hex 를 직접 박지 말 것** — 토큰(`bg-safe-bg`, `text-caution-text` 등)을 쓴다.
  토큰이 없으면 `globals.css` 에 라이트/다크 쌍으로 추가한다
- 뒤집히지 않는 브랜드 강조색(`bg-brand-50` 등)에만 `dark:` 를 단다
- 테마 토글은 React state 를 쓰지 않는다 — 서버 렌더와 어긋나므로 두 아이콘을 모두 그리고
  CSS(`dark:hidden`)로 감춘다

## 컨벤션

- **변경 요청(mutation)이 실패하면 반드시 화면에 표시할 것.** 로그인이 필요한 동작인데 로그아웃
  상태면 401 이 나는데, 이걸 삼키면 버튼을 눌러도 아무 일 없는 것처럼 보인다.
  모달에는 `error` 를 받아 표시하고, 로그인이 필요하면 버튼 자체를 "로그인"으로 바꾼다

- **디자인은 토스(Toss) 스타일** — 뉴트럴 그레이 + 단일 브랜드 블루(`brand-500` `#3182F6`),
  큰 라운드(12~20px), 얇은 보더, 절제된 그림자, Pretendard
  - 색상/타이포/라운드는 전부 `apps/web/src/app/globals.css` 의 `@theme` 토큰을 쓸 것.
    임의의 hex 값을 컴포넌트에 직접 박지 말 것
  - 누르는 요소에는 `.press` 유틸을 붙여 토스 특유의 프레스 피드백을 준다
- **레이아웃은 상단 헤더 + 좌측 사이드바** (`components/layout/`). 사이드바는 기본이 접힌 레일이라
  아이콘만 보이고, 펼치면 본문 위에 겹쳐 뜬다 — 본문은 항상 레일 폭만 비워두므로 레이아웃이 밀리면 안 된다.
  접기/펼치기 손잡이는 **사이드바 오른쪽 경계선 세로 한가운데**에 둔다 (헤더에 두지 말 것)
- **UI 프리미티브는 `apps/web/src/components/ui/`** — 새 컴포넌트는 여기에 추가.
  shadcn/ui CLI(`pnpm dlx shadcn@latest add ...`) 와 호환되도록 `components.json` 설정됨
- **API 응답 래핑** — 성공은 `TransformInterceptor` 가 `{ success: true, data }` 로,
  실패는 `AllExceptionsFilter` 가 `{ success: false, statusCode, message, path, timestamp }` 로 감싼다.
  프론트에서는 `apps/web/src/lib/api.ts` 의 `api<T>()` 를 쓰면 `data` 만 돌려받는다
- **서버·프론트 공유 타입은 `packages/shared`** 에 두고 양쪽에서 `@whale-dad/shared` 로 import.
  shared 는 `tsc` 로 빌드되는 패키지이므로 소스만 추가하고 끝내지 말 것 (turbo 의 `^build` 가 처리)
- **Supabase DB 연결은 URL 이 두 개** — 런타임은 `DATABASE_URL`(pooler 6543),
  Prisma CLI/마이그레이션은 `DIRECT_URL`(direct 5432).
  런타임 URL 은 `PrismaService`, CLI URL 은 `prisma.config.ts` 에서 각각 주입한다
- **`SUPABASE_SERVICE_ROLE_KEY` 는 절대 프론트로 내보내지 말 것** — `NEXT_PUBLIC_` 접두사 금지
- **필수 환경변수는 `DATABASE_URL` 하나뿐** — `SUPABASE_*` 는 Storage 를 쓸 때만 필요하므로
  없어도 서버가 떠야 한다. 기능 하나가 못 쓰는 설정 때문에 전체 부팅을 막지 말 것
- 로컬 DB 는 `docker-compose.yml` 의 PostgreSQL (`pnpm db:up`), 운영은 Supabase
- **React Compiler 린트 규칙이 켜져 있다** (`react-hooks/purity`, `react-hooks/set-state-in-effect`).
  effect 안에서 setState 로 props→state 를 동기화하지 말고 호출부에서 `key` 로 리마운트할 것.
  규칙을 끄지 말 것
- **환경변수 폴백에 `??` 를 쓰지 말 것.** Render 등은 빈 칸을 변수 삭제가 아니라 **빈 문자열**로
  넣기 때문에 `process.env.X ?? "기본값"` 이 `""` 가 된다. `src/config/env.ts` 의
  `envValue` / `envString` / `envNumber` 를 쓰고, ConfigService 쪽은 `||` 를 쓴다
- 환경변수를 추가하면 `apps/server/src/config/env.validation.ts` 와 `.env.example`,
  `render.yaml` 을 함께 갱신할 것

## 실행

```bash
pnpm dev          # server + web + shared watch 동시 실행
pnpm dev:server   # 서버만
pnpm dev:web      # 프론트만
pnpm build        # 전체 빌드
pnpm lint         # 전체 lint (--max-warnings 0)
pnpm typecheck    # 전체 타입 체크
pnpm db:up        # 로컬 PostgreSQL (Docker) 실행
pnpm db:migrate   # 마이그레이션 생성·적용
pnpm db:seed      # 여두목 보스 채널 1~231 시드
```

## 커밋 훅

husky pre-commit → lint-staged 로 **스테이징된 파일만** prettier + ESLint(`--max-warnings 0`) 검사.
ESLint 는 `pnpm --filter <app> exec eslint` 로 돌려야 각 앱의 flat config 가 잡힌다.

## 배포

- 서버 → **Render** (`render.yaml` + `Dockerfile.render`, 헬스체크 `/api/health`)
  - 컨테이너 기동 순서: `prisma migrate deploy` → 기본 범위에서 빠진 채널 생성 → 서버 기동
  - 부팅 시드는 **없는 채널만 만든다**. 이미 있는 채널의 활성 여부는 손대지 말 것 —
    화면에서 범위를 좁힌 설정이 배포마다 되돌아간다
  - `prisma` 는 런타임에 `migrate deploy` 를 돌려야 하므로 **dependencies** 에 있어야 한다
  - 런타임 스테이지에서 `RUN chown -R` 을 쓰지 말 것 — node_modules 트리가 통째로 레이어에 복제돼
    이미지가 두 배가 된다. `COPY --chown` 으로 처리한다
- 프론트 → **Vercel** (Root Directory 를 `apps/web` 으로 지정)
