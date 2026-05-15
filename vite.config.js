import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import basicSsl from '@vitejs/plugin-basic-ssl'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig(({ mode }) => {
  console.log('mode: ', mode);
  const env = loadEnv(mode, process.cwd());

  return {
    build: {
      outDir: env.VITE_OUT_DIR || 'dist',
      emptyOutDir: true,
    },
    plugins: [
      vue(),
      // [주석] ngrok 사용 시 HTTPS는 ngrok이 담당 → basicSsl 불필요
      // 같은 WiFi 직접 접근 시에는 주석 해제
      // basicSsl({
      //   domains: ['localhost', '192.168.0.31'],
      // }),
      // [추가] PWA 플러그인
      VitePWA({
        // 새 버전 배포 시 사용자 개입 없이 서비스 워커 자동 갱신
        registerType: 'autoUpdate',
        // [수정] dev 서버에서는 SW 비활성화 — 활성화 시 팀원 hot reload 캐시 문제 발생
        // PWA 테스트 필요 시 enabled: true 로 변경 후 Ctrl+Shift+R 강력 새로고침
        devOptions: { enabled: false },
        // 캐싱할 정적 자산 패턴
        // [수정] public/ 기준 상대 경로 — icons/ 폴더 안 모든 아이콘 캐싱 대상
        includeAssets: ['icons/*.png', 'icons/*.ico', 'icons/*.svg'],

        // ── Web App Manifest: 홈화면 설치 시 앱 정보 ──────────────────────
        manifest: {
          name: '그린대학교 출결 시스템',
          // [수정] 홈화면 아이콘 아래 표시될 이름 — iOS는 apple-mobile-web-app-title 우선, Android는 이 값 사용
          short_name: '그린대학출결시스템',
          description: '그린uni 학사관리 시스템 - QR 출석체크',
          theme_color: '#4a7cf7',         // 상단 브라우저 바 색상
          background_color: '#ffffff',    // 스플래시 화면 배경색
          display: 'standalone',          // 주소창·탭바 숨김 → 앱처럼 보임
          orientation: 'portrait',        // 세로 고정
          scope: '/',
          // [수정] 홈 화면으로 변경 — 출석 현황·QR 출석 선택 진입점
          start_url: '/student/attendances/home',
          icons: [
            {
              // iOS 홈화면 아이콘
              src: 'icons/apple-touch-icon.png',
              sizes: '180x180',
              type: 'image/png',
            },
            {
              src: 'icons/web-app-manifest-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: 'icons/web-app-manifest-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              // maskable: 안드로이드 어댑티브 아이콘(원형·모서리 둥글게) 지원
              purpose: 'maskable',
            },
          ],
        },

        // ── Workbox: 서비스 워커 캐싱 전략 ────────────────────────────────
        workbox: {
          // JS·CSS·HTML·이미지 등 정적 자산 캐싱 대상
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
          runtimeCaching: [
            {
              // API 응답: NetworkFirst — 네트워크 우선, 실패 시 캐시 반환
              // 출석·성적 등 실시간 데이터는 항상 최신값을 가져와야 하므로 NetworkFirst 사용
              urlPattern: /^\/api\//,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'api-cache',
                networkTimeoutSeconds: 5,   // 5초 내 응답 없으면 캐시 반환
                expiration: {
                  maxEntries: 50,
                  maxAgeSeconds: 60 * 60,   // 캐시 최대 보관 1시간
                },
              },
            },
          ],
        },
      }),
    ],
    resolve: {
      alias: { '@': path.resolve(__dirname, './src') }
    },
    server: {
      // [추가] 모든 네트워크 인터페이스 수신 → 같은 WiFi의 모바일에서 PC IP로 접근 가능
      host: '0.0.0.0',
      // [추가] ngrok 도메인 허용 (Vite 기본 차단 우회)
      allowedHosts: ['bottom-gleaming-lather.ngrok-free.dev'],
      // [주석] ngrok 사용 시 HTTP로 운영 (ngrok이 HTTPS 처리)
      // https: true,
      // [추가] /api/* 요청을 게이트웨이(8000)로 프록시
      // VITE_API_BASE_URL을 /api(상대경로)로 바꾸면 PC·모바일 모두 이 프록시를 경유
      proxy: {
        '/api': {
          target: 'http://localhost:8000',
          changeOrigin: true,
        }
      }
    }
  }
})