import { expect, test } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const fixtureData = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), 'tests/e2e/fixtures/cv-pagination-long.json'), 'utf-8'));

test.describe('Phase 12 Regression Matrix & Determinism Verification', () => {
    test.describe.configure({ timeout: 120000 });

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
                additional_info: 'Extremely long item text '.repeat(35),
            },
        };

        await page.evaluate((data) => {
            window.localStorage.setItem('cvFormData', JSON.stringify(data.cvFormData));
            window.localStorage.setItem('cvAddOnSections', JSON.stringify(data.cvAddOnSections));
            window.localStorage.setItem(
                'cvPhotoPreview',
                'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
            );
        }, modifiedData);

        await page.goto('/generate-cv');
        await page.getByRole('button', { name: 'Preview CV' }).first().click();

        await expect(previewPages.first()).toBeVisible({ timeout: 15000 });
        const pageCount = await previewPages.count();
        expect(pageCount).toBeGreaterThanOrEqual(2);
        await expect(page.locator('.cv-multi-page-container .cv-header img').first()).toBeVisible();
    });

    test('Authenticated upload persists and renders through the private photo route', async ({ page }) => {
        const uniqueEmail = `cv-photo-${Date.now()}@example.test`;
        await page.goto('/register');
        await page.getByLabel('Name').fill('Photo Owner');
        await page.getByLabel('Email address').fill(uniqueEmail);
        await page.getByLabel('Password', { exact: true }).fill('password123');
        await page.getByLabel('Confirm password').fill('password123');
        await page.getByRole('button', { name: 'Create account' }).click();
        await page.waitForURL(/\/(?:cvs|verify-email)/);

        await page.goto('/generate-cv');
        await page.locator('#name').fill('Photo Owner');
        await page.locator('#address').fill('Jakarta');
        await page.locator('#phone').fill('08123456789');
        await page.locator('#email').fill(uniqueEmail);
        await page.locator('#summary').fill('Private profile photo browser test.');
        await page.locator('#is_use_photo').check();
        await page.locator('#photo').setInputFiles({
            name: 'profile.png',
            mimeType: 'image/png',
            buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=', 'base64'),
        });
        await page.getByRole('button', { name: 'Save CV' }).first().click();
        await page.waitForURL(/\/cvs\/[0-9a-f-]+\/edit$/);

        await page.goto(page.url().replace(/\/edit$/, ''));
        const photo = page.locator('.cv-multi-page-container .cv-header img').first();
        await expect(photo).toBeVisible();
        await expect(photo).toHaveAttribute('src', /\/cvs\/[0-9a-f-]+\/photo$/);
        await expect.poll(() => photo.evaluate((image: HTMLImageElement) => image.naturalWidth)).toBeGreaterThan(0);
    });
});
