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

Cypress.Commands.add('loginUI', (email, password) => {
    cy.intercept(RegExp('^' + Cypress.env('fusionAuthApplication'))).as('loginPage')
    cy.intercept(RegExp(Cypress.env('monitoringWebsite'))).as('homePage')
    cy.visit(Cypress.env('monitoringWebsite'))
    cy.wait('@loginPage')
      .then(() => {
        cy.get('#loginId').type(email)
        cy.get('#password').type(password)
        cy.get('.btn-primary').click()
          .then(() => {
            cy.wait('@homePage')
              .then(() => {})
          })
    })      
})

Cypress.Commands.add('loginAPI', (email, password) => {
    const options = {
        method: 'POST',
        url: Cypress.env('sso').url,
        form: true,
        body: {
          loginId: email,
          password: password,
          response_type: Cypress.env('sso').responseType,
          scope: Cypress.env('sso').scope,
          client_id:Cypress.env('sso').clientId,
          tenantId: Cypress.env('sso').tenantId,
          timezone: Cypress.env('sso').timezone,
          redirect_uri: Cypress.env('sso').redirectUri 
        },
      }
  
    cy.request(options)
      .then((response) => {
        cy.visit(Cypress.env('monitoringWebsite'))
          .then(() => {
            return ({status:response.status})
          })                  
    })
})

Cypress.Commands.add('loginAPIDefaultPassword', (email) => {
  const options = {
      method: 'POST',
      url: Cypress.env('sso').url,
      form: true,
      body: {
        loginId: email,
        password:  Cypress.env('userPassword'),
        response_type: Cypress.env('sso').responseType,
        scope: Cypress.env('sso').scope,
        client_id:Cypress.env('sso').clientId,
        tenantId: Cypress.env('sso').tenantId,
        timezone: Cypress.env('sso').timezone,
        redirect_uri: Cypress.env('sso').redirectUri 
      },
    }

  cy.logout()
    .then(() => {
      cy.request(options)
        .then((response) => {
          cy.visit(Cypress.env('monitoringWebsite'))
            .then(() => {
              return ({status:response.status})
            })                  
        })  
    })
})

Cypress.Commands.add('logoutUI', () => {
    cy.intercept(RegExp('^' + Cypress.env('fusionAuthApplication'))).as('loginPage')

    cy.get('.user-menu').click({force: true})
      .then(() => {
        cy.get('button:contains(\'Logout\')').click({force: true})
        cy.wait('@loginPage')
          .then(() => {}) 
    })      
})

Cypress.Commands.add('loginAsSuperAdminAPI', () => {
  return cy.loginAPI(Cypress.env('superAdmin').email, Cypress.env('superAdmin').password)
})

Cypress.Commands.add('logout', () => {
    cy.visit(Cypress.env('monitoringWebsite'))  
      .then(() => {
        cy.clearCookies()
    })
    cy.visit(Cypress.env('fusionAuthApplication'))
      .then(() => {
        cy.clearCookies()
    })
})

Cypress.Commands.add('isLoggedOut', () => {
  cy.visit(Cypress.env('fusionAuthApplication'))
    .then(() => {
      cy.getCookie('fusionauth.sso')
        .then((cookie) => {
          if(cookie) {return ({status: false})}
          else {return ({status: true})}
        })
    })
})