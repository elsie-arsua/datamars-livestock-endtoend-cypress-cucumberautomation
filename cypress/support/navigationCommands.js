// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add("login", (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add("drag", { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add("dismiss", { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite("visit", (originalFn, url, options) => { ... })

Cypress.Commands.add('goToHomepage', () => {
    return cy.get('.logo > a').click()
})

Cypress.Commands.add('goToFarmSettingsPage', () => {
    return cy.get('a[href="/en-US/farm-settings"]').click()
})

Cypress.Commands.add('goToFarmSettingsUsersList', () => {
    cy.visit(Cypress.env('monitoringWebsite') + '/farm-settings/users')
})

Cypress.Commands.add('goToAccountSettingsPage', () => {
    cy.visit(Cypress.env('myAccountApplication') + '/account-settings')
})

Cypress.Commands.add('goToSecurityPage', () => {
    cy.visit(Cypress.env('myAccountApplication') + '/security')
})

Cypress.Commands.add('goToMyProfile', () => {
    cy.url()
      .then((url) => {
          if (!url.endsWith('/my-profile')) {
              cy.visit(Cypress.env('monitoringWebsite') + '/my-profile')
            }
      })
    //cy.visit(Cypress.env('monitoringWebsite') + '/my-profile')      
})

Cypress.Commands.add('goToMyFarms', () => {
    cy.visit(Cypress.env('monitoringWebsite') + '/user/my-farms')
})
