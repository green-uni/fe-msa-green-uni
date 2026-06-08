import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import os from 'os'
import basicSsl from '@vitejs/plugin-basic-ssl'
import { VitePWA } from 'vite-plugin-pwa'

// 현재 PC의 192.168.x.x 대역 IP를 자동 감지 — PC가 바뀌어도 수동 수정 불필요
function getLocalIP() {
  const interfaces = os.networkInterfaces()
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal && iface.address.startsWith('192.168.')) {
        return iface.address
      }
    }
  }
  return 'localhost'
}

export default defineConfig(({ mode }) => {
  console.log('mode: ', mode);
  const env = loadEnv(mode, process.cwd());
  const localIP = getLocalIP()

  // .env.development에 VITE_SCAN_BASE_URL이 있으면 그 값 우선 사용 (ngrok 고정 도메인 등)
  // 없으면 현재 PC IP 자동 감지
  const scanBaseUrl = env.VITE_SCAN_BASE_URL || `http://${localIP}:5173`
  const isNgrok = scanBaseUrl.includes('ngrok')

  return {
    build: {
      outDir: env.VITE_OUT_DIR || 'dist',
      emptyOutDir: true,
    },
    plugins: [
      vue(),
      VitePWA({
        registerType: 'autoUpdate',
        // dev 서버에서 SW 활성화 — iOS 16.4+: SW 없으면 웹클립으로 간주 → 주소창 표시
        // production 빌드(npm run build)는 devOptions 무관하게 항상 SW 포함
        // 캐시 문제 발생 시 브라우저에서 Ctrl+Shift+R(강력 새로고침) 사용
        devOptions: {
          enabled: true,            // iOS 16.4+: SW 없으면 웹클립으로 인식 → 주소창 표시
          type: 'module',           // Vite HMR과 충돌 방지
          navigateFallback: 'index.html', // SPA 딥링크 정상 동작
        },
        includeAssets: ['icons/*.png', 'icons/*.ico', 'icons/*.svg'],

        manifest: {
          name: '그린대학교 출결 시스템',
          short_name: '그린대학출결시스템',
          description: '그린uni 학사관리 시스템 - QR 출석체크',
          theme_color: '#4a7cf7',         
          background_color: '#ffffff',    
          display: 'standalone',          
          orientation: 'portrait',        
          scope: '/',
          // [수정] 홈 화면으로 변경 — 출석 현황·QR 출석 선택 진입점
          start_url: '/student/login',
          icons: [
            {
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
              purpose: 'maskable',
            },
          ],
        },

        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
          runtimeCaching: [
            {
              urlPattern: /^\/api\//,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'api-cache',
                networkTimeoutSeconds: 5,   
                expiration: {
                  maxEntries: 50,
                  maxAgeSeconds: 60 * 60,   
                },
              },
            },
          ],
        },
      }),
    ],
    define: {
      global: 'globalThis',
      ...(mode === 'development' && {
        'import.meta.env.VITE_SCAN_BASE_URL': JSON.stringify(scanBaseUrl),
      }),
    },

    resolve: {
      alias: { '@': path.resolve(__dirname, './src') }
    },
    css: {
      preprocessorOptions: {
        scss: {
          loadPaths: [path.resolve(__dirname, 'src/assets/styles')],
          additionalData: (content, filepath) => {
            if (filepath.includes('styles.scss')) return content
            return `@use "variables" as *;\n` + content
          }
        }
      }
    },
    server: {
      host: '0.0.0.0',
      port: 5173, // 💡 혹시 모를 포트 꼬임 방지를 위해 명시적 지정
      
      // 🎯 [수정] ngrok 터널링 시 유효하지 않은 호스트 차단 필터를 완전히 허용으로 변경
      allowedHosts: 'all', 
      
      // 🎯 ngrok을 쓰고 있다면 wss와 ngrok 도메인으로 수신 대기하도록 정교하게 세팅되어 있습니다.
      hmr: isNgrok
        ? { host: new URL(scanBaseUrl).hostname, clientPort: 443, protocol: 'wss' }
        : { host: localIP },
        
      proxy: {
        '/api': {
          target: 'http://localhost:8000',
          changeOrigin: true,
          cookieDomainRewrite: '',
          headers: { Origin: 'http://localhost:5173' },
        },
        '/file': {
          target: 'http://localhost:8000',
          changeOrigin: true,
          cookieDomainRewrite: '',
          headers: { Origin: 'http://localhost:5173' },
        }
      }
    },
    preview: {
      host: '0.0.0.0',
      proxy: {
        '/api': {
          target: 'http://localhost:8000',
          changeOrigin: true,
          cookieDomainRewrite: '',
          headers: { Origin: 'http://localhost:5173' },
        },
        '/file': {
          target: 'http://localhost:8000',
          changeOrigin: true,
          cookieDomainRewrite: '',
          headers: { Origin: 'http://localhost:5173' },
        }
      }
    }
  }
})