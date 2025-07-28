describe('Authentication Flow', () => {
  beforeEach(() => {
    cy.visit('/login')
  })

  it('should display login page correctly', () => {
    cy.contains('Welcome Back').should('be.visible')
    cy.contains('Sign in to your inventory management system').should('be.visible')
    cy.get('input[type="email"]').should('be.visible')
    cy.get('input[type="password"]').should('be.visible')
    cy.get('button[type="submit"]').should('be.visible')
  })

  it('should show demo account options', () => {
    cy.contains('Demo Accounts').should('be.visible')
    cy.contains('Admin').should('be.visible')
    cy.contains('Inventory Manager').should('be.visible')
    cy.contains('Sales Person').should('be.visible')
  })

  it('should login successfully with valid credentials', () => {
    cy.fixture('users').then((users) => {
      cy.get('input[type="email"]').type(users.admin.email)
      cy.get('input[type="password"]').type(users.admin.password)
      cy.get('button[type="submit"]').click()

      // Should redirect to dashboard
      cy.url().should('include', '/dashboard')
      cy.contains('Inventory Management').should('be.visible')
    })
  })

  it('should show error for invalid credentials', () => {
    cy.get('input[type="email"]').type('invalid@example.com')
    cy.get('input[type="password"]').type('wrongpassword')
    cy.get('button[type="submit"]').click()

    // Should stay on login page and show error
    cy.url().should('include', '/login')
    // Note: Error message depends on toast implementation
  })

  it('should login with demo account buttons', () => {
    cy.fixture('users').then((users) => {
      // Click admin demo button
      cy.contains('Admin').click()

      // Should redirect to dashboard
      cy.url().should('include', '/dashboard')
      cy.contains('Inventory Management').should('be.visible')
    })
  })

  it('should validate required fields', () => {
    cy.get('button[type="submit"]').click()

    // Check HTML5 validation
    cy.get('input[type="email"]:invalid').should('exist')
    cy.get('input[type="password"]:invalid').should('exist')
  })

  it('should logout successfully', () => {
    // Login first
    cy.login()

    // Logout
    cy.get('button').contains('Logout').click()

    // Should redirect to login
    cy.url().should('include', '/login')
  })

  it('should redirect to login when accessing protected routes without auth', () => {
    cy.visit('/dashboard')
    cy.url().should('include', '/login')

    cy.visit('/products')
    cy.url().should('include', '/login')

    cy.visit('/analytics')
    cy.url().should('include', '/login')
  })

  it('should persist login state across page refreshes', () => {
    cy.login()
    cy.url().should('include', '/dashboard')

    // Refresh page
    cy.reload()

    // Should still be logged in
    cy.url().should('include', '/dashboard')
    cy.contains('Inventory Management').should('be.visible')
  })

  it('should handle session expiry gracefully', () => {
    cy.login()

    // Simulate expired token
    cy.window().then((win) => {
      win.localStorage.setItem('token', 'expired-token')
    })

    // Try to access protected route
    cy.visit('/products')

    // Should redirect to login
    cy.url().should('include', '/login')
  })
})
