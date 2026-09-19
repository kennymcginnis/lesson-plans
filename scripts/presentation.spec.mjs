import { expect, test } from '@playwright/test'

const deckPath = '/presentations/isaiah-1-12/index.html'

test('closed slide navigation stays hidden and remains usable when opened', async ({ page }) => {
	await page.goto(`${deckPath}#/1`)
	const dialog = page.locator('#slidev-goto-dialog')
	const input = page.locator('#slidev-goto-input')
	await expect(input).toBeDisabled()
	await expect(dialog).toBeHidden()
	await expect(dialog.getByRole('button')).toHaveCount(0)

	await page.keyboard.press('g')
	await expect(input).toBeFocused()
	await expect(dialog).toBeVisible()
	await input.fill('Scarlet')
	await dialog.getByRole('button', { name: /Scarlet/ }).click()
	await expect(page).toHaveURL(/#\/5$/)
	await expect(dialog).toBeHidden()

	await page.locator('.slidev-page-5 h1').click()
	await page.keyboard.press('g')
	await expect(input).toBeFocused()
	await input.fill('Come')
	await expect(dialog.getByRole('button').first()).toBeVisible()
	await page.keyboard.press('Escape')
	await expect(input).toBeDisabled()
	await expect(dialog).toBeHidden()
	await expect(dialog.getByRole('button')).toHaveCount(0)
})

test('all ten slides fit, load local assets, navigate, and expose presenter notes', async ({ page }, testInfo) => {
	const errors = []
	page.on('pageerror', error => errors.push(error.message))
	await page.goto(`${deckPath}#/1`)

	for (let slideNumber = 1; slideNumber <= 10; slideNumber++) {
		await page.goto(`${deckPath}#/${slideNumber}`)
		const slide = page.locator(`.slidev-page-${slideNumber} .slidev-layout`)
		await expect(slide).toBeVisible()
		await expect.poll(() => slide.evaluate(element => element.getBoundingClientRect().width)).toBeGreaterThan(0)
		const overflow = await slide.evaluate(element => {
			const bounds = element.getBoundingClientRect()
			return [...element.querySelectorAll('h1, h2, p')]
				.filter(child => {
					const rect = child.getBoundingClientRect()
					return (
						rect.right > bounds.right + 1 ||
						rect.bottom > bounds.bottom + 1 ||
						rect.left < bounds.left - 1 ||
						rect.top < bounds.top - 1
					)
				})
				.map(child => child.textContent)
		})
		expect(overflow, `Slide ${slideNumber} has clipped text`).toEqual([])

		if (slideNumber === 5) {
			const image = slide.locator('img')
			await expect.poll(() => image.evaluate(element => element.complete && element.naturalWidth > 0)).toBe(true)
			expect(await image.evaluate(element => new URL(element.currentSrc).pathname)).toBe(
				'/presentations/isaiah-1-12/snow.jpg',
			)
		}

		if ([1, 3, 5, 10].includes(slideNumber)) {
			await page.mouse.move(0, 0)
			await page.screenshot({ path: testInfo.outputPath(`slide-${slideNumber}.png`) })
		}
	}

	await page.keyboard.press('ArrowLeft')
	await expect(page).toHaveURL(/#\/9$/)
	await page.keyboard.press('ArrowRight')
	await expect(page).toHaveURL(/#\/10$/)
	await page.reload()
	await expect(page.locator('.slidev-page-10 .slidev-layout')).toBeVisible()

	await page.goto(`${deckPath}#/presenter/1`)
	await expect(page.getByText('0-4 minutes, slides 1-2: Start with a situation.', { exact: false })).toBeVisible()
	expect(errors).toEqual([])
})

test('the lesson sidebar launches the static presentation', async ({ page }) => {
	await page.goto('/#/old-testament/38-isaiah-1-12/README')
	const sidebarLink = page.locator('.sidebar-nav').getByRole('link', { name: 'Presentation - Come Now', exact: true })
	await expect(sidebarLink).toHaveAttribute('href', '#/old-testament/38-isaiah-1-12/presentation')
	await page.goto('/#/old-testament/38-isaiah-1-12/presentation')
	const launch = page.getByRole('link', { name: 'Open the presentation', exact: true })
	await expect(launch).toHaveAttribute('href', 'presentations/isaiah-1-12/index.html')
	const url = await launch.evaluate(element => element.href)
	await page.goto(url)
	await expect(page.locator('.slidev-page-1 h1')).toHaveText('Come now.')
})
