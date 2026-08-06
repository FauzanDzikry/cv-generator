import { test, expect } from '@playwright/test';

test.describe('Phase 11: UUID Migration and Hard Delete Flow', () => {
    test('authenticated user can create, view, edit, and delete CV with string UUID in URL', async ({ page }) => {
        // 1. Register a new user account to authenticate
        await page.goto('/register');
        const timestamp = Date.now();
        await page.fill('#name', 'UUID Test User');
        await page.fill('#email', `uuid_tester_${timestamp}@example.com`);
        await page.fill('#password', 'SuperSecretPassword123!');
        await page.fill('#password_confirmation', 'SuperSecretPassword123!');
        await page.getByRole('button', { name: 'Create account' }).click();

        // Expect redirect to /cvs after successful registration
        await page.waitForURL('/cvs', { timeout: 15000 });

        // 2. Navigate to form generator to create a new CV
        await page.goto('/generate-cv');

        await page.fill('#cv_name', 'My UUID E2E CV');
        await page.fill('#name', 'Fauzan UUID');
        await page.fill('#email', 'fauzan@example.com');
        await page.fill('#phone', '+628123456789');
        await page.fill('#address', 'Jakarta, Indonesia');
        await page.fill('#summary', 'A professional developer experienced with UUIDv7 architectures.');

        // Click Save CV
        await page.getByRole('button', { name: 'Save CV' }).click();
        await expect(page.locator('text=CV saved to your account.')).toBeVisible({ timeout: 15000 });

        // 3. Navigate to My CVs list and verify CV is present
        await page.goto('/cvs');
        const cvCardLink = page.locator('a', { hasText: 'My UUID E2E CV' }).first();
        await expect(cvCardLink).toBeVisible({ timeout: 15000 });

        // Click the card to navigate to CV show page
        await cvCardLink.click();
        await page.waitForURL(/\/cvs\/[0-9a-fA-F-]{36}$/, { timeout: 15000 });

        // Verify UUID in URL string and ensure it was never parsed or treated as a number
        const currentUrl = page.url();
        const urlParts = currentUrl.split('/');
        const uuidString = urlParts[urlParts.length - 1];
        expect(uuidString).toMatch(/^[0-9a-fA-F-]{36}$/);
        expect(isNaN(Number(uuidString))).toBe(true);

        // 4. Verify edit route preserves UUID string
        const editLink = page.locator('a', { hasText: 'Edit' }).first();
        await editLink.click();
        await page.waitForURL(new RegExp(`/cvs/${uuidString}/edit`), { timeout: 15000 });
        expect(page.url()).toContain(`/cvs/${uuidString}/edit`);

        // Modify a field and save update
        await page.fill('#cv_name', 'Updated UUID E2E CV');
        await page.getByRole('button', { name: 'Save CV' }).click();
        await page.waitForURL(new RegExp(`/cvs/${uuidString}$`), { timeout: 15000 });

        // Verify window title has updated cv_name indicating successful save and load
        await expect(page).toHaveTitle(/Updated UUID E2E CV/, { timeout: 15000 });

        // 5. Navigate back to list and test hard delete with native confirmation
        await page.goto('/cvs');
        await expect(page.locator('text=Updated UUID E2E CV')).toBeVisible({ timeout: 15000 });

        // Set up native confirmation dialog handler
        page.on('dialog', async (dialog) => {
            expect(dialog.message()).toContain('Apakah Anda yakin ingin menghapus CV');
            await dialog.accept();
        });

        // Click delete button on the card
        const deleteButton = page.locator('button', { hasText: 'Delete' }).first();
        await deleteButton.click();

        // Verify CV card disappears after successful deletion
        await expect(page.locator('text=Updated UUID E2E CV')).not.toBeVisible({ timeout: 15000 });
        await expect(page.locator('text=You have not saved any CVs yet.')).toBeVisible({ timeout: 15000 });
    });
});
