describe('ML Predictions and Analytics', () => {
  beforeEach(() => {
    // Login as admin
    cy.visit('/login');
    cy.get('[data-cy=email-input]').type('admin@inventory.com');
    cy.get('[data-cy=password-input]').type('admin123');
    cy.get('[data-cy=login-button]').click();
    cy.url().should('include', '/admin-dashboard');
  });

  describe('Demand Predictions', () => {
    it('should display demand predictions dashboard', () => {
      cy.visit('/analytics/predictions');
      
      // Check main prediction components
      cy.get('[data-cy=prediction-dashboard]').should('be.visible');
      cy.get('[data-cy=prediction-cards]').should('have.length.greaterThan', 0);
      cy.get('[data-cy=confidence-indicators]').should('be.visible');
    });

    it('should show seasonal demand patterns', () => {
      cy.visit('/analytics/predictions');
      
      // Check seasonal analysis
      cy.get('[data-cy=seasonal-chart]').should('be.visible');
      cy.get('[data-cy=spring-demand]').should('be.visible');
      cy.get('[data-cy=summer-demand]').should('be.visible');
      cy.get('[data-cy=fall-demand]').should('be.visible');
      cy.get('[data-cy=winter-demand]').should('be.visible');
    });

    it('should predict demand for specific product', () => {
      cy.visit('/analytics/predictions');
      
      // Select product for prediction
      cy.get('[data-cy=product-selector]').select('ChlorMax 480 EC');
      cy.get('[data-cy=prediction-period]').select('30');
      cy.get('[data-cy=generate-prediction]').click();
      
      // Verify prediction results
      cy.get('[data-cy=prediction-result]').should('be.visible');
      cy.get('[data-cy=predicted-demand]').should('contain', 'units');
      cy.get('[data-cy=confidence-score]').should('be.visible');
      cy.get('[data-cy=prediction-factors]').should('be.visible');
    });

    it('should show weather impact on predictions', () => {
      cy.visit('/analytics/predictions');
      
      // Check weather factors
      cy.get('[data-cy=weather-factors]').should('be.visible');
      cy.get('[data-cy=rainfall-impact]').should('be.visible');
      cy.get('[data-cy=temperature-impact]').should('be.visible');
      cy.get('[data-cy=humidity-impact]').should('be.visible');
    });

    it('should display crop calendar influence', () => {
      cy.visit('/analytics/predictions');
      
      // Check crop calendar integration
      cy.get('[data-cy=crop-calendar]').should('be.visible');
      cy.get('[data-cy=planting-season]').should('be.visible');
      cy.get('[data-cy=harvest-season]').should('be.visible');
      cy.get('[data-cy=growth-season]').should('be.visible');
    });

    it('should provide actionable recommendations', () => {
      cy.visit('/analytics/predictions');
      cy.get('[data-cy=product-selector]').select('NPK 20-20-20');
      cy.get('[data-cy=generate-prediction]').click();
      
      // Check recommendations
      cy.get('[data-cy=recommendations]').should('be.visible');
      cy.get('[data-cy=stock-recommendation]').should('be.visible');
      cy.get('[data-cy=pricing-recommendation]').should('be.visible');
      cy.get('[data-cy=seasonal-recommendation]').should('be.visible');
    });
  });

  describe('Reorder Point Optimization', () => {
    it('should calculate optimal reorder points', () => {
      cy.visit('/analytics/reorder-optimization');
      
      // Check reorder calculations
      cy.get('[data-cy=reorder-table]').should('be.visible');
      cy.get('[data-cy=current-stock]').should('be.visible');
      cy.get('[data-cy=reorder-point]').should('be.visible');
      cy.get('[data-cy=recommended-quantity]').should('be.visible');
    });

    it('should consider lead times for agricultural products', () => {
      cy.visit('/analytics/reorder-optimization');
      
      // Check lead time considerations
      cy.get('[data-cy=lead-time-analysis]').should('be.visible');
      cy.get('[data-cy=supplier-lead-time]').should('be.visible');
      cy.get('[data-cy=regulatory-approval-time]').should('be.visible');
      cy.get('[data-cy=safety-stock]').should('be.visible');
    });

    it('should adjust for seasonal demand variations', () => {
      cy.visit('/analytics/reorder-optimization');
      
      // Check seasonal adjustments
      cy.get('[data-cy=seasonal-adjustment]').should('be.visible');
      cy.get('[data-cy=peak-season-factor]').should('be.visible');
      cy.get('[data-cy=off-season-factor]').should('be.visible');
    });

    it('should show days until reorder needed', () => {
      cy.visit('/analytics/reorder-optimization');
      
      // Check reorder timing
      cy.get('[data-cy=reorder-timing]').should('be.visible');
      cy.get('[data-cy=days-until-reorder]').should('be.visible');
      cy.get('[data-cy=urgent-reorders]').should('be.visible');
    });
  });

  describe('Price Optimization', () => {
    it('should suggest optimal pricing', () => {
      cy.visit('/analytics/price-optimization');
      
      // Check price optimization
      cy.get('[data-cy=price-optimization-table]').should('be.visible');
      cy.get('[data-cy=current-price]').should('be.visible');
      cy.get('[data-cy=recommended-price]').should('be.visible');
      cy.get('[data-cy=profit-impact]').should('be.visible');
    });

    it('should consider market conditions', () => {
      cy.visit('/analytics/price-optimization');
      
      // Check market factors
      cy.get('[data-cy=market-conditions]').should('be.visible');
      cy.get('[data-cy=competitor-pricing]').should('be.visible');
      cy.get('[data-cy=demand-elasticity]').should('be.visible');
    });

    it('should show seasonal pricing recommendations', () => {
      cy.visit('/analytics/price-optimization');
      
      // Check seasonal pricing
      cy.get('[data-cy=seasonal-pricing]').should('be.visible');
      cy.get('[data-cy=peak-season-pricing]').should('be.visible');
      cy.get('[data-cy=off-season-pricing]').should('be.visible');
    });
  });

  describe('Batch Predictions', () => {
    it('should generate predictions for multiple products', () => {
      cy.visit('/analytics/batch-predictions');
      
      // Select multiple products
      cy.get('[data-cy=product-multiselect]').click();
      cy.get('[data-cy=product-option]').first().click();
      cy.get('[data-cy=product-option]').eq(1).click();
      cy.get('[data-cy=product-option]').eq(2).click();
      
      // Select prediction types
      cy.get('[data-cy=prediction-type-demand]').check();
      cy.get('[data-cy=prediction-type-reorder]').check();
      cy.get('[data-cy=prediction-type-price]').check();
      
      // Generate batch predictions
      cy.get('[data-cy=generate-batch-predictions]').click();
      
      // Verify results
      cy.get('[data-cy=batch-results]').should('be.visible');
      cy.get('[data-cy=prediction-summary]').should('be.visible');
      cy.get('[data-cy=total-predictions]').should('contain', '9'); // 3 products × 3 types
    });

    it('should export batch prediction results', () => {
      cy.visit('/analytics/batch-predictions');
      
      // Generate predictions first
      cy.get('[data-cy=select-all-products]').click();
      cy.get('[data-cy=prediction-type-demand]').check();
      cy.get('[data-cy=generate-batch-predictions]').click();
      
      // Export results
      cy.get('[data-cy=export-results]').click();
      cy.get('[data-cy=export-format]').select('CSV');
      cy.get('[data-cy=confirm-export]').click();
      
      // Verify export
      cy.get('[data-cy=export-success]').should('be.visible');
    });
  });

  describe('Prediction Accuracy Tracking', () => {
    it('should display prediction accuracy metrics', () => {
      cy.visit('/analytics/accuracy-tracking');
      
      // Check accuracy metrics
      cy.get('[data-cy=accuracy-dashboard]').should('be.visible');
      cy.get('[data-cy=overall-accuracy]').should('be.visible');
      cy.get('[data-cy=accuracy-by-product-type]').should('be.visible');
      cy.get('[data-cy=accuracy-trends]').should('be.visible');
    });

    it('should show model performance over time', () => {
      cy.visit('/analytics/accuracy-tracking');
      
      // Check performance charts
      cy.get('[data-cy=performance-chart]').should('be.visible');
      cy.get('[data-cy=accuracy-timeline]').should('be.visible');
      cy.get('[data-cy=confidence-vs-accuracy]').should('be.visible');
    });

    it('should identify prediction errors and patterns', () => {
      cy.visit('/analytics/accuracy-tracking');
      
      // Check error analysis
      cy.get('[data-cy=error-analysis]').should('be.visible');
      cy.get('[data-cy=prediction-errors]').should('be.visible');
      cy.get('[data-cy=error-patterns]').should('be.visible');
      cy.get('[data-cy=improvement-suggestions]').should('be.visible');
    });
  });

  describe('Real-time Analytics', () => {
    it('should display real-time demand indicators', () => {
      cy.visit('/analytics/real-time');
      
      // Check real-time components
      cy.get('[data-cy=real-time-dashboard]').should('be.visible');
      cy.get('[data-cy=live-demand-indicators]').should('be.visible');
      cy.get('[data-cy=current-weather-impact]').should('be.visible');
      cy.get('[data-cy=trending-products]').should('be.visible');
    });

    it('should update predictions based on current conditions', () => {
      cy.visit('/analytics/real-time');
      
      // Check dynamic updates
      cy.get('[data-cy=dynamic-predictions]').should('be.visible');
      cy.get('[data-cy=weather-adjusted-demand]').should('be.visible');
      cy.get('[data-cy=market-condition-impact]').should('be.visible');
    });

    it('should provide alerts for significant changes', () => {
      cy.visit('/analytics/real-time');
      
      // Check alert system
      cy.get('[data-cy=prediction-alerts]').should('be.visible');
      cy.get('[data-cy=demand-spike-alerts]').should('be.visible');
      cy.get('[data-cy=weather-impact-alerts]').should('be.visible');
    });
  });

  describe('Custom Analytics', () => {
    it('should allow custom prediction parameters', () => {
      cy.visit('/analytics/custom');
      
      // Set custom parameters
      cy.get('[data-cy=custom-weather]').click();
      cy.get('[data-cy=rainfall-input]').type('75');
      cy.get('[data-cy=temperature-input]').type('28');
      cy.get('[data-cy=humidity-input]').type('65');
      
      cy.get('[data-cy=custom-season]').select('spring');
      cy.get('[data-cy=custom-crop-stage]').select('planting');
      
      // Generate custom prediction
      cy.get('[data-cy=generate-custom-prediction]').click();
      
      // Verify custom results
      cy.get('[data-cy=custom-prediction-result]').should('be.visible');
      cy.get('[data-cy=parameter-impact]').should('be.visible');
    });

    it('should save custom prediction scenarios', () => {
      cy.visit('/analytics/custom');
      
      // Create scenario
      cy.get('[data-cy=scenario-name]').type('High Rainfall Spring');
      cy.get('[data-cy=rainfall-input]').type('100');
      cy.get('[data-cy=temperature-input]').type('25');
      cy.get('[data-cy=custom-season]').select('spring');
      
      // Save scenario
      cy.get('[data-cy=save-scenario]').click();
      
      // Verify saved
      cy.get('[data-cy=saved-scenarios]').should('contain', 'High Rainfall Spring');
    });
  });

  describe('API Integration Tests', () => {
    it('should handle ML service API calls', () => {
      cy.visit('/analytics/predictions');
      
      // Intercept API calls
      cy.intercept('GET', '/api/predictions/demand/*', { fixture: 'demand-prediction.json' }).as('getDemandPrediction');
      cy.intercept('GET', '/api/predictions/reorder/*', { fixture: 'reorder-prediction.json' }).as('getReorderPrediction');
      
      // Trigger API calls
      cy.get('[data-cy=product-selector]').select('ChlorMax 480 EC');
      cy.get('[data-cy=generate-prediction]').click();
      
      // Verify API calls
      cy.wait('@getDemandPrediction');
      cy.wait('@getReorderPrediction');
    });

    it('should handle API errors gracefully', () => {
      cy.visit('/analytics/predictions');
      
      // Mock API error
      cy.intercept('GET', '/api/predictions/demand/*', { statusCode: 500 }).as('getPredictionError');
      
      // Trigger API call
      cy.get('[data-cy=product-selector]').select('ChlorMax 480 EC');
      cy.get('[data-cy=generate-prediction]').click();
      
      // Verify error handling
      cy.wait('@getPredictionError');
      cy.get('[data-cy=error-message]').should('be.visible');
      cy.get('[data-cy=retry-button]').should('be.visible');
    });
  });
});
