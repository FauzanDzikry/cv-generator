import { expect, test } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const fixtureData = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), 'tests/e2e/fixtures/cv-pagination-long.json'), 'utf-8'));

const countPdfPages = (buffer: Buffer): number => buffer.toString('latin1').match(/\/Type\s*\/Page\b/g)?.length ?? 0;

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
        expect(Math.abs(measurements.paddingTop - 56.7)).toBeLessThanOrEqual(1.5);
        expect(Math.abs(measurements.paddingRight - 56.7)).toBeLessThanOrEqual(1.5);
        expect(Math.abs(measurements.paddingBottom - 56.7)).toBeLessThanOrEqual(1.5);
        expect(Math.abs(measurements.paddingLeft - 56.7)).toBeLessThanOrEqual(1.5);
    });

    test('Phase 5 Regression: paginates deterministically using semantic measurement blocks without early breaks', async ({ page }) => {
        await page.addInitScript((data) => {
            window.localStorage.setItem('cvFormData', JSON.stringify(data.cvFormData));
            window.localStorage.setItem('cvAddOnSections', JSON.stringify(data.cvAddOnSections));
        }, fixtureData);

        await page.goto('/generate-cv');

        const previewButton = page.getByRole('button', { name: 'Preview CV' }).first();
        await previewButton.click();

        const cvPages = page.locator('.cv-multi-page-container .cv-page');
        await expect(cvPages.first()).toBeVisible();
        await page.waitForTimeout(300);

        const blockCount = await page.locator('.cv-multi-page-container [data-cv-block-key]').count();
        expect(blockCount).toBeGreaterThan(0);

        const pageContents = page.locator('.cv-multi-page-container .cv-page-content');
        const count = await pageContents.count();
        expect(count).toBeGreaterThan(1);

        for (let i = 0; i < count; i++) {
            const el = pageContents.nth(i);
            const measurements = await el.evaluate((node) => ({
                scrollHeight: node.scrollHeight,
                clientHeight: node.clientHeight,
            }));
            expect(measurements.scrollHeight).toBeLessThanOrEqual(measurements.clientHeight + 1);
        }

        for (let i = 0; i < count; i++) {
            const pageEl = pageContents.nth(i);
            const lastBlockKind = await pageEl.evaluate((node) => {
                const blocks = Array.from(node.querySelectorAll('[data-cv-kind]'));
                if (blocks.length === 0) return null;
                return blocks[blocks.length - 1].getAttribute('data-cv-kind');
            });
            expect(lastBlockKind).not.toBe('section-heading');
        }

        for (let i = 0; i < count; i++) {
            const pageEl = pageContents.nth(i);
            const validItemHeadings = await pageEl.evaluate((node) => {
                const blocks = Array.from(node.querySelectorAll('[data-cv-kind]'));
                for (let idx = 0; idx < blocks.length; idx++) {
                    const kind = blocks[idx].getAttribute('data-cv-kind');
                    if (kind === 'item-heading' || kind === 'item-heading-continued') {
                        if (idx === blocks.length - 1) {
                            return false;
                        }
                    }
                }
                return true;
            });
            expect(validItemHeadings).toBe(true);
        }

        const initialKeys = await page.evaluate(() => {
            return Array.from(document.querySelectorAll('.cv-multi-page-container .cv-page-content')).map((page) =>
                Array.from(page.querySelectorAll('[data-cv-block-key]')).map((b) => b.getAttribute('data-cv-block-key')),
            );
        });

        for (let attempt = 1; attempt <= 5; attempt++) {
            await page.evaluate(() => window.dispatchEvent(new Event('resize')));
            await page.waitForTimeout(100);
            const currentKeys = await page.evaluate(() => {
                return Array.from(document.querySelectorAll('.cv-multi-page-container .cv-page-content')).map((page) =>
                    Array.from(page.querySelectorAll('[data-cv-block-key]')).map((b) => b.getAttribute('data-cv-block-key')),
                );
            });
            expect(currentKeys).toEqual(initialKeys);
        }
    });

    test('Phase 6: PDF export produces direct download with identical page count to preview and valid %PDF header', async ({ page }) => {
        await page.addInitScript((data) => {
            window.localStorage.setItem('cvFormData', JSON.stringify(data.cvFormData));
            window.localStorage.setItem('cvAddOnSections', JSON.stringify(data.cvAddOnSections));
        }, fixtureData);

        await page.goto('/generate-cv');

        const previewButton = page.getByRole('button', { name: 'Preview CV' }).first();
        await previewButton.click();

        const previewPages = page.locator('.cv-multi-page-container').first().locator('.cv-page');
        await expect(previewPages.first()).toBeVisible();
        await page.waitForTimeout(300);

        const previewPageCount = await previewPages.count();
        expect(previewPageCount).toBeGreaterThan(1);

        const exportPages = page.locator('#cv-to-export .cv-page');
        const exportPageCount = await exportPages.count();
        expect(exportPageCount).toBe(previewPageCount);

        const exportHeader = page.locator('#cv-to-export .cv-header').first();
        for (const contact of [fixtureData.cvFormData.email, fixtureData.cvFormData.linkedin]) {
            const contactNode = exportHeader.getByText(contact, { exact: true });
            await expect(contactNode).toHaveCSS('overflow', 'visible');
            await expect(contactNode).toHaveCSS('text-overflow', 'clip');

            const staysInsideHeader = await contactNode.evaluate((element) => {
                const item = element.getBoundingClientRect();
                const header = element.closest('.cv-header')?.getBoundingClientRect();
                return Boolean(header && item.left >= header.left - 1 && item.right <= header.right + 1);
            });
            expect(staysInsideHeader).toBe(true);
        }

        const previewControls = page.getByTestId('preview-controls');
        const zoomControls = previewControls.getByTestId('cv-zoom-controls');

        const alignment = await previewControls.evaluate((container) => {
            const zoom = container.querySelector('[data-testid="cv-zoom-controls"]')?.getBoundingClientRect();
            const close = container.querySelector('[aria-label="Close CV preview"]')?.getBoundingClientRect();
            if (!zoom || !close) return null;

            return {
                centerDifference: Math.abs(zoom.top + zoom.height / 2 - (close.top + close.height / 2)),
                horizontalGap: close.left - zoom.right,
            };
        });

        expect(alignment).not.toBeNull();
        expect(alignment?.centerDifference).toBeLessThanOrEqual(1);
        expect(alignment?.horizontalGap).toBeGreaterThanOrEqual(32);

        const zoomSlider = zoomControls.getByRole('slider', { name: 'CV preview zoom' });
        const transformBeforeZoom = await page
            .locator('.cv-multi-page-container')
            .first()
            .evaluate((element) => getComputedStyle(element).transform);
        await zoomSlider.fill('125');
        await expect
            .poll(() =>
                page
                    .locator('.cv-multi-page-container')
                    .first()
                    .evaluate((element) => getComputedStyle(element).transform),
            )
            .not.toBe(transformBeforeZoom);
        await expect(page.locator('#cv-to-export [data-testid="cv-zoom-controls"]')).toHaveCount(0);

        const generateButton = page.locator('button', { hasText: /Generat/i }).first();
        const downloadPromise = page.waitForEvent('download', { timeout: 30000 });

        await generateButton.click();

        const progressDialog = page.getByRole('dialog', { name: 'Generating PDF' });
        await expect(progressDialog).toBeVisible();
        await expect(generateButton).toBeDisabled();

        const progressBar = progressDialog.getByRole('progressbar', {
            name: 'PDF generation progress',
        });
        await expect(progressBar).toBeVisible();

        const progressValue = Number(await progressBar.getAttribute('aria-valuenow'));
        expect(progressValue).toBeGreaterThanOrEqual(5);
        expect(progressValue).toBeLessThanOrEqual(100);

        const download = await downloadPromise;

        await expect(progressBar).toHaveAttribute('aria-valuenow', '100', {
            timeout: 5000,
        });
        await expect(progressDialog).toBeHidden({ timeout: 5000 });
        await expect(generateButton).toBeEnabled();

        expect(download.suggestedFilename()).toMatch(/\.pdf$/i);

        const downloadPath = await download.path();
        expect(downloadPath).not.toBeNull();
        if (downloadPath) {
            const fs = await import('fs');
            const buffer = fs.readFileSync(downloadPath);
            expect(buffer.length).toBeGreaterThan(0);
            const header = buffer.toString('utf8', 0, 4);
            expect(header).toBe('%PDF');
            const downloadedPageCount = countPdfPages(buffer);
            expect(downloadedPageCount).toBe(previewPageCount);
        }
    });

    test('PDF generation failure closes progress dialog and re-enables Generate PDF', async ({ page }) => {
        await page.addInitScript((data) => {
            window.localStorage.setItem('cvFormData', JSON.stringify(data.cvFormData));
            window.localStorage.setItem('cvAddOnSections', JSON.stringify(data.cvAddOnSections));
        }, fixtureData);

        await page.goto('/generate-cv');

        const previewButton = page.getByRole('button', { name: 'Preview CV' }).first();
        await previewButton.click();

        const previewPages = page.locator('.cv-multi-page-container').first().locator('.cv-page');
        await expect(previewPages.first()).toBeVisible();
        await page.waitForTimeout(300);

        await page.evaluate(() => {
            const originalToDataURL = HTMLCanvasElement.prototype.toDataURL;
            const windowWithRestore = window as Window & {
                __restorePdfTestCanvas?: () => void;
            };

            windowWithRestore.__restorePdfTestCanvas = () => {
                HTMLCanvasElement.prototype.toDataURL = originalToDataURL;
            };

            HTMLCanvasElement.prototype.toDataURL = function () {
                throw new Error('Forced PDF export failure');
            };
        });

        let downloadStarted = false;
        page.on('download', () => {
            downloadStarted = true;
        });

        const errorDialogPromise = page.waitForEvent('dialog');
        const generateButton = page.locator('button', { hasText: /Generat/i }).first();

        await generateButton.click();

        const progressDialog = page.getByRole('dialog', { name: 'Generating PDF' });
        await expect(progressDialog).toBeVisible();
        await expect(generateButton).toBeDisabled();

        const errorDialog = await errorDialogPromise;
        expect(errorDialog.message()).toBe('An error occurred while generating the PDF. Please try again.');
        await errorDialog.accept();

        await expect(progressDialog).toBeHidden({ timeout: 5000 });
        await expect(generateButton).toBeEnabled();
        expect(downloadStarted).toBe(false);

        await page.evaluate(() => {
            const windowWithRestore = window as Window & {
                __restorePdfTestCanvas?: () => void;
            };

            windowWithRestore.__restorePdfTestCanvas?.();
        });
    });

    test('Phase 7: Attribution and margin guides render correctly on preview and export pages', async ({ page }) => {
        await page.addInitScript((data) => {
            window.localStorage.setItem('cvFormData', JSON.stringify(data.cvFormData));
            window.localStorage.setItem('cvAddOnSections', JSON.stringify(data.cvAddOnSections));
        }, fixtureData);

        await page.goto('/generate-cv?margin=1');

        const previewButton = page.getByRole('button', { name: 'Preview CV' }).first();
        await previewButton.click();

        const previewPages = page.locator('.cv-multi-page-container').first().locator('.cv-page');
        await expect(previewPages.first()).toBeVisible();
        await page.waitForTimeout(300);

        const previewPageCount = await previewPages.count();
        expect(previewPageCount).toBeGreaterThan(0);

        for (let i = 0; i < previewPageCount; i++) {
            const previewPage = previewPages.nth(i);
            const attribution = previewPage.locator('.cv-attribution');
            await expect(attribution).toHaveText('Generated by cvgenerator.zandev.my.id');

            const pageNumber = previewPage.locator('.cv-page-number');
            await expect(pageNumber).toHaveText(`${i + 1} of ${previewPageCount}`);

            const guides = previewPage.locator('.cv-margin-guide');
            expect(await guides.count()).toBe(4);
        }

        const exportPages = page.locator('#cv-to-export .cv-page');
        const exportPageCount = await exportPages.count();
        expect(exportPageCount).toBe(previewPageCount);

        for (let i = 0; i < exportPageCount; i++) {
            const exportPage = exportPages.nth(i);
            const attribution = exportPage.locator('.cv-attribution');
            expect(await attribution.textContent()).toBe('Generated by cvgenerator.zandev.my.id');

            const pageNumber = exportPage.locator('.cv-page-number');
            expect(await pageNumber.textContent()).toBe(`${i + 1} of ${exportPageCount}`);

            const guides = exportPage.locator('.cv-margin-guide');
            expect(await guides.count()).toBe(0);
        }
    });
});
