import { Before, After, Given , And , Then , When} from "cypress-cucumber-preprocessor/steps"

// Test Steps
Given ('I am on the login page', () => {
    cy.visit(Cypress.env('monitoringWebsite'))
      .url().should('include', Cypress.env('fusionAuthApplication'))
})

Given ('I am logged in as {string}+{string}', (email, password) => {
    cy.loginAPI(email, password)
      .then((response) => {
        expect(response.status).to.eql(200)
        cy.wrap({email: email, password: password}).as('initialUser')
      })
})
  
Given ('I am logged in as {string}', (email) => {
  //cy.logout()
  //  .then((response) => {
      cy.loginAPIDefaultPassword(email)
      .then((response) => {
        expect(response.status).to.eql(200)
        cy.wrap({email: email}).as('initialUser')
      })
  //  })
})

Given ('I have logged out and logged in as {string}+{string}', (email, password) => {
  cy.logout()
    .then((response) => {
      cy.loginAPI(email, password)
        .then((response) => {
          expect(response.status).to.eql(200)
        })  
    })
})

Given ('I have logged out and logged in as {string}', (email) => {
  cy.logout()
    .then((response) => {
      cy.loginAPIDefaultPassword(email)
        .then((response) => {
          expect(response.status).to.eql(200)
        })  
    })
})

When ('I login with valid credentials', (dataTable) => {
    let creds = dataTable.hashes()

    cy.get('#loginId').type(creds[0].Email)
    cy.get('#password').type(creds[0].Password)
    cy.get('.btn-primary').click()
})

When ('I login with invalid {string} and {string} combination', (email, password) => {
    cy.get('#loginId').type(email)
    cy.get('#password').type(password)
    cy.get('.btn-primary').click()
})

Then ('I should be logged in successfully', () => {
    cy.getCookie('test.livestock.connect.sid').should('exist')
})

Then ('I should be redirected to the landing page', () => {
    cy.url().should('eq','https://test-monitoring.livestock.datamars.com/en-US/')
})

Then ('I should not be logged in', () => {
    cy.getCookie('fusionauth.sso').should('not.exist')
})

Then ('I should be notified', () => {
    cy.get('.alert').should('be.visible')
})

Then ('I should be kept in the login page', () => {
    cy.url().should('include', 'https://test-account.livestock.datamars.com')
})