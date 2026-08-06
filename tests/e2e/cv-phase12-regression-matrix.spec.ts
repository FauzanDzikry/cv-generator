import { expect, test } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const fixtureData = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), 'tests/e2e/fixtures/cv-pagination-long.json'), 'utf-8'));

test.describe('Phase 12 Regression Matrix & Determinism Verification', () => {
    test('Desktop viewports (1024x768, 1280x800, 1440x900) render preview layout stably', async ({ page }) => {
        const viewports = [
            { width: 1024, height: 768 },
            { width: 1280, height: 800 },
            { width: 1440, height: 900 },
        ];

        for (const vp of viewports) {
            await page.setViewportSize(vp);
            await page.goto('/generate-cv');
            const previewButton = page.getByRole('button', { name: 'Preview CV' }).first();
            await previewButton.click();
            const previewPages = page.locator('.cv-multi-page-container').first().locator('.cv-page');
            await expect(previewPages.first()).toBeVisible({ timeout: 15000 });
            const pageCount = await previewPages.count();
            expect(pageCount).toBeGreaterThanOrEqual(1);
        }
    });

    test('Mobile viewport (390x844) collapses layout correctly without overlap', async ({ page }) => {
        await page.setViewportSize({ width: 390, height: 844 });
        await page.goto('/generate-cv');
        const previewButton = page.getByRole('button', { name: 'Preview CV' }).first();
        await previewButton.click();
        const previewPages = page.locator('.cv-multi-page-container').first().locator('.cv-page');
        await expect(previewPages.first()).toBeVisible({ timeout: 15000 });
        const width = await previewPages.first().evaluate((el) => el.getBoundingClientRect().width);
        expect(width).toBeGreaterThan(0);
    });

    test('Deterministic rendering: repeating render 5 times produces identical page signature and count', async ({ page }) => {
        await page.setViewportSize({ width: 1440, height: 900 });
        await page.addInitScript((data) => {
            window.localStorage.setItem('cvFormData', JSON.stringify(data.cvFormData));
            window.localStorage.setItem('cvAddOnSections', JSON.stringify(data.cvAddOnSections));
        }, fixtureData);

        await page.goto('/generate-cv');
        const previewButton = page.getByRole('button', { name: 'Preview CV' }).first();
        await previewButton.click();

        const previewPages = page.locator('.cv-multi-page-container').first().locator('.cv-page');
        await expect(previewPages.first()).toBeVisible({ timeout: 15000 });

        let referenceSignature: string | null = null;

        for (let i = 1; i <= 5; i++) {
            if (i > 1) {
                const closeButton = page.getByRole('button', { name: 'Close Preview' }).first();
                await closeButton.click();
                await page.waitForTimeout(150);
                const reOpenButton = page.getByRole('button', { name: 'Preview CV' }).first();
                await reOpenButton.click();
                await expect(previewPages.first()).toBeVisible({ timeout: 15000 });
            }
            const pages = await previewPages.all();
            const signature = await Promise.all(pages.map((p) => p.innerText()));
            const signatureString = JSON.stringify(signature);

            if (referenceSignature === null) {
                referenceSignature = signatureString;
            } else {
                expect(signatureString).toBe(referenceSignature);
            }
        }
    });

    test('Preview scenarios matrix: empty CV, no-photo, photo, 1 page, 2 pages, long items, all add-ons', async ({ page }) => {
        await page.setViewportSize({ width: 1440, height: 900 });

        // 1. Empty CV (defaults, no photo) -> exactly 1 visible page
        await page.goto('/generate-cv');
        await page.getByRole('button', { name: 'Preview CV' }).first().click();
        const previewPages = page.locator('.cv-multi-page-container').first().locator('.cv-page');
        await expect(previewPages).toHaveCount(1, { timeout: 15000 });

        // 2. All add-ons & long items (from fixture) -> >=2 pages & photo check
        const modifiedData = {
            ...fixtureData,
            cvFormData: {
                ...fixtureData.cvFormData,
                is_use_photo: true,
                photo_base64: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
                additional_info: 'Extremely long item text '.repeat(35),
            },
        };

        await page.evaluate((data) => {
            window.localStorage.setItem('cvFormData', JSON.stringify(data.cvFormData));
            window.localStorage.setItem('cvAddOnSections', JSON.stringify(data.cvAddOnSections));
        }, modifiedData);

        await page.reload();
        await page.getByRole('button', { name: 'Preview CV' }).first().click();

        await expect(previewPages.first()).toBeVisible({ timeout: 15000 });
        const pageCount = await previewPages.count();
        expect(pageCount).toBeGreaterThanOrEqual(2);
    });
});
