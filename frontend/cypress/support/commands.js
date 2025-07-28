// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

// Custom login command
Cypress.Commands.add('login', (email = 'admin@inventory.com', password = 'admin123') => {
  cy.visit('/login')
  cy.get('input[type="email"]').type(email)
  cy.get('input[type="password"]').type(password)
  cy.get('button[type="submit"]').click()
  cy.url().should('not.include', '/login')
})

// Custom login via API (faster for setup)
Cypress.Commands.add('loginViaAPI', (email = 'admin@inventory.com', password = 'admin123') => {
  cy.request({
    method: 'POST',
    url: `${Cypress.env('apiUrl')}/api/auth/login`,
    body: { email, password },
  }).then((response) => {
    expect(response.status).to.eq(200)
    expect(response.body.success).to.be.true
    
    // Store token and user in localStorage
    window.localStorage.setItem('token', response.body.data.token)
    window.localStorage.setItem('user', JSON.stringify(response.body.data.user))
  })
})

// Custom logout command
Cypress.Commands.add('logout', () => {
  cy.get('[data-testid="logout-button"]').click()
  cy.url().should('include', '/login')
})

// Wait for page to load completely
Cypress.Commands.add('waitForPageLoad', () => {
  cy.get('body').should('be.visible')
  cy.wait(1000) // Wait for React hydration
})

// Add product to cart (for POS testing)
Cypress.Commands.add('addProductToCart', (productName) => {
  cy.contains(productName).click()
  cy.get('[data-testid="cart"]').should('contain', productName)
})

// Clear cart
Cypress.Commands.add('clearCart', () => {
  cy.get('[data-testid="clear-cart-button"]').click()
  cy.get('[data-testid="cart"]').should('contain', 'Cart is empty')
})

// Check if element is visible in viewport
Cypress.Commands.add('isInViewport', { prevSubject: true }, (subject) => {
  const bottom = Cypress.$(cy.state('window')).height()
  const rect = subject[0].getBoundingClientRect()

  expect(rect.top).to.be.lessThan(bottom)
  expect(rect.bottom).to.be.greaterThan(0)
  return subject
})

// Custom command to wait for API response
Cypress.Commands.add('waitForAPI', (alias) => {
  cy.wait(alias).then((interception) => {
    expect(interception.response.statusCode).to.be.oneOf([200, 201])
  })
})

// Seed test data
Cypress.Commands.add('seedTestData', () => {
  // This would typically call backend endpoints to seed test data
  cy.log('Seeding test data...')
})

// Clean up test data
Cypress.Commands.add('cleanupTestData', () => {
  // This would typically call backend endpoints to clean up test data
  cy.log('Cleaning up test data...')
})
