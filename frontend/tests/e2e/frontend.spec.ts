import { expect, test } from '@playwright/test'

test('shell exposes four routes without browser errors', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Briefing', exact: true })).toBeVisible()
  await expect(page.getByText('Fixture data')).toBeVisible()
  for (const label of ['Network', 'Case files', 'Add records']) {
    await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: label, exact: true }).click()
    await expect(page.getByRole('heading', { name: label, exact: true, level: 1 })).toBeVisible()
  }
  expect(errors).toEqual([])
})

test('network legend filters, search and canvas selection', async ({ page }) => {
  await page.goto('/network')
  await expect(page.getByText('28 entities')).toBeVisible()
  await page.getByRole('button', { name: /^Person/ }).click()
  await expect(page.getByText('20 entities')).toBeVisible()
  await page.getByRole('button', { name: 'Show all types' }).click()
  await page.getByLabel('Group', { exact: true }).selectOption('0')
  await expect(page.getByText('16 entities')).toBeVisible()
  await page.getByLabel('Group', { exact: true }).selectOption('')
  await page.getByLabel('Search entities').fill('Santosh')
  await page.getByRole('option', { name: 'Santosh Pawar Person' }).click()
  await expect(page.locator('.stage-foot')).toContainText('Selected: Santosh Pawar')
  await page.getByRole('button', { name: 'Fit network to view' }).click()
  for (const type of ['Person', 'Phone', 'Vehicle', 'Place', 'Organization', 'Account', 'FIR']) await page.getByRole('button', { name: new RegExp(`^${type} `) }).click()
  await expect(page.getByText('No entities match these filters.')).toBeVisible()
  await page.getByRole('button', { name: 'Show all types' }).click()
  await expect(page.locator('canvas').first()).toBeVisible()
  await page.screenshot({ path: 'test-results/b1-network.png', fullPage: true })
  await page.waitForTimeout(3000)
  const point = await page.locator('canvas').first().evaluate((canvas: HTMLCanvasElement) => {
    const context = canvas.getContext('2d')!, pixels = context.getImageData(0, 0, canvas.width, canvas.height).data
    for (let y = 50; y < canvas.height - 50; y++) for (let x = 20; x < canvas.width - 20; x++) {
      const i = (y * canvas.width + x) * 4
      if (pixels[i] === 95 && pixels[i + 1] === 211 && pixels[i + 2] === 154) return { x: x * canvas.clientWidth / canvas.width, y: (y + 3) * canvas.clientHeight / canvas.height }
    }
    return null
  })
  expect(point).not.toBeNull()
  await page.locator('canvas').first().click({ position: point! })
  await expect(page.locator('.stage-foot')).not.toContainText('Santosh Pawar')
  await expect(page.locator('.stage-foot')).toContainText('Selected:')
})

test('briefing, entity focus, neighbors and expansion', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('.brief-text')).toContainText('28')
  await expect(page.getByRole('table')).toContainText('Farid Khan')
  await expect(page.locator('.lead a')).toHaveCount(4)
  await page.screenshot({ path: 'test-results/b2-briefing.png', fullPage: true })
  await page.getByRole('table').getByRole('link', { name: 'Santosh Pawar', exact: true }).click()
  const inspector = page.getByRole('complementary', { name: 'Inspector' })
  await expect(inspector.getByRole('heading', { name: 'Santosh Pawar', exact: true })).toBeVisible()
  await expect(inspector).toContainText('Not named in any FIR')
  await inspector.getByRole('button', { name: 'Focus neighborhood' }).click()
  await expect(page.getByText('3 entities')).toBeVisible()
  await page.getByLabel('Search entities').fill('9850022334')
  await page.getByRole('option', { name: '9850022334 Phone' }).click()
  await inspector.getByRole('button', { name: 'Expand neighbors' }).click()
  await expect(page.getByText('5 entities')).toBeVisible()
  await page.getByRole('button', { name: 'Show full network' }).click()
  await expect(page.getByText('28 entities')).toBeVisible()
  await page.getByLabel('Search entities').fill('Vikram Singh')
  await page.getByRole('option', { name: 'Vikram Singh Person' }).click()
  await expect(inspector.getByRole('link', { name: 'FIR-2026-0042' })).toBeVisible()
  await inspector.getByRole('button', { name: '9876543210 owns' }).click()
  await expect(inspector.getByRole('heading', { name: '9876543210', exact: true })).toBeVisible()
  await page.screenshot({ path: 'test-results/b2-entity.png', fullPage: true })
})

test('routes, alert highlighting and case files', async ({ page }) => {
  await page.goto('/network')
  await page.getByRole('tab', { name: 'Route' }).click()
  await page.getByLabel('Search From entity').fill('9420055667')
  await page.getByRole('option', { name: '9420055667 Phone' }).click()
  await page.getByLabel('Search To entity').fill('Vikram')
  await page.getByRole('option', { name: 'Vikram Singh Person' }).click()
  await page.getByRole('button', { name: 'Trace route', exact: true }).click()
  await expect(page.locator('.route-steps')).toContainText('9420055667')
  await expect(page.locator('.route-steps')).toContainText('Vikram Singh')
  await expect(page.locator('.stage-foot')).toContainText('hops')
  await page.getByRole('tab', { name: 'Alerts' }).click()
  await page.getByRole('button', { name: 'Santosh Pawar bridges', exact: false }).click()
  const inspector = page.getByRole('complementary', { name: 'Inspector' })
  await expect(inspector.getByRole('heading', { name: 'Santosh Pawar' })).toBeVisible()
  await expect(page.locator('.stage-foot')).toContainText('5 entities highlighted')
  await page.getByRole('navigation').getByRole('link', { name: 'Case files' }).click()
  await page.getByRole('button', { name: 'FIR-2026-0042', exact: false }).click()
  await expect(page.locator('.sheet a')).toHaveCount(11)
  await expect(page.locator('.sheet')).toContainText('On 14 August 2026')
  await page.screenshot({ path: 'test-results/b3-cases.png', fullPage: true })
  await page.locator('.chips').getByRole('link', { name: 'Rahul Jadhav Person' }).click()
  await expect(inspector.getByRole('heading', { name: 'Rahul Jadhav' })).toBeVisible()
})
