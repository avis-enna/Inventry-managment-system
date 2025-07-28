describe('Pesticide and Fertilizer Management', () => {
  beforeEach(() => {
    // Login as admin before each test
    cy.visit('/login');
    cy.get('[data-cy=email-input]').type('admin@inventory.com');
    cy.get('[data-cy=password-input]').type('admin123');
    cy.get('[data-cy=login-button]').click();
    cy.url().should('include', '/admin-dashboard');
  });

  describe('Product Management', () => {
    it('should display pesticide and fertilizer categories', () => {
      cy.visit('/inventory-dashboard');
      cy.get('[data-cy=category-filter]').should('contain', 'Pesticides');
      cy.get('[data-cy=category-filter]').should('contain', 'Fertilizers');
      cy.get('[data-cy=category-filter]').should('contain', 'Herbicides');
      cy.get('[data-cy=category-filter]').should('contain', 'Fungicides');
    });

    it('should create a new pesticide product', () => {
      cy.visit('/inventory-dashboard');
      cy.get('[data-cy=add-product-button]').click();
      
      // Fill product form
      cy.get('[data-cy=product-name]').type('Test Pesticide 2024');
      cy.get('[data-cy=product-description]').type('Test pesticide for cypress testing');
      cy.get('[data-cy=product-sku]').type('TEST-PEST-001');
      cy.get('[data-cy=product-unit-price]').type('49.99');
      cy.get('[data-cy=product-cost-price]').type('35.00');
      cy.get('[data-cy=product-wholesale-price]').type('42.00');
      cy.get('[data-cy=product-mrp]').type('55.00');
      cy.get('[data-cy=product-quantity]').type('100');
      cy.get('[data-cy=product-min-stock]').type('20');
      cy.get('[data-cy=product-max-stock]').type('500');
      
      // Select category and supplier
      cy.get('[data-cy=product-category]').select('Pesticides');
      cy.get('[data-cy=product-supplier]').select('AgriChem Industries');
      
      // Pesticide specific fields
      cy.get('[data-cy=product-type]').select('INSECTICIDE');
      cy.get('[data-cy=regulatory-status]').select('APPROVED');
      cy.get('[data-cy=registration-number]').type('EPA-TEST-001-2024');
      cy.get('[data-cy=application-method]').select('SPRAY');
      cy.get('[data-cy=toxicity-level]').select('MODERATE');
      cy.get('[data-cy=application-rate]').type('2-3 ml per liter');
      cy.get('[data-cy=prehi-interval]').type('14');
      cy.get('[data-cy=reentry-interval]').type('12');
      cy.get('[data-cy=expiry-date]').type('2025-12-31');
      cy.get('[data-cy=batch-number]').type('TEST-BATCH-001');
      cy.get('[data-cy=storage-conditions]').type('Store in cool, dry place');
      cy.get('[data-cy=safety-warnings]').type('Avoid contact with skin and eyes');
      
      // Submit form
      cy.get('[data-cy=submit-product]').click();
      
      // Verify success
      cy.get('[data-cy=success-message]').should('contain', 'Product added successfully');
      cy.get('[data-cy=product-list]').should('contain', 'Test Pesticide 2024');
    });

    it('should create a new fertilizer product', () => {
      cy.visit('/inventory-dashboard');
      cy.get('[data-cy=add-product-button]').click();
      
      // Fill fertilizer form
      cy.get('[data-cy=product-name]').type('Test NPK Fertilizer');
      cy.get('[data-cy=product-description]').type('Test fertilizer for cypress testing');
      cy.get('[data-cy=product-sku]').type('TEST-FERT-001');
      cy.get('[data-cy=product-unit-price]').type('25.99');
      cy.get('[data-cy=product-cost-price]').type('18.00');
      cy.get('[data-cy=product-wholesale-price]').type('22.00');
      cy.get('[data-cy=product-mrp]').type('28.00');
      cy.get('[data-cy=product-quantity]').type('200');
      
      // Select category
      cy.get('[data-cy=product-category]').select('Fertilizers');
      cy.get('[data-cy=product-supplier]').select('GreenGrow Fertilizers');
      
      // Fertilizer specific fields
      cy.get('[data-cy=product-type]').select('FERTILIZER');
      cy.get('[data-cy=regulatory-status]').select('APPROVED');
      cy.get('[data-cy=application-method]').select('BROADCAST');
      cy.get('[data-cy=toxicity-level]').select('LOW');
      cy.get('[data-cy=application-rate]').type('2-5 kg per square meter');
      
      // Submit form
      cy.get('[data-cy=submit-product]').click();
      
      // Verify success
      cy.get('[data-cy=success-message]').should('contain', 'Product added successfully');
      cy.get('[data-cy=product-list]').should('contain', 'Test NPK Fertilizer');
    });

    it('should filter products by type', () => {
      cy.visit('/inventory-dashboard');
      
      // Filter by pesticides
      cy.get('[data-cy=category-filter]').select('Pesticides');
      cy.get('[data-cy=product-list] [data-cy=product-item]').each(($el) => {
        cy.wrap($el).should('contain', 'PESTICIDE').or('contain', 'INSECTICIDE');
      });
      
      // Filter by fertilizers
      cy.get('[data-cy=category-filter]').select('Fertilizers');
      cy.get('[data-cy=product-list] [data-cy=product-item]').each(($el) => {
        cy.wrap($el).should('contain', 'FERTILIZER');
      });
    });

    it('should display product safety information', () => {
      cy.visit('/inventory-dashboard');
      cy.get('[data-cy=product-item]').first().click();
      
      // Check safety data sheet information
      cy.get('[data-cy=product-details]').should('be.visible');
      cy.get('[data-cy=safety-warnings]').should('be.visible');
      cy.get('[data-cy=storage-conditions]').should('be.visible');
      cy.get('[data-cy=application-rate]').should('be.visible');
      cy.get('[data-cy=toxicity-level]').should('be.visible');
    });

    it('should validate expiry dates for pesticides', () => {
      cy.visit('/inventory-dashboard');
      
      // Check for expiry date warnings
      cy.get('[data-cy=expiry-warning]').should('exist');
      
      // Filter expired products
      cy.get('[data-cy=filter-expired]').click();
      cy.get('[data-cy=product-list] [data-cy=expired-product]').should('have.class', 'expired');
    });
  });

  describe('Customer Management with Farming Profiles', () => {
    it('should create customer with farming profile', () => {
      cy.visit('/customers');
      cy.get('[data-cy=add-customer-button]').click();
      
      // Basic customer info
      cy.get('[data-cy=customer-name]').type('Test Farm Ltd');
      cy.get('[data-cy=customer-email]').type('testfarm@example.com');
      cy.get('[data-cy=customer-phone]').type('+1-555-9999');
      cy.get('[data-cy=customer-address]').type('123 Farm Road, Test City');
      
      // Farming profile
      cy.get('[data-cy=farm-size]').type('150.5');
      cy.get('[data-cy=farm-location]').type('Test Valley, California');
      cy.get('[data-cy=farming-type]').select('CONVENTIONAL');
      cy.get('[data-cy=primary-crops]').select(['VEGETABLES', 'FRUITS']);
      cy.get('[data-cy=license-number]').type('PL-TEST-001');
      cy.get('[data-cy=license-expiry]').type('2025-12-31');
      
      // Submit
      cy.get('[data-cy=submit-customer]').click();
      cy.get('[data-cy=success-message]').should('contain', 'Customer created successfully');
    });

    it('should validate pesticide license requirements', () => {
      cy.visit('/sales-dashboard');
      cy.get('[data-cy=new-sale-button]').click();
      
      // Select customer without license
      cy.get('[data-cy=customer-select]').select('Organic Harvest Co.');
      
      // Try to add pesticide product
      cy.get('[data-cy=add-product-button]').click();
      cy.get('[data-cy=product-search]').type('ChlorMax');
      cy.get('[data-cy=product-result]').first().click();
      
      // Should show license warning
      cy.get('[data-cy=license-warning]').should('contain', 'Customer requires pesticide license');
    });
  });

  describe('Sales and Compliance', () => {
    it('should process pesticide sale with compliance checks', () => {
      cy.visit('/sales-dashboard');
      cy.get('[data-cy=new-sale-button]').click();
      
      // Select licensed customer
      cy.get('[data-cy=customer-select]').select('Green Valley Farm');
      
      // Add pesticide product
      cy.get('[data-cy=add-product-button]').click();
      cy.get('[data-cy=product-search]').type('ChlorMax');
      cy.get('[data-cy=product-result]').first().click();
      cy.get('[data-cy=quantity-input]').type('2');
      cy.get('[data-cy=add-to-cart]').click();
      
      // Verify compliance information is shown
      cy.get('[data-cy=compliance-info]').should('be.visible');
      cy.get('[data-cy=safety-warnings]').should('be.visible');
      cy.get('[data-cy=application-instructions]').should('be.visible');
      
      // Complete sale
      cy.get('[data-cy=payment-method]').select('CASH');
      cy.get('[data-cy=complete-sale]').click();
      
      // Verify success
      cy.get('[data-cy=sale-success]').should('contain', 'Sale completed successfully');
    });

    it('should generate compliance report', () => {
      cy.visit('/reports');
      cy.get('[data-cy=compliance-report-button]').click();
      
      // Set date range
      cy.get('[data-cy=start-date]').type('2024-01-01');
      cy.get('[data-cy=end-date]').type('2024-12-31');
      
      // Generate report
      cy.get('[data-cy=generate-report]').click();
      
      // Verify report generation
      cy.get('[data-cy=report-status]').should('contain', 'Report generated successfully');
      cy.get('[data-cy=download-report]').should('be.visible');
    });
  });

  describe('ML Predictions and Analytics', () => {
    it('should display demand predictions for agricultural products', () => {
      cy.visit('/analytics');
      
      // Check prediction cards
      cy.get('[data-cy=prediction-card]').should('have.length.greaterThan', 0);
      cy.get('[data-cy=demand-prediction]').should('be.visible');
      cy.get('[data-cy=confidence-score]').should('be.visible');
      cy.get('[data-cy=seasonal-factors]').should('be.visible');
    });

    it('should show weather impact on predictions', () => {
      cy.visit('/analytics');
      cy.get('[data-cy=weather-impact]').should('be.visible');
      cy.get('[data-cy=rainfall-factor]').should('be.visible');
      cy.get('[data-cy=temperature-factor]').should('be.visible');
    });

    it('should generate prediction report', () => {
      cy.visit('/analytics');
      cy.get('[data-cy=generate-prediction-report]').click();
      
      // Wait for report generation
      cy.get('[data-cy=report-loading]').should('be.visible');
      cy.get('[data-cy=report-ready]', { timeout: 10000 }).should('be.visible');
      
      // Download report
      cy.get('[data-cy=download-prediction-report]').click();
    });
  });

  describe('Inventory Alerts and Reorder Points', () => {
    it('should show low stock alerts for critical products', () => {
      cy.visit('/inventory-dashboard');
      
      // Check for low stock alerts
      cy.get('[data-cy=low-stock-alert]').should('be.visible');
      cy.get('[data-cy=critical-stock-items]').should('have.length.greaterThan', 0);
    });

    it('should calculate reorder points based on seasonal demand', () => {
      cy.visit('/inventory-dashboard');
      cy.get('[data-cy=product-item]').first().click();
      
      // Check reorder calculations
      cy.get('[data-cy=reorder-point]').should('be.visible');
      cy.get('[data-cy=seasonal-adjustment]').should('be.visible');
      cy.get('[data-cy=recommended-order-qty]').should('be.visible');
    });

    it('should generate reorder recommendations', () => {
      cy.visit('/inventory-dashboard');
      cy.get('[data-cy=reorder-recommendations]').click();
      
      // Verify recommendations
      cy.get('[data-cy=recommendation-list]').should('be.visible');
      cy.get('[data-cy=urgent-reorders]').should('be.visible');
      cy.get('[data-cy=seasonal-recommendations]').should('be.visible');
    });
  });

  describe('Reports and PDF Generation', () => {
    it('should generate inventory report PDF', () => {
      cy.visit('/reports');
      cy.get('[data-cy=inventory-report-button]').click();
      
      // Configure report options
      cy.get('[data-cy=include-low-stock]').check();
      cy.get('[data-cy=include-expiry-alerts]').check();
      cy.get('[data-cy=include-compliance]').check();
      
      // Generate report
      cy.get('[data-cy=generate-pdf-report]').click();
      
      // Verify PDF generation
      cy.get('[data-cy=pdf-generating]').should('be.visible');
      cy.get('[data-cy=pdf-ready]', { timeout: 15000 }).should('be.visible');
      cy.get('[data-cy=download-pdf]').should('be.visible');
    });

    it('should generate sales report with agricultural insights', () => {
      cy.visit('/reports');
      cy.get('[data-cy=sales-report-button]').click();
      
      // Set parameters
      cy.get('[data-cy=report-period]').select('monthly');
      cy.get('[data-cy=include-seasonal-analysis]').check();
      cy.get('[data-cy=include-crop-correlation]').check();
      
      // Generate report
      cy.get('[data-cy=generate-sales-report]').click();
      
      // Verify report content
      cy.get('[data-cy=seasonal-trends]').should('be.visible');
      cy.get('[data-cy=crop-based-sales]').should('be.visible');
      cy.get('[data-cy=pesticide-fertilizer-ratio]').should('be.visible');
    });
  });

  describe('Search and Filtering', () => {
    it('should search products by active ingredient', () => {
      cy.visit('/inventory-dashboard');
      cy.get('[data-cy=search-input]').type('Glyphosate');
      cy.get('[data-cy=search-button]').click();
      
      // Verify search results
      cy.get('[data-cy=search-results]').should('contain', 'Glyphosate');
      cy.get('[data-cy=product-item]').should('have.length.greaterThan', 0);
    });

    it('should filter by toxicity level', () => {
      cy.visit('/inventory-dashboard');
      cy.get('[data-cy=toxicity-filter]').select('HIGH');
      
      // Verify filtered results
      cy.get('[data-cy=product-item]').each(($el) => {
        cy.wrap($el).find('[data-cy=toxicity-badge]').should('contain', 'HIGH');
      });
    });

    it('should filter by crop type compatibility', () => {
      cy.visit('/inventory-dashboard');
      cy.get('[data-cy=crop-filter]').select('VEGETABLES');
      
      // Verify products are suitable for vegetables
      cy.get('[data-cy=product-item]').each(($el) => {
        cy.wrap($el).find('[data-cy=target-crops]').should('contain', 'VEGETABLES');
      });
    });
  });
});
