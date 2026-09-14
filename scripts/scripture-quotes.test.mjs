import assert from 'node:assert/strict'
import { readdirSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'
import { test } from 'node:test'

function checkVerseNumbers(markdown, file = 'fixture') {
	const lines = markdown.split('\n')
	let previousVerse
	let emptyRows = 0

	for (const [index, source] of lines.entries()) {
		const line = source.trimStart()
		const location = `${file}:${index + 1}`
		if (!line.startsWith('>')) {
			previousVerse = undefined
			emptyRows = 0
			continue
		}
		if (/^>\s*$/.test(line)) {
			emptyRows++
			continue
		}

		const numbered = line.match(/^> (\d+)\. /)
		const citation =
			lines[index + 1] === ''
				? lines[index + 2]?.match(/^(?:[1-3] )?(?:[A-Z][A-Za-z&]*|Doctrine and Covenants) \d+:(\d+)(?:[,.]|$)/)
				: undefined
		if (citation) {
			assert.equal(numbered?.[1], citation[1], `${location}: number must match the scripture citation`)
		}
		if (!numbered) continue

		const verse = Number(numbered[1])
		if (previousVerse !== undefined && verse !== previousVerse + 1) {
			assert.ok(emptyRows >= 2, `${location}: skipped verses need two empty > rows`)
		}
		const inlineCitation = line.match(/\((?:(?:Ps\.|[A-Za-z]+) )?\d+:(\d+)(?: NIV)?\)/)
		if (inlineCitation) {
			assert.equal(numbered[1], inlineCitation[1], `${location}: number must match the inline citation`)
		}
		previousVerse = verse
		emptyRows = 0
	}
}

function lessonFiles(directory) {
	return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
		const path = join(directory, entry.name)
		return entry.isDirectory() ? lessonFiles(path) : entry.name.endsWith('.md') ? [path] : []
	})
}

test('accepts consecutive verses, separated gaps, continuation lines, and non-scripture quotes', () => {
	checkVerseNumbers('> 1. First\n> 2. Second\n>    continued\n>\n>\n> 4. Fourth')
	checkVerseNumbers('  > 3. Third\n  >\n  >\n  > 5. Fifth')
	checkVerseNumbers('> 8. Eighth\n\n> 1. A different chapter')
	checkVerseNumbers('> A discussion question?\n\n> A speaker quotation.')
	checkVerseNumbers('> A title-page excerpt.\n\nTitle page, excerpt.')
	checkVerseNumbers('> A speaker quotation.\n\nThis is a suggested pairing with Proverbs 4:18, not a scripture quote.')
})

test('rejects missing separators, missing verse numbers, and incorrect verse numbers', () => {
	for (const separator of ['\n', '\n>\n']) {
		assert.throws(() => checkVerseNumbers(`> 1. First${separator}> 4. Fourth`), /two empty > rows/)
	}
	assert.throws(() => checkVerseNumbers('> A soft answer.\n\nProverbs 15:1, KJV.'), /scripture citation/)
	assert.throws(() => checkVerseNumbers('> 2. An excerpt.\n\nD&C 64:34, excerpt.'), /scripture citation/)
	assert.throws(() => checkVerseNumbers('> 2. Delivered my soul. (116:8)'), /inline citation/)
})

test('lesson scripture quotes preserve their cited numbers and skipped-verse spacing', () => {
	const docs = fileURLToPath(new URL('../docs/', import.meta.url))
	for (const file of lessonFiles(docs)) {
		checkVerseNumbers(readFileSync(file, 'utf8'), file)
	}
})
