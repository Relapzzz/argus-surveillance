import { expect, test } from '@playwright/test'

const bridge = 'person:dinesh deshmukh'

test('shell exposes every page without browser errors', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Overview', exact: true, level: 1 })).toBeVisible()
  await expect(page.getByText('Demo records, read only')).toBeVisible()
  const nav = page.getByRole('navigation', { name: 'Main navigation' })
  await expect(nav.getByRole('link')).toHaveCount(7)
  await expect(nav.getByText('नेटवर्क')).toBeVisible()
  for (const label of ['Network', 'Timeline', 'Map', 'Case files', 'Alerts', 'Add records']) {
    await nav.getByRole('link', { name: new RegExp(`^${label}`) }).click()
    await expect(page.getByRole('heading', { name: label, exact: true, level: 1 })).toBeVisible()
  }
  expect(errors).toEqual([])
})

test('overview states the finding and the guide opens the go-between', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('.brief-text')).toContainText('40')
  await expect(page.locator('.brief-text')).toContainText('Dinesh Deshmukh')
  await expect(page.getByText('3,000')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'People who matter' })).toBeVisible()
  await expect(page.getByText('Vijay Desai', { exact: true }).first()).toBeVisible()
  await page.getByRole('button', { name: /^Guide/ }).click()
  await page.getByRole('button', { name: /See who connects the groups/ }).click()
  await expect(page).toHaveURL(/\/network\?/)
  expect(decodeURIComponent(page.url()).replaceAll('+', ' ')).toContain(`entity=${bridge}`)
  await expect(page.locator('.stage-foot')).toContainText('entities highlighted')
  await expect(page.getByRole('complementary', { name: 'Inspector' }).getByRole('heading', { name: 'Dinesh Deshmukh' })).toBeVisible()
})

test('network legend, search, route from a link and alert highlight', async ({ page }) => {
  await page.goto('/network')
  await expect(page.locator('.stage-foot')).toContainText('225 entities and 1,820 relationships')
  await page.getByRole('button', { name: /^Person/ }).click()
  await expect(page.locator('.stage-foot')).toContainText('179 entities')
  await page.getByRole('button', { name: 'Show all types' }).click()
  await page.getByLabel('Search entities').fill('Dinesh')
  await page.getByRole('option', { name: 'Dinesh Deshmukh Person' }).click()
  await expect(page.locator('.stage-foot')).toContainText('Selected: Dinesh Deshmukh')
  const inspector = page.getByRole('complementary', { name: 'Inspector' })
  await expect(inspector).toContainText('only route between')
  await expect(inspector).toContainText('Not named in any FIR')
  await page.goto('/network?tab=route&from=phone%3A9774964990&to=person%3Aaslam%20khan')
  await expect(page.locator('.route-steps li')).toHaveCount(4)
  await expect(page.locator('.stage-foot')).toContainText('3 hops')
  await page.getByRole('tab', { name: 'Alerts' }).click()
  await page.getByRole('button', { name: /Dinesh Deshmukh bridges/ }).click()
  await expect(inspector.getByRole('heading', { name: 'Dinesh Deshmukh' })).toBeVisible()
  await expect(page.locator('.stage-foot')).toContainText('8 entities highlighted')
})

test('profile explains the go-between and prints without chrome', async ({ page }) => {
  await page.goto(`/entity/${encodeURIComponent(bridge)}`)
  await expect(page.getByRole('heading', { name: 'Dinesh Deshmukh', level: 1 })).toBeVisible()
  await expect(page.getByText('only route between')).toBeVisible()
  await expect(page.getByText('63186 99938').first()).toBeVisible()
  await expect(page.getByText('Not named in any FIR').first()).toBeVisible()
  await page.emulateMedia({ media: 'print' })
  await expect(page.locator('.topbar')).toBeHidden()
  await page.screenshot({ path: 'test-results/profile-print.png', fullPage: true })
})

test('timeline shows the go-between talking to both groups', async ({ page }) => {
  await page.goto(`/timeline?entity=${encodeURIComponent(bridge)}`)
  const chart = page.locator('.swim')
  await expect(chart).toContainText('Aslam Khan')
  await expect(chart).toContainText('Vijay Desai')
  await expect(page.getByText(/\d+ calls and \d+ transfers between/)).toBeVisible()
})

test('map draws the places without tiles', async ({ page }) => {
  await page.route('**/tile.openstreetmap.org/**', route => route.abort())
  await page.goto('/map')
  await expect(page.locator('.leaflet-interactive')).toHaveCount(16)
  await expect(page.getByRole('heading', { name: 'Places' })).toBeVisible()
  await expect(page.getByText('Kondhwa', { exact: true }).first()).toBeVisible()
})

test('case files show the FIR sheet and the alerts page filters', async ({ page }) => {
  await page.goto('/cases?case=case%3AFIR-2026-0001')
  const sheet = page.locator('.sheet')
  await expect(sheet).toContainText('Swapnil Joshi')
  await expect(sheet).toContainText('Shivajinagar')
  await expect(sheet).toContainText('14 June 2026')
  await expect(page.locator('.narrative a')).toHaveCount(28)
  await page.locator('.named .chips').getByRole('link', { name: /Swapnil Joshi/ }).click()
  await expect(page.getByRole('heading', { name: 'Swapnil Joshi', level: 1 })).toBeVisible()
  await page.goto('/alerts?type=structuring')
  await expect(page.getByText('3 of 6 alerts')).toBeVisible()
  await page.goto('/ingest')
  await expect(page.getByText('The demo records are read only')).toBeVisible()
})
