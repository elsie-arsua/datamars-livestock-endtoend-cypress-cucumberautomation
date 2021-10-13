import { Before, After, Given , And , Then , When} from "cypress-cucumber-preprocessor/steps"

Before(() => {
  cy.log('BEFORE EACH @UserAccountManagement TEST')
  cy.wrap(false).as('restoreUserDetails')
  cy.wrap(false).as('restorePassword')
})

After(() => {
  cy.log('RESTORE AFTER EACH @UserAccountManagement TEST')
    // Restore user details if changed
  cy.get('@restoreUserDetails')
    .then((restoreUserDetails) => {
      if(restoreUserDetails){
        cy.get('@initialUserDetails')
          .then((initialUserDetails) => {
            cy.changeUserDetailsUI(initialUserDetails)
          })
      }
    })

  cy.get('@restorePassword')
    .then((restorePassword) => {
      if(restorePassword){
        cy.get('@initialUserDetails')
          .then((initialUserDetails) => {
            cy.get('@passwords')
              .then((passwords) => {
                // Need to login first since changing password auto forces a logout
                cy.loginAPI(initialUserDetails.email, passwords.currentPassword)
                  .then(() => {
                    cy.changePasswordUI(passwords.currentPassword, passwords.initialPassword)
                      .its('status').should('eq',200)
                  })                
              })            
          })
      }
    })
})

Given('user has account details', (dataTable) => {
    let userDetails = dataTable.hashes()

    cy.wrap(userDetails[0]).as('initialUserDetails')
    cy.getMyDetailsAPI()
      .then((response) => {
        let regions = Cypress.env('regionLookup')
        let countries = Cypress.env("countryLookup")
        let marketingUpdates = Cypress.env("marketingUpdates")

          expect(response.status).to.eql(200)
          expect(response.myDetails.name.firstName).to.eql(userDetails[0].firstName)
          expect(response.myDetails.name.lastName).to.eql(userDetails[0].lastName)
          expect(response.myDetails.email).to.eql(userDetails[0].email)
          expect(response.myDetails.phone).to.eql(userDetails[0].phone)
          expect(response.myDetails.address.region).to.eql(regions[userDetails[0].region])
          expect(response.myDetails.address.country).to.eql(countries[userDetails[0].country])
          expect(response.myDetails.marketingAgreed).to.eql(marketingUpdates[userDetails[0].updates])
      })
})

And('I am not subscribed to occasional updates', () => {
  cy.unsubscribeOccasionalUpdatesAPI()
    .then(() => {
      cy.getMyDetailsAPI().its('myDetails.marketingAgreed').should('be.false')
    })
})

And('I am subscribed to occasional updates', () => {
  cy.subscribeOccasionalUpdatesAPI()
    .then(() => {
      cy.getMyDetailsAPI().its('myDetails.marketingAgreed').should('be.true')
    })
})

When('user details is changed', (dataTable) => {
    let newUserDetails = dataTable.hashes()

    cy.wrap(newUserDetails[0]).as('newUserDetails')
    cy.changeUserDetailsUI(newUserDetails[0])
      .then((response) => {
          expect(response.status).to.eql(200)
      })
})

Then('new user details should be reflected', () => {
    cy.get('@newUserDetails')
      .then((newUserDetails) => {
        cy.getMyDetailsAPI()
          .then((response) => {
            let regions = Cypress.env('regionLookup')
            let countries = Cypress.env("countryLookup")

            expect(response.status).to.eql(200)
            expect(response.myDetails.name.firstName).to.eql(newUserDetails.firstName)
            expect(response.myDetails.name.lastName).to.eql(newUserDetails.lastName)
            expect(response.myDetails.phone).to.eql(newUserDetails.phone)
            expect(response.myDetails.address.region).to.eql(regions[newUserDetails.region])
            expect(response.myDetails.address.country).to.eql(countries[newUserDetails.country])
         })
         
        // Check UI reflects new user details
        cy.getMyDetailsUI()
          .then((response) => {
            expect(response.firstName).to.eql(newUserDetails.firstName)
            expect(response.lastName).to.eql(newUserDetails.lastName)
            expect(response.phone).to.eql(newUserDetails.phone)
            expect(response.country).to.eql(newUserDetails.country)
            expect(response.region).to.eql(newUserDetails.region)
          }) 
      })

    // Restore the original user details
    cy.wrap(true).as('restoreUserDetails')
})

Then('user should not be able to change to a new email {string}', (newEmail) => {
  // Check API forbids it
  cy.get('@initialUserDetails')
    .then((initialUserDetails) => {
      cy.changeUserEmailAPI(initialUserDetails, newEmail)
        .then((response) => {
          expect(response.status).to.eql(500)
        })
    })

  // Check UI forbids it too
  cy.isAllowedChangeEmailUI().its('status').should('eq', false)  
})

Then('user should be able to change to a new password {string}', (newPassword) => {
  cy.get('@initialUserDetails')
    .then((initialUserDetails) => {
      cy.changePasswordUI(initialUserDetails.password, newPassword)
        .then((response) => {
          expect(response.status).to.eql(200)
          // Verify that user is logged out too
          cy.waitUntil(() => cy.url().then(url => url.startsWith(Cypress.env('fusionAuthApplication'))))
          cy.isLoggedOut().its('status').should('eq', true)
          
          // Restore the original password
          cy.wrap(true).as('restorePassword')
          cy.wrap({currentPassword: newPassword, initialPassword: initialUserDetails.password}).as('passwords')
        })
    })        
})

Then('I should be able to subscribe to occasional updates', () => {
  cy.subscribeOccasionalUpdates()
    .then((response) => {
      expect(response.status).to.eql(200)
      cy.getMyDetailsAPI().its('myDetails.marketingAgreed').should('be.true')
    })
})

Then('I should be able to unsubscribe to occasional updates', () => {
  cy.unsubscribeOccasionalUpdates()
    .then((response) => {
      expect(response.status).to.eql(200)
      cy.getMyDetailsAPI().its('myDetails.marketingAgreed').should('be.false')
    })
})

Then('I should have a list of farms I have access to', (dataTable) => {
  let farmsAccess = dataTable.hashes()
  cy.isMyFarmsDisplayed().its('status').should('be.true')
  farmsAccess.forEach(item => {
    cy.isFarmInMyFarmsUI(item.farm).should('be.true')
    cy.getMyAccessToFarmUI(item.farm).should('eq', Cypress.env('userRoleToFarmAPIToUI')[item.role])
  })
})
