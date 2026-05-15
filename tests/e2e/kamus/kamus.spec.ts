import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import os from 'os';

// Runs in "chromium" project (authenticated admin via storageState)

const HEADER = 'code,name,type,description,behavioralIndicators';

function tmpCsv(rows: string[]): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kamus-'));
  const file = path.join(dir, `kamus-${Date.now()}-${Math.random().toString(36).slice(2)}.csv`);
  fs.writeFileSync(file, [HEADER, ...rows].join('\n') + '\n', 'utf8');
  return file;
}

test.describe('Kamus Management', () => {
  test('Admin can view submitted Kamus list with filter and search', async ({ page }) => {
    const title = test.info().title;
    console.log(`[Test: ${title}] Navigating to /admin/kamus...`);
    const response = await page.goto('/admin/kamus');
    console.log(`[Test: ${title}] Status: ${response?.status()} | URL: ${page.url()}`);

    await expect(page).toHaveURL(/\/admin\/kamus/);
    await expect(page.getByTestId('kamus-page-nav')).toBeVisible();
    await expect(page.getByTestId('kamus-list-container')).toBeVisible();

    // Wait for at least one seed item
    const seedItem = page.getByTestId('kamus-item-SEED-POT-001');
    await expect(seedItem).toBeVisible({ timeout: 10000 });

    // Filter by kompetensi — the potensi seed item should disappear
    await page.getByTestId('kamus-filter-kompetensi').click();
    await expect(page.getByTestId('kamus-item-SEED-KOM-001')).toBeVisible();
    await expect(page.getByTestId('kamus-item-SEED-POT-001')).toHaveCount(0);

    // Reset filter and search by code
    await page.getByTestId('kamus-filter-all').click();
    await page.getByTestId('kamus-search-input').fill('SEED-POT-001');
    await expect(page.getByTestId('kamus-item-SEED-POT-001')).toBeVisible();
    await expect(page.getByTestId('kamus-item-SEED-KOM-001')).toHaveCount(0);
  });

  test('Admin uploads valid Kamus template and Kamus Submitted event fires', async ({ page }) => {
    const title = test.info().title;
    const uniqueCode = `E2E-POT-${Date.now()}`;
    const file = tmpCsv([
      `${uniqueCode},E2E Potensi,potensi,Generated for test,Indicator A|Indicator B`,
    ]);
    console.log(`[Test: ${title}] CSV file: ${file}`);

    await page.goto('/admin/kamus/upload');
    await expect(page.getByTestId('kamus-upload-form')).toBeVisible();

    await page.getByTestId('kamus-file-input').setInputFiles(file);
    await page.getByTestId('submit-kamus-btn').click();

    const alert = page.getByTestId('kamus-created-alert');
    await expect(alert).toBeVisible({ timeout: 15000 });
    await expect(alert).toContainText('Kamus Submitted');

    // Confirm new item appears in list
    await page.goto('/admin/kamus');
    await expect(page.getByTestId(`kamus-item-${uniqueCode}`)).toBeVisible({ timeout: 10000 });
  });

  test('Admin sees specific error rows when uploading invalid template', async ({ page }) => {
    const title = test.info().title;
    const file = tmpCsv([
      'BAD-1,,potensi,No name,Indicator A',
      'BAD-2,Has Name,invalidtype,Bad type,Indicator B',
    ]);
    console.log(`[Test: ${title}] Bad CSV file: ${file}`);

    await page.goto('/admin/kamus/upload');
    await page.getByTestId('kamus-file-input').setInputFiles(file);
    await page.getByTestId('submit-kamus-btn').click();

    await expect(page.getByTestId('kamus-error-alert')).toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId('kamus-error-list')).toBeVisible();
    await expect(page.getByTestId('kamus-error-row-2')).toContainText('name');
    await expect(page.getByTestId('kamus-error-row-3')).toContainText('Invalid type');
  });

  test('Admin previews changes when uploading updated template', async ({ page }) => {
    const title = test.info().title;
    // Updated template: change SEED-POT-001 name and add a new item; omit SEED-KOM-001
    const newCode = `E2E-PRV-${Date.now()}`;
    const file = tmpCsv([
      'SEED-POT-001,Analytical Thinking Updated,potensi,Updated description,Indicator A|Indicator B',
      `${newCode},Preview New,kompetensi,New item via preview,Ind 1|Ind 2`,
    ]);
    console.log(`[Test: ${title}] Preview CSV file: ${file}`);

    await page.goto('/admin/kamus/update');
    await page.getByTestId('kamus-file-input').setInputFiles(file);
    await page.getByTestId('submit-kamus-btn').click();

    await expect(page.getByTestId('kamus-preview-container')).toBeVisible({ timeout: 15000 });
    await expect(page.getByTestId('kamus-preview-summary')).toContainText('Changed: 1');
    await expect(page.getByTestId('kamus-preview-summary')).toContainText('New: 1');
  });

  test('Cannot delete a Kamus item used by Standar Jabatan', async ({ page }) => {
    await page.goto('/admin/kamus');
    await expect(page.getByTestId('kamus-item-SEED-KOM-001')).toBeVisible({ timeout: 10000 });

    await page.getByTestId('kamus-delete-btn-SEED-KOM-001').click();
    const errAlert = page.getByTestId('kamus-delete-error-alert');
    await expect(errAlert).toBeVisible({ timeout: 10000 });
    await expect(errAlert).toContainText('Standar Jabatan');
    // Item is still in the list
    await expect(page.getByTestId('kamus-item-SEED-KOM-001')).toBeVisible();
  });

  test('Admin can download empty Kamus template', async ({ page }) => {
    await page.goto('/admin/kamus/upload');

    const downloadPromise = page.waitForEvent('download');
    await page.getByTestId('download-template-btn').click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toMatch(/kamus-template\.csv$/);
    const stream = await download.createReadStream();
    expect(stream).not.toBeNull();
  });

  test('Progress indicator appears during upload', async ({ page }) => {
    const rows: string[] = [];
    for (let i = 0; i < 50; i++) {
      rows.push(
        `E2E-LRG-${Date.now()}-${i},Large Item ${i},potensi,Bulk description ${i},Ind1|Ind2`
      );
    }
    const file = tmpCsv(rows);

    await page.goto('/admin/kamus/upload');
    await page.getByTestId('kamus-file-input').setInputFiles(file);

    // Start the click but do not await it — assert progress is visible while in-flight
    const clickPromise = page.getByTestId('submit-kamus-btn').click();
    await expect(page.getByTestId('kamus-upload-progress')).toBeVisible({ timeout: 5000 });
    await clickPromise;

    await expect(page.getByTestId('kamus-created-alert')).toBeVisible({ timeout: 30000 });
  });
});
