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
    test('authenticated save keeps repeated rows grouped and certification months intact', async ({ page }) => {
        test.setTimeout(60000);

        const invalidInputWarnings: string[] = [];
        page.on('console', (message) => {
            if (message.text().includes('should not be null') || message.text().includes('does not conform to the required format')) {
                invalidInputWarnings.push(message.text());
            }
        });

        const timestamp = Date.now();
        await page.goto('/register');
        await page.getByLabel('Name').fill('Language Save Test');
        await page.getByLabel('Email address').fill(`language-save-${timestamp}@example.test`);
        await page.getByLabel('Password', { exact: true }).fill('password123');
        await page.getByLabel('Confirm password').fill('password123');
        await page.getByRole('button', { name: 'Create account' }).click();
        await page.waitForURL(/\/(?:cvs|verify-email)/);

        await page.evaluate(
            ({ data, email, addOns }) => {
                window.localStorage.setItem(
                    'cvFormData',
                    JSON.stringify({
                        ...data,
                        email,
                        work_experience: data.work_experience.map((experience: Record<string, unknown>) => ({
                            ...experience,
                            end_date: null,
                            is_current: true,
                        })),
                        certifications: data.certifications.map((certification: Record<string, unknown>) => ({
                            ...certification,
                            start_year: '2025-03',
                            end_year: '2028-03',
                        })),
                        languages: [
                            {
                                language: 'English',
                                level: '',
                                has_certification: true,
                                test_name: 'TOEIC Listening & Reading',
                                issuing_organization: 'ETS',
                                score: '865 / 990',
                                issue_date: '2024-10',
                                expiration_date: '2026-10',
                                is_time_limited: true,
                            },
                            {
                                language: 'Japanese',
                                level: '',
                                has_certification: false,
                                test_name: '',
                                issuing_organization: '',
                                score: '',
                                issue_date: '',
                                expiration_date: '',
                                is_time_limited: false,
                            },
                        ],
                    }),
                );
                window.localStorage.setItem('cvAddOnSections', JSON.stringify(addOns));
            },
            {
                data: fixture.cvFormData,
                email: `language-save-${timestamp}@example.test`,
                addOns: {
                    portfolios: false,
                    certifications: true,
                    accomplishments: false,
                    organizations: true,
                    languages: true,
                    additional_info: false,
                },
            },
        );
        await page.goto('/generate-cv');
        await expect(page.getByRole('heading', { name: 'Language #2' })).toBeVisible();
        await expect(page.locator('input[name="start_date"]').nth(0)).toHaveValue('2020-01');
        await expect(page.locator('input[name="end_date"]').nth(0)).toHaveValue('');
        await expect(page.locator('input[name="start_date"]').nth(1)).toHaveValue('2015-08');
        await expect(page.locator('input[name="start_date"]').nth(2)).toHaveValue('2021-03');
        const [saveResponse] = await Promise.all([
            page.waitForResponse((response) => response.url().endsWith('/cvs') && response.request().method() === 'POST'),
            page.getByRole('button', { name: 'Save CV' }).first().click(),
        ]);

        expect(saveResponse.status()).toBe(201);
        await expect(page.getByText('CV saved to your account.')).toBeVisible({ timeout: 15000 });
        await page.waitForURL(/\/cvs\/[0-9a-f-]+$/);
        const showUrl = page.url();
        expect(showUrl).not.toContain('/edit');

        const generatePdfButton = page.getByRole('button', { name: 'Generate PDF' });
        await expect(generatePdfButton).toBeVisible({ timeout: 5000 });
        const [download] = await Promise.all([page.waitForEvent('download', { timeout: 30000 }), generatePdfButton.click()]);
        const downloadedPath = await download.path();
        expect(downloadedPath).not.toBeNull();
        expect(
            fs
                .readFileSync(downloadedPath as string)
                .subarray(0, 4)
                .toString(),
        ).toBe('%PDF');
        expect(download.suggestedFilename()).toMatch(/\.pdf$/);
        expect(page.url()).toBe(showUrl);

        await page.goto(`${showUrl}/edit`);
        await expect(page.locator('input[name="start_date"]').nth(0)).toHaveValue('2020-01');
        await expect(page.locator('input[name="end_date"]').nth(0)).toHaveValue('');
        await expect(page.locator('input[name="start_date"]').nth(1)).toHaveValue('2015-08');
        await expect(page.locator('input[name="start_date"]').nth(2)).toHaveValue('2021-03');
        await expect(page.locator('input[name="start_year"]').first()).toHaveValue('2025-03');
        await expect(page.locator('input[name="end_year"]').first()).toHaveValue('2028-03');
        expect(invalidInputWarnings).toEqual([]);
    });

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
