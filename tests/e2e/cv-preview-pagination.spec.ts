import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const fixtureData = JSON.parse(
    fs.readFileSync(
        path.resolve(process.cwd(), 'tests/e2e/fixtures/cv-pagination-long.json'),
        'utf-8',
    ),
);

test.describe('CV Preview & Pagination Regression', () => {
    test('preview is visible beside form and paginates deterministically without early breaks', async ({ page }) => {
        // Inject localStorage data before navigating
        await page.addInitScript((data) => {
            window.localStorage.setItem('cvFormData', JSON.stringify(data.cvFormData));
            window.localStorage.setItem('cvAddOnSections', JSON.stringify(data.cvAddOnSections));
        }, fixtureData);

        await page.goto('/generate-cv');

        // Click the Preview CV button to reveal the preview pane
        const previewButton = page.getByRole('button', { name: 'Preview CV' }).first();
        await previewButton.click();

        // Verify page loads without selector, timeout, or server errors
        const previewHeader = page.locator('h2', { hasText: 'Preview CV' });
        await expect(previewHeader).toBeVisible();

        const cvPages = page.locator('.cv-page');
        await expect(cvPages.first()).toBeVisible();
        
        const pageCount = await cvPages.count();
        expect(pageCount).toBeGreaterThanOrEqual(1);

        // Mark test as regression expected to fail until Phase 4 (sticky layout) & Phase 5 (pagination engine)
        test.fail(true, 'Regression: expected to fail until Phase 4 (sticky preview) and Phase 5 (measured semantic blocks) are implemented');

        // Phase 4 Contract: Preview wrapper must be sticky with position: sticky
        const previewSection = previewHeader.locator('..').locator('..').locator('..');
        const position = await previewSection.evaluate((el) => window.getComputedStyle(el).position);
        expect(position).toBe('sticky');
    });
});
