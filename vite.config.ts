import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Shudanのpreactコンポーネントをreactで動作させるための設定
      'preact/hooks': 'react',
      'preact': 'react',
    },
  },
  optimizeDeps: {
    include: ['@sabaki/shudan'],
  },
})
