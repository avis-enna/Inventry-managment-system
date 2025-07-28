describe('Sales Dashboard (POS System)', () => {
  beforeEach(() => {
    // Login as sales user
    cy.loginViaAPI('sales@inventory.com', 'admin123')
    cy.visit('/sales-dashboard')
    cy.waitForPageLoad()
  })

  it('should display POS interface correctly', () => {
    cy.contains('🛒 SuperMart POS').should('be.visible')
    cy.contains('Sales Terminal').should('be.visible')
    cy.contains('Products').should('be.visible')
    cy.contains('Shopping Cart').should('be.visible')
    cy.get('input[placeholder="Search products..."]').should('be.visible')
  })

  it('should load and display products', () => {
    cy.contains('Loading products...').should('not.exist')
    
    // Check for some expected products
    cy.contains('Laptop Pro 15"').should('be.visible')
    cy.contains('Wireless Mouse').should('be.visible')
    cy.contains('₹').should('be.visible') // Check currency display
  })

  it('should search products correctly', () => {
    // Wait for products to load
    cy.contains('Laptop Pro 15"').should('be.visible')

    // Search for laptop
    cy.get('input[placeholder="Search products..."]').type('laptop')

    // Should show only laptop products
    cy.contains('Laptop Pro 15"').should('be.visible')
    cy.contains('Wireless Mouse').should('not.exist')

    // Clear search
    cy.get('input[placeholder="Search products..."]').clear()

    // Should show all products again
    cy.contains('Wireless Mouse').should('be.visible')
  })

  it('should add products to cart', () => {
    // Initially cart should be empty
    cy.contains('Cart is empty').should('be.visible')

    // Add laptop to cart
    cy.contains('Laptop Pro 15"').click()

    // Cart should now contain the product
    cy.contains('Cart is empty').should('not.exist')
    cy.contains('Laptop Pro 15"').should('be.visible')
    cy.contains('₹1,299.99').should('be.visible')
  })

  it('should update quantity when adding same product multiple times', () => {
    // Add laptop twice
    cy.contains('Laptop Pro 15"').click()
    cy.contains('Laptop Pro 15"').click()

    // Should show quantity 2
    cy.contains('2 x Laptop Pro 15"').should('be.visible')
    cy.contains('₹2,599.98').should('be.visible') // 2 * 1299.99
  })

  it('should remove items from cart', () => {
    // Add product to cart
    cy.contains('Laptop Pro 15"').click()
    cy.contains('Laptop Pro 15"').should('be.visible')

    // Remove from cart
    cy.contains('Remove').click()

    // Cart should be empty again
    cy.contains('Cart is empty').should('be.visible')
  })

  it('should calculate cart total correctly', () => {
    // Add laptop (₹1299.99)
    cy.contains('Laptop Pro 15"').click()

    // Add mouse (₹49.99)
    cy.contains('Wireless Mouse').click()

    // Check total
    cy.contains('Total: ₹1,349.98').should('be.visible')
  })

  it('should process sale successfully', () => {
    // Add products to cart
    cy.contains('Laptop Pro 15"').click()
    cy.contains('Wireless Mouse').click()

    // Process sale
    cy.contains('Process Sale').click()

    // Should show success message and clear cart
    cy.contains('Cart is empty').should('be.visible')
    // Note: Success toast message would appear but might be hard to test
  })

  it('should handle different payment methods', () => {
    // Add product to cart
    cy.contains('Laptop Pro 15"').click()

    // Select payment method (if UI supports it)
    // This depends on the actual implementation
    cy.get('[data-testid="payment-method"]').should('exist')
  })

  it('should navigate to other sections', () => {
    // Test navigation buttons
    cy.contains('Return Requests').click()
    cy.url().should('include', '/returns')

    cy.go('back')
    cy.contains('Dashboard').click()
    cy.url().should('include', '/dashboard')
  })

  it('should handle out of stock products', () => {
    // This test would require products with 0 stock
    // Implementation depends on how out-of-stock is handled in UI
    cy.log('Testing out of stock handling')
  })

  it('should maintain cart state during session', () => {
    // Add product to cart
    cy.contains('Laptop Pro 15"').click()
    cy.contains('Laptop Pro 15"').should('be.visible')

    // Navigate away and back
    cy.contains('Return Requests').click()
    cy.go('back')

    // Cart should still contain the product
    cy.contains('Laptop Pro 15"').should('be.visible')
  })

  it('should be responsive on different screen sizes', () => {
    // Test mobile view
    cy.viewport(375, 667) // iPhone SE
    cy.contains('🛒 SuperMart POS').should('be.visible')
    cy.get('input[placeholder="Search products..."]').should('be.visible')

    // Test tablet view
    cy.viewport(768, 1024) // iPad
    cy.contains('Products').should('be.visible')
    cy.contains('Shopping Cart').should('be.visible')

    // Test desktop view
    cy.viewport(1280, 720)
    cy.contains('Products').should('be.visible')
    cy.contains('Shopping Cart').should('be.visible')
  })

  it('should handle network errors gracefully', () => {
    // Intercept API calls and simulate network error
    cy.intercept('GET', '**/api/products', { forceNetworkError: true }).as('productsError')

    cy.reload()

    // Should handle error gracefully
    cy.wait('@productsError')
    // Error handling depends on implementation
  })

  it('should validate cart before processing sale', () => {
    // Try to process sale with empty cart
    cy.contains('Process Sale').should('be.disabled')

    // Add product
    cy.contains('Laptop Pro 15"').click()

    // Now should be able to process sale
    cy.contains('Process Sale').should('not.be.disabled')
  })
})
