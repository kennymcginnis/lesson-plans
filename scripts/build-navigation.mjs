import assert from 'node:assert/strict'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

export function buildNavigation(catalog) {
	const lessons = new Map()
	const courses = []
	const aliases = { '/.*/_sidebar.md': '/_sidebar.md' }
	const files = new Set()
	const courseIds = new Set()

	for (const course of catalog.courses) {
		assert.match(course.id, /^[a-z0-9]+(?:-[a-z0-9]+)*$/)
		assert.ok(!courseIds.has(course.id), `Duplicate course: ${course.id}`)
		courseIds.add(course.id)
		const entries = []
		const weeks = new Set()

		for (const lesson of course.lessons) {
			assert.ok(Number.isInteger(lesson.week) && lesson.week >= 1 && lesson.week <= 53, 'Invalid week')
			assert.ok(!weeks.has(lesson.week), `Duplicate week in ${course.id}: ${lesson.week}`)
			weeks.add(lesson.week)
			assert.match(lesson.slug, /^[a-z0-9]+(?:-[a-z0-9]+)*$/)
			const week = String(lesson.week).padStart(2, '0')
			const path = `${course.id}/${week}-${lesson.slug}`
			const entry = { ...lesson, path, label: `Week ${week} - ${lesson.subject}` }
			files.add(`${path}/README.md`)

			for (const page of lesson.pages) {
				assert.match(page.file, /^[a-z0-9]+(?:-[a-z0-9]+)*\.md$/)
				assert.ok(!files.has(`${path}/${page.file}`), `Duplicate page: ${path}/${page.file}`)
				files.add(`${path}/${page.file}`)
				for (const legacyFile of page.legacyFiles ?? []) {
					assert.match(legacyFile, /^[a-z0-9]+(?:-[a-z0-9]+)*\.md$/)
					assert.ok(
						!lesson.pages.some(candidate => candidate.file === legacyFile),
						`Legacy file is still a page: ${legacyFile}`,
					)
					const pattern = `/${path}/${legacyFile.replace(/\.md$/, '')}(\\.md)?$`
					assert.ok(!aliases[pattern], `Duplicate legacy file: ${legacyFile}`)
					aliases[pattern] = `/${path}/${page.file}`
				}
			}

			if (lesson.legacyPath) {
				assert.match(lesson.legacyPath, /^[a-z0-9]+(?:-[a-z0-9]+)*$/)
				const pattern = `/${lesson.legacyPath}/(.*)`
				assert.ok(!aliases[pattern], `Duplicate legacy path: ${lesson.legacyPath}`)
				aliases[pattern] = `/${path}/$1`
			}

			lessons.set(path, entry)
			entries.push(entry)
		}

		if (entries.length) {
			courses.push({ title: course.title, lessons: entries.sort((first, second) => first.week - second.week) })
		}
	}

	const current = lessons.get(catalog.currentLesson)
	assert.ok(current, `Unknown currentLesson: ${catalog.currentLesson}`)
	const sidebar = ['- [Home](/)', '- This Week', `  - [${current.title}](${current.path}/README.md)`]
	const home = ['# Lesson Plans', '', '## This Week', '', `[${current.title}](${current.path}/README.md)`, '']

	for (const page of current.pages) {
		sidebar.push(`  - [${page.title}](${current.path}/${page.file})`)
	}

	for (const course of courses) {
		sidebar.push(`- ${course.title}`)
		home.push(`## ${course.title}`, '')
		for (const lesson of course.lessons) {
			sidebar.push(`  - [${lesson.label}](${lesson.path}/README.md)`)
			home.push(`- [${lesson.label}](${lesson.path}/README.md)`)
		}
		home.push('')
	}

	return { sidebar: `${sidebar.join('\n')}\n`, home: home.join('\n'), aliases, files: [...files] }
}

export function writeNavigation(root) {
	const catalog = JSON.parse(readFileSync(join(root, 'lessons.json'), 'utf8'))
	const result = buildNavigation(catalog)
	for (const file of result.files) {
		assert.ok(existsSync(join(root, 'docs', file)), `Missing lesson page: ${file}`)
	}
	writeFileSync(join(root, 'docs', '_sidebar.md'), result.sidebar)
	writeFileSync(join(root, 'docs', 'README.md'), result.home)
	const searchPaths = ['/', ...result.files.map(file => `/${file.replace(/\.md$/, '')}`)]
	writeFileSync(
		join(root, 'docs', 'lesson-routes.js'),
		`window.lessonAliases = ${JSON.stringify(result.aliases, null, 2)};\n` +
			`window.lessonSearchPaths = ${JSON.stringify(searchPaths, null, 2)};\n`,
	)
	return result
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
	const result = writeNavigation(resolve(dirname(fileURLToPath(import.meta.url)), '..'))
	console.log(`Built navigation for ${result.files.length} lesson pages.`)
}
