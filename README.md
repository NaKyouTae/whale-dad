# whale-dad 🐋

고래 아빠를 위하여

Turborepo + pnpm 모노레포.

## 구조

```
whale-dad/
├─ apps/
│  ├─ server/    NestJS 12 + Prisma 7 + PostgreSQL  → Render 배포 (port 20000)
│  └─ web/       Next.js 16 + Tailwind v4           → Vercel 배포 (port 20001)
└─ packages/
   └─ shared/    서버·프론트 공유 타입/상수
```

| 앱 | 포트 | 주소 |
| --- | --- | --- |
| server | 20000 | http://localhost:20000/api |
| web | 20001 | http://localhost:20001 |
| API 문서 (dev only) | 20000 | http://localhost:20000/api/docs |

## 시작하기

```bash
# 1. 의존성 설치 (Node 22, pnpm 10)
pnpm install

# 2. 환경변수 설정 (기본값이 로컬 DB 를 가리키므로 그대로 써도 된다)
cp apps/server/.env.example apps/server/.env

# 3. 로컬 PostgreSQL 실행 (Docker)
pnpm db:up

# 4. DB 스키마 반영 + 보스별 채널 시드(0~231)
pnpm db:migrate
pnpm db:seed

# 5. 전체 개발 서버 실행
pnpm dev
```

## 스크립트

| 명령 | 설명 |
| --- | --- |
| `pnpm dev` | 서버 + 프론트 + shared watch 동시 실행 |
| `pnpm dev:server` / `pnpm dev:web` | 서버만 / 프론트만 |
| `pnpm build` | 전체 빌드 (turbo 캐시 적용) |
| `pnpm lint` / `pnpm typecheck` / `pnpm test` | 전체 검사 |
| `pnpm format` / `pnpm format:check` | Prettier 일괄 포맷 / 검사 |
| `pnpm db:up` / `db:down` | 로컬 PostgreSQL 시작 / 정지 |
| `pnpm db:reset` | 로컬 PostgreSQL 삭제 (데이터까지) |
| `pnpm db:migrate` | 개발용 마이그레이션 생성·적용 |
| `pnpm db:seed` | 보스별 채널 0~231 시드 (범위 밖 채널은 숨김 처리) |
| `pnpm db:studio` | Prisma Studio |

## 보스 타이머

메이플플래닛 보스는 **처치 후 3시간이 지나면 출현**한다. 채널을 돌며 잡을 때마다 카드를
눌러 그 채널의 타이머를 돌리는 화면이다.

보스는 좌측 사이드바에서 고르고, 화면은 보스마다 완전히 같다. 채널 목록·타이머는 보스별로
따로 관리된다.

| 보스 | 경로 |
| --- | --- |
| 여두목 보스 | `/boss/yeodumok` |
| 천구 보스 | `/boss/cheongu` |

보스를 하나 더 붙이려면 `packages/shared` 의 `BOSS_DEFINITIONS` 에 한 줄 추가하고
Prisma `BossType` enum 에 같은 값을 더하면 된다 — 메뉴·라우트·API·부팅 시드가 모두 따라온다.

등급은 서버가 내려준 `earliestSpawnAt`(처치 +3h)까지 남은 시간으로 클라이언트가 **매초** 다시
계산한다.

| 등급 | 기준 | 색 |
| --- | --- | --- |
| 안전 | 처치 후 0~2시간 | 초록 |
| 주의 | 출현 1시간 전 | 노랑 |
| 위험 | 출현 10분 전 | 빨강 |
| 출현 | 처치 후 3시간 경과 | 파랑 (유일하게 꽉 채운 색) |
| 기록 없음 | 처치 기록 없음 | 회색 |

같은 표를 제목 오른쪽 **ⓘ 버튼**을 눌러 레이어로 볼 수 있다.

- **채널 위치는 채널 번호 순으로 고정**이다. 카드는 채널 번호 + `등급 - 시간` 두 줄이고,
  등급은 짧은 라벨과 **카드 색**으로 함께 구분한다. 필터를 걸어도 순서는 바뀌지 않는다
- 제목 밑의 작은 글씨에 **등급별 채널 수**(전체·안전·주의·위험·출현·미확인)가 보이고,
  그 밑의 **카테고리 칩**으로 등급을 골라 걸러 볼 수 있다. 옆의 **검색창**은 채널 번호로 찾는다
- 한 줄에 놓이는 개수는 화면 폭에 따라 달라진다 — 모바일 4개, 태블릿 6~8개, 데스크톱 10개.
  좁은 화면에서 가로 스크롤이 생기지 않게 하기 위한 것이다
- 카드의 타이머는 **처치 후 흐른 시간**이다. `00:00:00` 에서 시작해 계속 올라가고,
  `03:00:00` 을 넘기면 출현 상태가 된다 (등급은 색으로 구분)
- **카드를 누르면 처치 확인 모달**이 뜬다. 실수로 눌러 타이머가 날아가지 않도록 한 단계 둔 것이라,
  모달에서 **지금 처치함**을 눌러야 기록된다
