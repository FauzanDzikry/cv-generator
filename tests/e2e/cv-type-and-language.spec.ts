import { expect, test } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const fixture = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), 'tests/e2e/fixtures/cv-pagination-long.json'), 'utf-8'));

const sectionOrder = async (page: import('@playwright/test').Page) =>
    page.locator('form [data-section-key]').evaluateAll((elements) => elements.map((element) => element.getAttribute('data-section-key')));

const addOnLabels = async (page: import('@playwright/test').Page) =>
    page
        .locator('form [data-section-key="add_ons"] label')
        .allTextContents()
        .then((labels) => labels.map((label) => label.trim()));

test.describe('CV type sections and Languages', () => {
    test('Professional orders the form and add-ons using its preset', async ({ page }) => {
        await page.goto('/generate-cv');

        await expect(page.getByRole('radio', { name: /Professional —/ })).toBeChecked();
        expect(await sectionOrder(page)).toEqual(['add_ons', 'personal', 'summary', 'work_experience', 'skills', 'education']);
        expect(await addOnLabels(page)).toEqual(['Portfolio', 'Licenses & Certifications', 'Organizations', 'Languages', 'Additional Information']);
    });

    test('Fresh Graduate orders the form and add-ons using its preset', async ({ page }) => {
        await page.goto('/generate-cv');
        await page.getByRole('radio', { name: /Fresh Graduate/ }).click();

        expect(await sectionOrder(page)).toEqual(['add_ons', 'personal', 'summary', 'education', 'skills']);
        expect(await addOnLabels(page)).toEqual([
            'Organizations',
            'Portfolio',
            'Accomplishments',
            'Licenses & Certifications',
            'Languages',
            'Additional Information',
        ]);
    });

    test('switching type confirms before hiding filled experience and restores it when switching back', async ({ page }) => {
        await page.goto('/generate-cv');
        await page.getByLabel('Company Name').first().fill('Example Corp');

        await page.getByRole('radio', { name: /Fresh Graduate/ }).click();
        await expect(page.getByRole('heading', { name: 'Change CV Type?' })).toBeVisible();
        await page.getByRole('button', { name: 'Cancel' }).click();
        await expect(page.getByRole('radio', { name: /Professional —/ })).toBeChecked();

        await page.getByRole('radio', { name: /Fresh Graduate/ }).click();
        await page.getByRole('button', { name: 'Change Type' }).click();
        await expect(page.getByText('Professional Experience', { exact: true })).toHaveCount(0);

        await page.getByRole('radio', { name: /Professional —/ }).check();
        await expect(page.getByLabel('Company Name').first()).toHaveValue('Example Corp');
    });

    test('disabling and re-enabling an add-on retains its form data', async ({ page }) => {
        await page.goto('/generate-cv');
        await page.getByLabel('Portfolio', { exact: true }).check();
        await page.getByPlaceholder('eg: E-commerce app').fill('Portfolio That Must Survive');

        await page.getByLabel('Portfolio', { exact: true }).uncheck();
        await expect(page.getByPlaceholder('eg: E-commerce app')).toHaveCount(0);

        await page.getByLabel('Portfolio', { exact: true }).check();
        await expect(page.getByPlaceholder('eg: E-commerce app')).toHaveValue('Portfolio That Must Survive');
    });

    test('Languages supports name-only and certified entries with certificate-style expiration', async ({ page }) => {
        await page.goto('/generate-cv');
        await page.getByLabel('Languages', { exact: true }).check();

        await page.getByPlaceholder('eg: English').fill('English');
        await expect(page.getByLabel('I have a test result or certification for this language')).not.toBeChecked();
        await expect(page.getByLabel('Test or Certification Name')).toHaveCount(0);

        await page.getByRole('button', { name: 'Preview CV' }).first().click();
        const preview = page.locator('.cv-multi-page-container').first();
        await expect(preview.getByText('English', { exact: true })).toBeVisible();
        await expect(preview).not.toContainText('English —');
        await page.getByRole('button', { name: 'Close Preview' }).first().click();

        await page.getByLabel('I have a test result or certification for this language').check();
        await expect(page.getByLabel('Test or Certification Name')).toBeVisible();
        await expect(page.getByLabel('Expiration Date', { exact: true }).last()).toBeDisabled();

        await page.getByLabel('Test or Certification Name').fill('IELTS');
        await page.getByLabel('Issuing Organization').last().fill('British Council');
        await page.getByLabel('Score').fill('8.0');
        await page.getByLabel('Issue Date').last().fill('2026-01');
        await page.getByRole('button', { name: 'Preview CV' }).first().click();
        await expect(preview).toContainText('English — IELTS');
        const languageAndTest = preview.getByText('English — IELTS', { exact: true });
        expect(Number(await languageAndTest.evaluate((element) => getComputedStyle(element).fontWeight))).toBeGreaterThanOrEqual(700);

        await expect(preview).toContainText('British Council · Score: 8.0');
        const languageMetadata = preview.getByText('British Council · Score: 8.0', { exact: true });
        expect(Number(await languageMetadata.evaluate((element) => getComputedStyle(element).fontWeight))).toBeLessThan(600);

        await expect(preview).toContainText('No Expiration Date');
        await page.getByRole('button', { name: 'Close Preview' }).first().click();

        await page.getByLabel('This test or certification has an expiration date').check();
        await expect(page.getByLabel('Expiration Date', { exact: true }).last()).toBeEnabled();
    });

    test('preview headings follow the selected CV type and enabled add-ons', async ({ browser }) => {
        const enabledSections = {
            portfolios: true,
            certifications: true,
            accomplishments: true,
            organizations: true,
            languages: true,
            additional_info: true,
        };

        for (const [cvType, expected] of [
            [
                'professional',
                [
                    'Summary',
                    'Professional Experience',
                    'Portfolio',
                    'Skills',
                    'Licenses & Certifications',
                    'Education',
                    'Organizations',
                    'Languages',
                    'Additional Information',
                ],
            ],
            [
                'fresh_graduate',
                [
                    'Summary',
                    'Education',
                    'Organizations',
                    'Portfolio',
                    'Accomplishments',
                    'Skills',
                    'Licenses & Certifications',
                    'Languages',
                    'Additional Information',
                ],
            ],
        ] as const) {
            const context = await browser.newContext();
            const page = await context.newPage();
            await page.addInitScript(
                ({ data, type, addOns }) => {
                    window.localStorage.setItem('cvFormData', JSON.stringify({ ...data, cv_type: type }));
                    window.localStorage.setItem('cvAddOnSections', JSON.stringify(addOns));
                },
                { data: fixture.cvFormData, type: cvType, addOns: enabledSections },
            );
            await page.goto('http://127.0.0.1:8001/generate-cv');
            await page.getByRole('button', { name: 'Preview CV' }).first().click();
            await expect(page.locator('.cv-multi-page-container').first().locator('.cv-page').first()).toBeVisible();
            const previewHeadings = page.locator('.cv-multi-page-container').first().locator('.cv-page h2');
            await expect(previewHeadings.first()).toBeVisible({ timeout: 15000 });
            const headings = await previewHeadings.allTextContents();
            expect(headings.map((heading) => heading.trim())).toEqual(expected);
            await expect(page.locator('.cv-multi-page-container').first()).toContainText('Native / Bilingual');
            await context.close();
        }
    });

    test('certification organization and credential ID use normal weight', async ({ page }) => {
        await page.addInitScript(
            ({ data, addOns }) => {
                window.localStorage.setItem('cvFormData', JSON.stringify(data));
                window.localStorage.setItem('cvAddOnSections', JSON.stringify(addOns));
            },
            {
                data: fixture.cvFormData,
                addOns: { ...fixture.cvAddOnSections, certifications: true },
            },
        );
        await page.goto('/generate-cv');
        await page.getByRole('button', { name: 'Preview CV' }).first().click();

        const preview = page.locator('.cv-multi-page-container').first();
        const title = preview.getByText('Certified Senior Solution Architect', { exact: true }).first();
        const metadata = preview.getByText('Cloud Native Architecture Academy (ID: CERT-8899-ARCH-2023)', { exact: true }).first();

        expect(Number(await title.evaluate((element) => getComputedStyle(element).fontWeight))).toBeGreaterThanOrEqual(600);
        expect(Number(await metadata.evaluate((element) => getComputedStyle(element).fontWeight))).toBeLessThan(600);
    });
});
