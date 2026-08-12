import { expect, test } from '@playwright/test';

test.describe('Skills form adaptive layout', () => {
    test('short skills share two columns and a long skill spans the full row', async ({ page }) => {
        await page.goto('/generate-cv');

        const skills = page.locator('[data-section-key="skills"]');
        await skills.getByPlaceholder('eg: JavaScript').fill('Go');
        await skills.getByRole('button', { name: 'Add Skill' }).click();
        await skills.getByPlaceholder('eg: JavaScript').nth(1).fill('JavaScript');
        await skills.getByRole('button', { name: 'Add Skill' }).click();
        await skills.getByPlaceholder('eg: JavaScript').nth(2).fill('Distributed systems architecture and cloud platform engineering');

        const grid = skills.getByTestId('skills-grid');
        const columns = await grid.evaluate((element) => getComputedStyle(element).gridTemplateColumns.split(' ').length);
        expect(columns).toBe(2);

        await expect(skills.locator('[data-skill-layout="half"]')).toHaveCount(2);
        await expect(skills.locator('[data-skill-layout="full"]')).toHaveCount(1);
    });

    test('layout reacts when a skill crosses the long-text threshold', async ({ page }) => {
        await page.goto('/generate-cv');
        const input = page.getByPlaceholder('eg: JavaScript').first();
        const row = page.locator('[data-section-key="skills"] [data-skill-layout]').first();

        await input.fill('TypeScript');
        await expect(row).toHaveAttribute('data-skill-layout', 'half');

        await input.fill('TypeScript, Node.js, PostgreSQL, Kubernetes, and Terraform');
        await expect(row).toHaveAttribute('data-skill-layout', 'full');
    });

    test('mobile keeps every skill in one column', async ({ page }) => {
        await page.setViewportSize({ width: 390, height: 844 });
        await page.goto('/generate-cv');
        const grid = page.getByTestId('skills-grid');
        const columns = await grid.evaluate((element) => getComputedStyle(element).gridTemplateColumns.split(' ').length);
        expect(columns).toBe(1);
    });
});
