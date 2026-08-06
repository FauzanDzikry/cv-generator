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
    test('Phase 4 (Desktop): preview is sticky beside form on scroll at 1440x900', async ({ page }) => {
        await page.setViewportSize({ width: 1440, height: 900 });
        await page.addInitScript((data) => {
            window.localStorage.setItem('cvFormData', JSON.stringify(data.cvFormData));
            window.localStorage.setItem('cvAddOnSections', JSON.stringify(data.cvAddOnSections));
        }, fixtureData);

        await page.goto('/generate-cv');

        const previewButton = page.getByRole('button', { name: 'Preview CV' }).first();
        await previewButton.click();

        const previewHeader = page.locator('h2', { hasText: 'Preview CV' });
        await expect(previewHeader).toBeVisible();

        const previewSection = previewHeader.locator('..').locator('..').locator('..');
        const position = await previewSection.evaluate((el) => window.getComputedStyle(el).position);
        expect(position).toBe('sticky');

        // Scroll form down towards the bottom
        await page.evaluate(() => window.scrollTo(0, 350));
        await page.waitForTimeout(500);

        // Verify bounding top stays around 80px (top-20 is 80px) and bottom does not exceed viewport (900px)
        const rect = await previewSection.evaluate((el) => {
            const r = el.getBoundingClientRect();
            return { top: r.top, bottom: r.bottom };
        });
        expect(Math.abs(rect.top - 80)).toBeLessThanOrEqual(5);
        expect(rect.bottom).toBeLessThanOrEqual(905);
    });

    test('Phase 4 (Mobile): preview collapses to static position at 390x844', async ({ page }) => {
        await page.setViewportSize({ width: 390, height: 844 });
        await page.addInitScript((data) => {
            window.localStorage.setItem('cvFormData', JSON.stringify(data.cvFormData));
            window.localStorage.setItem('cvAddOnSections', JSON.stringify(data.cvAddOnSections));
        }, fixtureData);

        await page.goto('/generate-cv');

        const previewButton = page.getByRole('button', { name: 'Preview CV' }).first();
        await previewButton.click();

        const previewHeader = page.locator('h2', { hasText: 'Preview CV' });
        await expect(previewHeader).toBeVisible();

        const previewSection = previewHeader.locator('..').locator('..').locator('..');
        const position = await previewSection.evaluate((el) => window.getComputedStyle(el).position);
        expect(position).toBe('static');
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

    test('Phase 5 Regression: paginates deterministically using semantic measurement blocks without early breaks', async ({ page }) => {
        await page.addInitScript((data) => {
            window.localStorage.setItem('cvFormData', JSON.stringify(data.cvFormData));
            window.localStorage.setItem('cvAddOnSections', JSON.stringify(data.cvAddOnSections));
        }, fixtureData);

        await page.goto('/generate-cv');

        const previewButton = page.getByRole('button', { name: 'Preview CV' }).first();
        await previewButton.click();

        const cvPages = page.locator('.cv-page');
        await expect(cvPages.first()).toBeVisible();

        // Mark test as regression expected to fail until Phase 5 (measured semantic blocks) is implemented
        test.fail(true, 'Regression: expected to fail until Phase 5 (measured semantic blocks) is implemented');

        // Phase 5 Contract: Semantic blocks with data-cv-block-key must be present
        const blockCount = await page.locator('[data-cv-block-key]').count();
        expect(blockCount).toBeGreaterThan(0);
    });
});
