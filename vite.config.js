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
      // [주석 처리] ngrok 사용 시 HTTPS는 ngrok이 담당하므로 basicSsl 불필요
      // 같은 WiFi 내 IP 접근 테스트 시에는 주석 해제
      // [주석 처리] ngrok 사용 시 HTTPS는 ngrok이 담당하므로 basicSsl 불필요
      // 같은 WiFi 내 IP 접근 테스트 시에는 주석 해제
      // basicSsl({
      //   domains: ['localhost', '192.168.0.31'],
      // }),
      // [추가] PWA 플러그인
      VitePWA({
        // 새 버전 배포 시 사용자 개입 없이 서비스 워커 자동 갱신
        registerType: 'autoUpdate',
        // [수정] 개발 서버에서 서비스 워커 비활성화 → ngrok 테스트 시 SW가 요청을 가로막는 문제 방지
        // PWA 설치·오프라인 테스트가 필요할 때만 true로 변경
        devOptions: { enabled: false },
        // 캐싱할 정적 자산 패턴
        includeAssets: ['icons/*.png', 'icons/favicon.ico', 'icons/apple-touch-icon.png'],

        // ── Web App Manifest: 홈화면 설치 시 앱 정보 ──────────────────────
        manifest: {
          name: '그린uni 학사관리',
          short_name: '그린uni',          // 홈화면 아이콘 아래 표시될 짧은 이름
          description: '그린uni 학사관리 시스템 - QR 출석체크',
          theme_color: '#4a7cf7',         // 상단 브라우저 바 색상
          background_color: '#ffffff',    // 스플래시 화면 배경색
          display: 'standalone',          // 주소창·탭바 숨김 → 앱처럼 보임
          orientation: 'portrait',        // 세로 고정
          scope: '/',
          start_url: '/student/attendances/scan', // 앱 아이콘 탭 시 첫 화면
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
      // [추가] ngrok 도메인 허용 (Vite 7 기본 차단 우회)
      // ngrok 무료 고정 도메인은 세션이 바뀌어도 동일하게 유지됨
      allowedHosts: ['bottom-gleaming-lather.ngrok-free.dev'],
      // [주석 처리] ngrok 사용 시 HTTP로 운영 (ngrok이 HTTPS 처리)
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