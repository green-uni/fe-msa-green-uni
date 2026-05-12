import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig(({ mode }) => {
  console.log('mode: ', mode);
  const env = loadEnv(mode, process.cwd());

  return {
    build: {
      // .env 파일의 VITE_OUT_DIR 값을 사용하고, 없으면 기본값 'dist'를 사용합니다.
      outDir: env.VITE_OUT_DIR || 'dist',
      // 폴더가 비어있지 않아도 빌드 시 삭제 후 생성 (선택 사항)
      emptyOutDir: true,
    },
    plugins: [vue()],
    resolve: {
      alias: { '@': path.resolve(__dirname, './src') }
    }  
  }
})