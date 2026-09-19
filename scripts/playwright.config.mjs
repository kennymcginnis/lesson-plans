import { defineConfig } from '@playwright/test'
import { fileURLToPath } from 'node:url'

export default defineConfig({
	testDir: '.',
	testMatch: 'presentation.spec.mjs',
	outputDir: '../test-results',
	use: {
		baseURL: 'http://127.0.0.1:3002',
		channel: process.env.PLAYWRIGHT_CHANNEL || undefined,
		reducedMotion: 'reduce',
	},
	projects: [
		{ name: 'desktop', use: { viewport: { width: 1440, height: 900 } } },
		{ name: 'mobile', use: { viewport: { width: 390, height: 844 } } },
	],
	webServer: {
		command: 'npm run docs:serve -- --port 3002',
		cwd: fileURLToPath(new URL('../', import.meta.url)),
		url: 'http://127.0.0.1:3002',
		reuseExistingServer: !process.env.CI,
	},
})