- 놓친 처치는 모달의 **시간 직접 입력**을 켜서 시각을 적어 기록할 수 있다 (미래 시각은 막는다)
- **기록하려면 로그인이 필요하다.** 로그인하지 않았다면 모달이 로그인을 안내한다.
  기록한 계정 이름은 채널 카드에 함께 보인다 (목록 조회 자체는 로그인 없이도 된다)
- 서버가 응답에 `serverNow` 를 함께 내려줘 기기 시계가 틀어져 있어도 카운트다운이 맞는다

### 계정

계정(username) + 비밀번호로 로그인한다. 이메일이나 인증 메일은 없고, **계정 이름이 곧 화면에
보이는 이름**이다. 헤더 오른쪽 위 **로그인** 버튼을 누르면 모달이 뜨고, 그 안의 **회원가입**
버튼으로 바로 가입할 수 있다. 가입에 성공하면 서버가 쿠키를 내려주므로 **자동으로 로그인**된다.

- 비밀번호는 Node 내장 scrypt 로 해싱한다 (`apps/server/src/auth/password.ts`) — 추가 의존성 없음
- 토큰은 **httpOnly 쿠키**로 내려간다. 개발은 `SameSite=Lax`(localhost 끼리는 같은 site),
  운영은 Vercel ↔ Render 로 site 가 달라 `SameSite=None; Secure`
- 채널 목록 조회(`GET`)만 공개고, 처치 기록·채널 변경 등 **쓰기는 전부 로그인이 필요**하다

### 채널 관리

채널 목록은 하드코딩이 아니라 DB 테이블(`boss_channels`)에 있다. 게임 패치로 채널 수가 바뀌면
제목 오른쪽 끝의 **톱니 버튼**을 눌러 뜨는 채널 설정 모달에서 범위를 바꿔 적용하면 된다.
기존 채널의 처치 기록은 보존된다.

다른 보스의 채널은 건드리지 않는다. `:boss` 는 보스 식별자(`yeodumok` / `cheongu`)다.

| 엔드포인트 | 설명 |
| --- | --- |
| `GET /api/bosses/:boss/channels` | 채널 목록 + 출현 시각 + 서버 시각 |
| `POST /api/bosses/:boss/channels/:ch/kill` | 처치 기록 (타이머 시작) · 로그인 필요 |
| `DELETE /api/bosses/:boss/channels/:ch/kill` | 타이머 초기화 · 로그인 필요 |
| `PATCH /api/bosses/:boss/channels/:ch` | 처치 시각 / 메모 / 노출 여부 수정 · 로그인 필요 |
| `POST /api/bosses/:boss/channels` · `DELETE …/:ch` | 채널 추가 / 삭제 · 로그인 필요 |
| `POST /api/bosses/:boss/channels/sync` | 범위 일괄 동기화 (예: `{"from":0,"to":231}`) · 로그인 필요 |
| `POST /api/auth/sign-up` · `sign-in` · `sign-out` | 회원가입 / 로그인 / 로그아웃 |
| `GET /api/auth/me` | 현재 로그인한 계정 (없으면 `null`) |

## 배포

### 서버 → Render

`render.yaml`(Blueprint) + `Dockerfile.render` 로 배포한다.
(로컬은 `docker-compose.yml` 의 PostgreSQL, 운영은 Supabase 를 쓴다.)

> Supabase 는 **Session pooler(5432)** 하나만 쓰면 된다.
> Direct connection 은 IPv6 전용이라 Render 에서 안 붙고, Transaction pooler(6543)는
> driver adapter 구성에서 `?pgbouncer=` / `?connection_limit=` 이 무시되므로 이점이 없다.
> 풀 크기는 `DATABASE_POOL_MAX`(기본 10)로 조절한다.

1. Render 대시보드에서 **New → Blueprint** → 이 저장소 연결
2. `sync: false` 로 표시된 값만 대시보드에서 입력한다

| 키 | 필수 | 값 |
| --- | --- | --- |
| `DATABASE_URL` | ✅ | Supabase **Session pooler** (5432) 문자열 |
| `DIRECT_URL` | ✅ | 위와 **같은 값**. `prisma migrate deploy` 가 쓴다 |
| `JWT_SECRET` | ✅ | Render 가 자동 생성(`generateValue`). 바꾸면 기존 로그인이 전부 풀린다 |
| `CORS_ORIGINS` | ✅ | 배포된 Vercel 도메인. 안 맞으면 쿠키가 안 붙어 로그인이 계속 풀린다 |
| `SUPABASE_*` | — | Storage 를 쓸 때만. 비워두면 해당 기능만 꺼진다 |

컨테이너는 기동할 때 이 순서로 움직인다:

1. `prisma migrate deploy` — 밀린 마이그레이션 적용
2. 보스마다 기본 범위(0~231)에서 **빠진 채널만** 생성
   — 이미 있는 채널의 활성/비활성 상태는 건드리지 않으므로, 화면에서 좁혀둔 범위가
   배포할 때마다 되돌아가지 않는다
3. NestJS 기동 · 헬스체크 `/api/health`

로컬에서 배포 이미지를 그대로 확인하려면:

