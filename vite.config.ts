import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// Vercel 平台自动注入 VERCEL 环境变量；本地 vercel CLI 部署时不注入，通过 DEPLOY_TARGET 兜底
const isVercel = process.env.VERCEL || process.env.VERCEL_ENV || process.env.DEPLOY_TARGET === 'vercel';
const BASE = isVercel ? '/' : '/jiangsu-edu-crm/';

export default defineConfig({
  plugins: [react()],
  base: BASE,
})
