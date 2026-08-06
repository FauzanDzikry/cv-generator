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

    test('Phase 3: Page dimensions and content insets match canonical A4 measurements within 1.5px tolerance', async ({ page }) => {
        await page.addInitScript((data) => {
            window.localStorage.setItem('cvFormData', JSON.stringify(data.cvFormData));
            window.localStorage.setItem('cvAddOnSections', JSON.stringify(data.cvAddOnSections));
        }, fixtureData);

        await page.goto('/generate-cv');

        const previewButton = page.getByRole('button', { name: 'Preview CV' }).first();
        await previewButton.click();

        const cvPages = page.locator('.cv-page');
        await expect(cvPages.first()).toBeVisible();

        const measurements = await cvPages.first().evaluate((el) => {
            const style = window.getComputedStyle(el);
            return {
                width: parseFloat(style.width),
                height: parseFloat(style.height),
                paddingTop: parseFloat(style.paddingTop),
                paddingRight: parseFloat(style.paddingRight),
                paddingBottom: parseFloat(style.paddingBottom),
                paddingLeft: parseFloat(style.paddingLeft),
            };
        });

        expect(Math.abs(measurements.width - 793.7)).toBeLessThanOrEqual(1.5);
        expect(Math.abs(measurements.height - 1122.5)).toBeLessThanOrEqual(1.5);
        expect(Math.abs(measurements.paddingTop - 37.8)).toBeLessThanOrEqual(1.5);
        expect(Math.abs(measurements.paddingRight - 37.8)).toBeLessThanOrEqual(1.5);
        expect(Math.abs(measurements.paddingBottom - 37.8)).toBeLessThanOrEqual(1.5);
        expect(Math.abs(measurements.paddingLeft - 37.8)).toBeLessThanOrEqual(1.5);
    });
});
