import { test, expect } from '@playwright/test';

test('a new user can sign up, add an expense, and see it appear in the list', async ({ page }) => {
  const email = `e2e-${Date.now()}@example.com`;

  // ---- Sign up ----
  await page.goto('/signup');
  await page.getByLabel('Name').fill('E2E Tester');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password', { exact: true }).fill('password123');
  await page.getByLabel('Confirm password').fill('password123');
  await page.getByRole('button', { name: 'Sign up' }).click();

  // A successful signup redirects straight into the protected dashboard.
  await expect(page).toHaveURL(/\/expenses$/);
  await expect(page.getByText(`Signed in as E2E Tester`)).toBeVisible();

  // ---- Create an expense ----
  await page.getByPlaceholder('e.g. Grocery run').fill('E2E Coffee Run');
  await page.locator('#amount').fill('4.50');
  await page.getByRole('button', { name: 'Add expense' }).click();

  // ---- See it appear, with no manual refresh ----
  const newRow = page.getByRole('listitem').filter({ hasText: 'E2E Coffee Run' });
  await expect(newRow).toBeVisible();
  await expect(newRow.getByText('$4.50')).toBeVisible();
});

test('an unauthenticated visitor is redirected away from the protected dashboard', async ({ page }) => {
  await page.goto('/expenses');
  await expect(page).toHaveURL(/\/login$/);
});
