import { test, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

test.describe('Neural Image Compression App', () => {
  test('homepage loads and shows title', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('text=Neural Image')).toBeVisible();
  });

  test('upload zone is shown on landing', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('text=/drop your image/i')).toBeVisible();
  });

  test('pipeline stages are listed in info tags', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('text=CompressAI Model')).toBeVisible();
    await expect(page.locator('text=Real-time WebSocket')).toBeVisible();
    await expect(page.locator('text=PSNR + SSIM Metrics')).toBeVisible();
  });

  test('quality slider is present', async ({ page }) => {
    await page.goto('/');
    const slider = page.locator('input[type="range"]').first();
    await expect(slider).toBeVisible();
    await expect(slider).toHaveAttribute('min', '1');
    await expect(slider).toHaveAttribute('max', '8');
  });

  test('compress button is disabled without file', async ({ page }) => {
    await page.goto('/');
    const btn = page.locator('button:has-text("Compress")');
    await expect(btn).toBeDisabled();
  });

  test('can select a file via file input', async ({ page }) => {
    await page.goto('/');

    // Create a simple 1x1 red PNG in memory to upload
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'test.png',
      mimeType: 'image/png',
      // Minimal valid 1x1 red PNG bytes
      buffer: Buffer.from([
        0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
        0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
        0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
        0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53,
        0xde, 0x00, 0x00, 0x00, 0x0c, 0x49, 0x44, 0x41,
        0x54, 0x08, 0xd7, 0x63, 0xf8, 0xcf, 0xc0, 0x00,
        0x00, 0x00, 0x02, 0x00, 0x01, 0xe2, 0x21, 0xbc,
        0x33, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e,
        0x44, 0xae, 0x42, 0x60, 0x82,
      ]),
    });

    // File name should appear
    await expect(page.locator('text=test.png')).toBeVisible();

    // Compress button should now be enabled
    const btn = page.locator('button:has-text("Compress")');
    await expect(btn).toBeEnabled();
  });
});
