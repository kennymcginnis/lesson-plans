import assert from 'node:assert/strict'
import { test } from 'node:test'
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { runInNewContext } from 'node:vm'
import { buildNavigation, writeNavigation } from './build-navigation.mjs'

function catalog() {
	return {
		currentLesson: 'old-testament/37-proverbs-ecclesiastes',
		courses: [
			{
				id: 'old-testament',
				title: 'Old Testament',
				lessons: [
					{
						week: 37,
						slug: 'proverbs-ecclesiastes',
						subject: 'Proverbs & Ecclesiastes',
						title: 'He Shall Direct Thy Paths',
						legacyPath: 'proverbs-ecclesiastes',
						pages: [{ title: 'Trust', file: 'trust.md' }],
					},
					{
						week: 9,
						slug: 'genesis',
						subject: 'Genesis',
						title: 'Genesis Lesson',
						legacyPath: 'genesis',
						pages: [{ title: 'Covenants', file: 'covenants.md' }],
					},
				],
			},
			{ id: 'new-testament', title: 'New Testament', lessons: [] },
		],
	}
}

test('nests every lesson page under its archive entry and sorts populated courses by week', () => {
	const result = buildNavigation(catalog())
	assert.match(result.sidebar, /- This Week\n  - \[He Shall Direct Thy Paths\]/)
	assert.match(result.sidebar, /\[Trust\]\(old-testament\/37-proverbs-ecclesiastes\/trust.md\)/)
	assert.ok(
		result.sidebar.includes(
			'  - [Week 09 - Genesis](old-testament/09-genesis/README.md)\n    - [Covenants](old-testament/09-genesis/covenants.md)',
		),
	)
	assert.ok(
		result.sidebar.includes(
			'  - [Week 37 - Proverbs & Ecclesiastes](old-testament/37-proverbs-ecclesiastes/README.md)\n    - [Trust](old-testament/37-proverbs-ecclesiastes/trust.md)',
		),
	)
	assert.ok(result.sidebar.indexOf('Week 09') < result.sidebar.indexOf('Week 37'))
	assert.ok(!result.sidebar.includes('New Testament'))
	assert.match(result.home, /## This Week/)
	assert.equal(result.files.length, 4)
})

test('switches This Week with one setting while retaining the archive and old routes', () => {
	const input = catalog()
	input.currentLesson = 'old-testament/09-genesis'
	const result = buildNavigation(input)
	assert.match(result.sidebar, /- This Week\n  - \[Genesis Lesson\]/)
	assert.ok(result.sidebar.includes('[Covenants]'))
	assert.ok(result.sidebar.includes('    - [Trust](old-testament/37-proverbs-ecclesiastes/trust.md)'))
	assert.ok(!result.sidebar.split('- Old Testament')[0].includes('[Trust]'))
	assert.ok(result.sidebar.includes('Week 37'))
	assert.equal(result.aliases['/proverbs-ecclesiastes/(.*)'], '/old-testament/37-proverbs-ecclesiastes/$1')
	assert.equal(result.aliases['/.*/_sidebar.md'], '/_sidebar.md')
})

test('preserves renamed page URLs with and without a Markdown extension', () => {
	const input = catalog()
	input.courses[0].lessons[0].pages[0].legacyFiles = ['old-trust.md']
	const result = buildNavigation(input)
	const pattern = '/old-testament/37-proverbs-ecclesiastes/old-trust(\\.md)?$'
	assert.equal(result.aliases[pattern], '/old-testament/37-proverbs-ecclesiastes/trust.md')
	assert.ok(new RegExp(pattern).test('/old-testament/37-proverbs-ecclesiastes/old-trust'))
	assert.ok(new RegExp(pattern).test('/old-testament/37-proverbs-ecclesiastes/old-trust.md'))
	input.courses[0].lessons[0].pages[0].legacyFiles = ['trust.md']
	assert.throws(() => buildNavigation(input), /Legacy file is still a page/)
})

test('rejects an unknown current lesson, duplicate weeks, and unsafe page paths', () => {
	const input = catalog()
	input.currentLesson = 'missing'
	assert.throws(() => buildNavigation(input), /Unknown currentLesson/)
	const duplicate = catalog()
	duplicate.courses[0].lessons[1].week = 37
	assert.throws(() => buildNavigation(duplicate), /Duplicate week/)
	const unsafe = catalog()
	unsafe.courses[0].lessons[0].pages[0].file = '../outside.md'
	assert.throws(() => buildNavigation(unsafe))
})

test('checks all page targets before writing deterministic static navigation', () => {
	const root = mkdtempSync(join(tmpdir(), 'lesson-navigation-'))
	try {
		const input = catalog()
		mkdirSync(join(root, 'docs'))
		writeFileSync(join(root, 'lessons.json'), JSON.stringify(input))
		writeFileSync(join(root, 'docs', '_sidebar.md'), 'unchanged')
		assert.throws(() => writeNavigation(root), /Missing lesson page/)
		assert.equal(readFileSync(join(root, 'docs', '_sidebar.md'), 'utf8'), 'unchanged')
		for (const file of buildNavigation(input).files) {
			mkdirSync(join(root, 'docs', file, '..'), { recursive: true })
			writeFileSync(join(root, 'docs', file), '# Lesson\n')
		}
		const result = writeNavigation(root)
		assert.equal(readFileSync(join(root, 'docs', '_sidebar.md'), 'utf8'), result.sidebar)
		assert.equal(readFileSync(join(root, 'docs', 'README.md'), 'utf8'), result.home)
		const context = { window: {} }
		runInNewContext(readFileSync(join(root, 'docs', 'lesson-routes.js'), 'utf8'), context)
		assert.ok(context.window.lessonSearchPaths.includes('/old-testament/09-genesis/covenants'))
		assert.ok(context.window.lessonSearchPaths.includes('/old-testament/37-proverbs-ecclesiastes/trust'))
		assert.equal(context.window.lessonSearchPaths.length, result.files.length + 1)
		assert.equal(writeNavigation(root).sidebar, result.sidebar)
	} finally {
		rmSync(root, { recursive: true, force: true })
	}
})
