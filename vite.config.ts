import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// 根据环境切换 base：GitHub Pages 用 /jiangsu-edu-crm/，Vercel 用 /
const BASE = process.env.VERCEL ? '/' : '/jiangsu-edu-crm/';

export default defineConfig({
  plugins: [react()],
  base: BASE,
})
