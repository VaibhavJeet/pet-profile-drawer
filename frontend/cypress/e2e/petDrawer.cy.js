describe('Pet Profile Drawer', () => {
  beforeEach(() => {
    // Visit the app with the mock backend running
    cy.visit('http://localhost:5173');
  });

  it('should open drawer, edit pet details, and save changes', () => {
    // Search for a client (matches "Customer 1" from data)
    cy.get('input[placeholder*="Search"]').type('Customer 1');
    cy.wait(1000); // Wait for debounce and API response

    // Click the first pet avatar to open the drawer
    cy.get('.p-6') // Target the padded container in aside
      .find('.flex.space-x-2') // Target the pets div in the table cell
      .find('img.w-8') // Find the avatar image
      .first()
      .click();
    cy.get('[aria-label="Pet Profile Drawer"]').should('be.visible');

    // Ensure Pet Details tab is visible (force visibility)
    cy.get('#tab-details')
      .scrollIntoView()
      .should('exist')
      .then(($el) => {
        cy.wrap($el).parents().each(($parent) => {
          cy.wrap($parent).invoke('css', 'overflow', 'visible');
        });
        cy.wrap($el).should('be.visible', { timeout: 6000 });
      });

    // Open Actions menu and click Edit
    cy.get('button').contains('Actions').click();
    cy.wait(500); // Wait for dropdown to render
    cy.get('button').contains('Edit')
      .should('not.be.disabled')
      .click();

    // Edit the weight field
    cy.get('input[name="weightKg"]').clear().type('5{enter}');

    // Intercept and mock the PUT request
    cy.intercept('PUT', '/pets/101', (req) => {
      req.reply({
        statusCode: 200,
        body: {
          id: 101,
          clientId: 1,
          name: "Dog 1",
          status: "Active",
          type: "Dog",
          breed: "American Staffordshire Terrier",
          size: "Medium",
          temper: "Excellent",
          color: "Black & White",
          gender: "Neutered - Male",
          weightKg: 5.0,
          dob: "2025-07-29",
          attributes: ["Barks", "Blind", "Escaper"],
          notes: null,
          customerNotes: "This is simple notes from portal",
          photos: ["/seed/dog1.png"]
        }
      });
    }).as('updatePet');

    // Save the changes
    cy.get('button').contains('Save').click();
    cy.wait('@updatePet');
    cy.wait(2000); // Wait for UI update and refetch

    // Check if the weight updated in the KeyValueTable
    cy.get('#tab-details')
      .contains('Weight')
      .parent()
      .then(($row) => {
        cy.wrap($row).should('contain.text', '5.00 kg');
        cy.log('Row content:', $row.text());
      });
  });
});