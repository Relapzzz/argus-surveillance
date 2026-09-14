import { expect, test } from '@playwright/test'

test('shell exposes four routes without browser errors', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Network overview' })).toBeVisible()
  await expect(page.getByText('Fixture mode · read only')).toBeVisible()
  for (const [label, heading] of [['Network', 'Network explorer'], ['Cases', 'Source cases'], ['Ingest', 'Add source records']]) {
    await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: label, exact: true }).click()
    await expect(page.getByRole('heading', { name: heading, exact: true })).toBeVisible()
  }
  expect(errors).toEqual([])
})

test('B1 graph filters, search, and canvas selection', async ({ page }) => {
  await page.goto('/network')
  await expect(page.getByText('28 entities', { exact: false })).toBeVisible()
  await page.getByRole('checkbox', { name: 'person', exact: true }).uncheck()
  await expect(page.getByText('20 entities', { exact: false })).toBeVisible()
  await page.getByRole('button', { name: 'Clear filters' }).click()
  await page.getByLabel('Community', { exact: true }).selectOption('0')
  await expect(page.getByText('16 entities', { exact: false })).toBeVisible()
  await page.getByRole('button', { name: 'Clear filters' }).click()
  await page.getByLabel('Search entities').fill('Santosh')
  await page.getByRole('button', { name: 'Santosh Pawar person' }).click()
  await expect(page.getByText('Selected: Santosh Pawar', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Close', exact: true }).click()
  await page.getByRole('button', { name: 'Fit network to view' }).click()
  for (const type of ['person', 'phone', 'vehicle', 'location', 'organization', 'account', 'case']) await page.getByRole('checkbox', { name: type, exact: true }).uncheck()
  await expect(page.getByText('No entities match these filters.')).toBeVisible()
  await page.getByRole('button', { name: 'Clear filters' }).click()
  await expect(page.locator('canvas').first()).toBeVisible()
  await page.screenshot({ path: 'test-results/b1-network.png', fullPage: true })
  await page.waitForTimeout(1200)
  const point = await page.locator('canvas').first().evaluate((canvas: HTMLCanvasElement) => {
    const context = canvas.getContext('2d')!, pixels = context.getImageData(0, 0, canvas.width, canvas.height).data
    for (let y = 50; y < canvas.height - 50; y++) for (let x = 20; x < canvas.width - 20; x++) {
      const i = (y * canvas.width + x) * 4
      if (pixels[i] === 118 && pixels[i + 1] === 200 && pixels[i + 2] === 192) return { x: x * canvas.clientWidth / canvas.width, y: (y + 3) * canvas.clientHeight / canvas.height }
    }
    return null
  })
  expect(point).not.toBeNull()
  await page.locator('canvas').first().click({ position: point! })
  await expect(page.locator('.selection-summary')).not.toHaveText('Selected: Santosh Pawar')
  await expect(page.locator('.selection-summary')).toContainText('Selected:')
})

test('B2 dashboard and entity focus, neighbors, and expansion', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('.stat-card strong')).toHaveText(['28', '53', '2', '4'])
  await expect(page.getByRole('table')).toContainText('Farid Khan')
  await expect(page.locator('.alert-item')).toHaveCount(4)
  await page.screenshot({ path: 'test-results/b2-dashboard.png', fullPage: true })
  await page.getByRole('link', { name: 'Santosh Pawar', exact: true }).click()
  const drawer = page.getByRole('dialog')
  await expect(drawer.getByRole('heading', { name: 'Santosh Pawar', exact: true })).toBeVisible()
  await expect(drawer).toContainText('No source case is linked')
  await drawer.getByRole('button', { name: 'Focus neighborhood' }).click()
  await expect(page.getByText('3 entities', { exact: false })).toBeVisible()
  await page.getByLabel('Search entities').fill('9850022334')
  await page.getByRole('button', { name: '9850022334 phone' }).click()
  await drawer.getByRole('button', { name: 'Expand neighbors' }).click()
  await expect(page.getByText('5 entities', { exact: false })).toBeVisible()
  await page.getByRole('button', { name: 'Show full network' }).click()
  await expect(page.getByText('28 entities', { exact: false })).toBeVisible()
  await page.getByLabel('Search entities').fill('Vikram Singh')
  await page.getByRole('button', { name: 'Vikram Singh person' }).click()
  await expect(drawer.getByRole('link', { name: 'case:FIR-2026-0042' })).toBeVisible()
  await drawer.getByRole('button', { name: '9876543210 owns' }).click()
  await expect(drawer.getByRole('heading', { name: '9876543210', exact: true })).toBeVisible()
  await page.screenshot({ path: 'test-results/b2-entity.png', fullPage: true })
})

test('B3 paths, alert highlighting, and source cases', async ({ page }) => {
  await page.goto('/network')
  await page.getByLabel('Search source entities').fill('9420055667')
  await page.getByLabel('Source entity', { exact: true }).selectOption('phone:9420055667')
  await page.getByLabel('Search target entities').fill('Vikram')
  await page.getByLabel('Target entity', { exact: true }).selectOption('person:vikram singh')
  await page.getByRole('button', { name: 'Find path', exact: true }).click()
  await expect(page.locator('.path-result')).toContainText('9420055667')
  await expect(page.locator('.path-result')).toContainText('Vikram Singh')
  await expect(page.locator('.highlight-summary')).toContainText('path edges')
  await page.locator('.network-alerts > summary').click()
  await page.getByRole('button', { name: 'Santosh Pawar bridges', exact: false }).click()
  await expect(page.getByRole('dialog').getByRole('heading', { name: 'Santosh Pawar' })).toBeVisible()
  await expect(page.locator('.highlight-summary')).toContainText('5 highlighted entities')
  await page.getByRole('button', { name: 'Close', exact: true }).click()
  await page.getByRole('navigation').getByRole('link', { name: 'Cases' }).click()
  await page.getByRole('button', { name: 'FIR-2026-0042', exact: false }).click()
  await expect(page.locator('.narrative-span')).toHaveCount(11)
  await expect(page.locator('.narrative')).toContainText('On 14 August 2026')
  await page.screenshot({ path: 'test-results/b3-cases.png', fullPage: true })
  await page.locator('.entity-chips').getByRole('link', { name: 'Rahul Jadhav person' }).click()
  await expect(page.getByRole('dialog').getByRole('heading', { name: 'Rahul Jadhav' })).toBeVisible()
})