```bash
docker build -f Dockerfile.render -t whale-dad-server .
docker run --rm -p 20050:20000 \
  -e DATABASE_URL="..." -e DIRECT_URL="..." \
  -e JWT_SECRET="$(openssl rand -hex 32)" \
  -e CORS_ORIGINS="http://localhost:20001" \
  whale-dad-server
```

#### 배포가 `P1013` 으로 죽을 때

`prisma migrate deploy` 단계에서 나는 연결 문자열 문제다. 메시지별로 원인이 다르다.

| 메시지 | 원인 |
| --- | --- |
| `empty host in database URL` | 호스트 자리가 비어 있다 (`...@:5432/postgres`). 값이 잘렸는지 확인 |
| `The scheme is not recognized` | `postgresql://` 로 시작하지 않는다. `host=... port=...` 블록을 붙여넣었는지 확인 |
| `invalid port number` | 비밀번호의 `/` `#` `?` 가 URL 인코딩되지 않았다 (`%2F` `%23` `%3F`) |
| `Connection url is empty` | `DATABASE_URL` 이 비어 있다 |

비밀번호 특수문자는 반드시 URL 인코딩한다 — `@`→`%40`, `#`→`%23`, `/`→`%2F`, `?`→`%3F`, `:`→`%3A`.

### 프론트 → Vercel

모노레포이므로 **Root Directory 를 `apps/web`** 으로 지정한다
(`apps/web/vercel.json` 에 빌드/설치 명령이 들어 있다).

환경변수는 **`NEXT_PUBLIC_API_URL` 하나**다.

```
NEXT_PUBLIC_API_URL = https://<render-서비스명>.onrender.com/api
```

- **끝에 `/api` 를 붙인다** (서버 글로벌 프리픽스). 빠뜨리면 코드가 자동으로 붙여주지만,
  값 자체를 정확히 넣는 편이 낫다
- `NEXT_PUBLIC_*` 은 **빌드 시점에 번들에 박히므로**, 값을 추가·수정한 뒤에는 반드시 재배포한다
- 로컬에서는 생략해도 `http://localhost:20000/api` 로 붙는다

#### 로그인이 자꾸 풀린다면

프론트(Vercel)와 서버(Render)는 도메인이 달라 쿠키가 **교차 사이트**로 오간다. 셋 다 맞아야 붙는다.

1. Render 의 `CORS_ORIGINS` 가 **실제 Vercel 도메인과 정확히** 일치 (프로토콜 포함, 끝 슬래시 없이)
2. 서버가 `NODE_ENV=production` 으로 떠 있을 것 — 그래야 쿠키가 `Secure; SameSite=None` 으로 나간다
3. 양쪽 다 HTTPS

Vercel 프리뷰 배포처럼 도메인이 매번 바뀌면 그 주소도 `CORS_ORIGINS` 에 콤마로 추가해야 한다.

## 커밋 훅

husky + lint-staged 가 걸려 있어 커밋할 때 **스테이징된 파일만** 검사한다.

- `prettier --write` 로 포맷을 맞추고
- 각 앱의 ESLint 를 `--max-warnings 0` 으로 돌린다 (경고 하나만 있어도 커밋이 막힌다)

훅은 `pnpm install` 시 `prepare` 스크립트가 자동으로 설치한다. 급할 때만 `--no-verify` 로 건너뛴다.

## 테마

**기본은 다크**이고, 헤더의 해/달 버튼으로 전환한다. 선택은 `localStorage` 에 남아 새로고침해도 유지된다.

화면 대부분이 흰 면 + 회색 글씨로 짜여 있어, 컴포넌트마다 `dark:` 를 다는 대신
`globals.css` 의 `[data-theme="dark"]` 에서 **`--color-white` 와 회색 계단을 통째로 뒤집는다.**
그래서 `bg-white` / `text-grey-900` 같은 클래스가 자동으로 따라온다.

- 등급 색은 `--color-safe-*` / `--color-caution-*` / `--color-danger-*` 토큰이라 테마별로 값만 바뀐다
- 브랜드 강조색(`bg-brand-50` 등)은 뒤집히지 않으므로 필요한 곳에만 `dark:` 를 단다
- 첫 페인트 전에 테마를 정하는 인라인 스크립트가 `layout.tsx` 에 있다 (없으면 화면이 한 번 깜빡인다)

## 디자인 시스템

토스(Toss) 스타일을 기준으로 잡았다. 토큰은 [apps/web/src/app/globals.css](apps/web/src/app/globals.css) 의 `@theme` 블록에 있다.

- **Primary** Toss Blue `#3182F6` (`brand-500`)
- **Grey** `grey-50` ~ `grey-900` 뉴트럴 스케일
- **Radius** 12~20px 위주의 큰 라운드
- **Font** Pretendard Variable
- **Motion** `--ease-toss` + `.press` (누를 때 `scale(0.97)`)

기본 컴포넌트는 [apps/web/src/components/ui/](apps/web/src/components/ui/) 에 있고,
`components.json` 이 설정돼 있어 shadcn/ui CLI 로 추가 컴포넌트를 붙일 수 있다.

```bash
cd apps/web && pnpm dlx shadcn@latest add dialog
```
