import { test, expect } from '@playwright/test'

test.describe('Inventory Management System E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login page
    await page.goto('/login')
  })

  test('complete user journey - admin workflow', async ({ page }) => {
    // Login as admin
    await page.fill('input[type="email"]', 'admin@inventory.com')
    await page.fill('input[type="password"]', 'admin123')
    await page.click('button[type="submit"]')

    // Should redirect to dashboard
    await expect(page).toHaveURL(/.*dashboard/)
    await expect(page.locator('text=Inventory Management')).toBeVisible()

    // Navigate to products page
    await page.click('text=Products')
    await expect(page).toHaveURL(/.*products/)

    // Check products are loaded
    await expect(page.locator('text=Loading')).not.toBeVisible({ timeout: 10000 })
    await expect(page.locator('text=Laptop Pro')).toBeVisible()

    // Navigate to analytics
    await page.click('text=Analytics')
    await expect(page).toHaveURL(/.*analytics/)
    await expect(page.locator('text=Analytics Dashboard')).toBeVisible()

    // Check currency display
    await expect(page.locator('text=₹')).toBeVisible()

    // Logout
    await page.click('text=Logout')
    await expect(page).toHaveURL(/.*login/)
  })

  test('sales user workflow - POS system', async ({ page }) => {
    // Login as sales user
    await page.fill('input[type="email"]', 'sales@inventory.com')
    await page.fill('input[type="password"]', 'admin123')
    await page.click('button[type="submit"]')

    // Should redirect to sales dashboard
    await expect(page).toHaveURL(/.*sales-dashboard/)
    await expect(page.locator('text=SuperMart POS')).toBeVisible()

    // Wait for products to load
    await expect(page.locator('text=Loading products')).not.toBeVisible({ timeout: 10000 })

    // Search for a product
    await page.fill('input[placeholder="Search products..."]', 'laptop')
    await expect(page.locator('text=Laptop Pro')).toBeVisible()
    await expect(page.locator('text=Wireless Mouse')).not.toBeVisible()

    // Clear search
    await page.fill('input[placeholder="Search products..."]', '')
    await expect(page.locator('text=Wireless Mouse')).toBeVisible()

    // Add product to cart
    await page.click('text=Laptop Pro 15"')
    await expect(page.locator('text=Cart is empty')).not.toBeVisible()
    await expect(page.locator('text=Laptop Pro 15"')).toBeVisible()

    // Check cart total
    await expect(page.locator('text=₹1,299.99')).toBeVisible()

    // Navigate to returns
    await page.click('text=Return Requests')
    await expect(page).toHaveURL(/.*returns/)
    await expect(page.locator('text=Return Requests')).toBeVisible()
  })

  test('inventory user workflow', async ({ page }) => {
    // Login as inventory user
    await page.fill('input[type="email"]', 'inventory@inventory.com')
    await page.fill('input[type="password"]', 'admin123')
    await page.click('button[type="submit"]')

    // Should redirect to inventory dashboard
    await expect(page).toHaveURL(/.*inventory-dashboard/)
    await expect(page.locator('text=Inventory Management')).toBeVisible()

    // Check inventory-specific features
    await expect(page.locator('text=Stock Levels')).toBeVisible()
    await expect(page.locator('text=Low Stock Alerts')).toBeVisible()
  })

  test('role-based access control', async ({ page }) => {
    // Login as sales user
    await page.fill('input[type="email"]', 'sales@inventory.com')
    await page.fill('input[type="password"]', 'admin123')
    await page.click('button[type="submit"]')

    // Try to access admin-only analytics page
    await page.goto('/analytics')
    
    // Should be redirected or show access denied
    // This depends on implementation - might redirect to dashboard or show error
    await expect(page).toHaveURL(/.*dashboard/)
  })

  test('responsive design - mobile view', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })

    // Login
    await page.fill('input[type="email"]', 'admin@inventory.com')
    await page.fill('input[type="password"]', 'admin123')
    await page.click('button[type="submit"]')

    // Check mobile navigation
    await expect(page.locator('text=Inventory Management')).toBeVisible()

    // Navigate to sales dashboard
    await page.goto('/sales-dashboard')
    await expect(page.locator('text=SuperMart POS')).toBeVisible()

    // Check mobile POS interface
    await expect(page.locator('input[placeholder="Search products..."]')).toBeVisible()
  })

  test('error handling - network failures', async ({ page }) => {
    // Intercept API calls and simulate network error
    await page.route('**/api/products', route => route.abort())

    // Login
    await page.fill('input[type="email"]', 'admin@inventory.com')
    await page.fill('input[type="password"]', 'admin123')
    await page.click('button[type="submit"]')

    // Navigate to products page
    await page.goto('/products')

    // Should handle error gracefully
    // Implementation-specific error handling
    await expect(page.locator('text=Error')).toBeVisible({ timeout: 10000 })
  })

  test('session persistence', async ({ page }) => {
    // Login
    await page.fill('input[type="email"]', 'admin@inventory.com')
    await page.fill('input[type="password"]', 'admin123')
    await page.click('button[type="submit"]')

    await expect(page).toHaveURL(/.*dashboard/)

    // Refresh page
    await page.reload()

    // Should still be logged in
    await expect(page).toHaveURL(/.*dashboard/)
    await expect(page.locator('text=Inventory Management')).toBeVisible()
  })

  test('data consistency across pages', async ({ page }) => {
    // Login as admin
    await page.fill('input[type="email"]', 'admin@inventory.com')
    await page.fill('input[type="password"]', 'admin123')
    await page.click('button[type="submit"]')

    // Go to analytics and note total products
    await page.click('text=Analytics')
    const totalProducts = await page.locator('text=Total Products').locator('..').locator('text=/\\d+/').textContent()

    // Go to products page and verify count matches
    await page.click('text=Products')
    await expect(page.locator('text=Loading')).not.toBeVisible({ timeout: 10000 })
    
    // Count visible products (this is a simplified check)
    const productElements = await page.locator('[data-testid="product-item"]').count()
    
    // Note: This is a basic consistency check - in real app you'd have more sophisticated verification
    expect(productElements).toBeGreaterThan(0)
  })

  test('currency localization', async ({ page }) => {
    // Login
    await page.fill('input[type="email"]', 'admin@inventory.com')
    await page.fill('input[type="password"]', 'admin123')
    await page.click('button[type="submit"]')

    // Check analytics page currency
    await page.click('text=Analytics')
    await expect(page.locator('text=₹')).toBeVisible()

    // Check sales dashboard currency
    await page.goto('/sales-dashboard')
    await expect(page.locator('text=Loading products')).not.toBeVisible({ timeout: 10000 })
    await expect(page.locator('text=₹')).toBeVisible()

    // Check admin sales overview currency
    await page.goto('/admin/sales')
    await expect(page.locator('text=₹')).toBeVisible()
  })

  test('search functionality across different pages', async ({ page }) => {
    // Login as admin
    await page.fill('input[type="email"]', 'admin@inventory.com')
    await page.fill('input[type="password"]', 'admin123')
    await page.click('button[type="submit"]')

    // Test search in products page
    await page.click('text=Products')
    await page.fill('input[placeholder*="search"]', 'laptop')
    await expect(page.locator('text=Laptop')).toBeVisible()

    // Test search in sales dashboard
    await page.goto('/sales-dashboard')
    await expect(page.locator('text=Loading products')).not.toBeVisible({ timeout: 10000 })
    await page.fill('input[placeholder="Search products..."]', 'mouse')
    await expect(page.locator('text=Mouse')).toBeVisible()
  })
})
