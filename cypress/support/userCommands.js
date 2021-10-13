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

import 'cypress-wait-until'

Cypress.Commands.add('getActiveFarmAPI', () => {
    let returnObj = {}    
    cy.request({
        method: 'GET',
        url: '/api/users/me',
        headers: {
          'Accept': 'application/json, text/plain, */*',
        }
      })
      .then((response) => {
        returnObj = Object.assign(returnObj, {status:response.status})
        if (response.body.activeFarm)
        {
            cy.getFarmDetailsAPIById(response.body.activeFarm.id)
              .then((response) => {
                Object.assign(returnObj, {activeFarm:response.farmDetails})
                return returnObj
              })                   
        }
        else {
            Object.assign(returnObj, {activeFarm:null})
            return returnObj
        }
      })    
})

Cypress.Commands.add('getMyFarmsUI', () => {
  let farmsList = []
  cy.goToMyFarms()
    .then(() => {
        cy.get('dm-my-farm-memberships table>tbody>tr')
          .find('td>a')
          .each((el, index, list) => {
            farmsList.push(el.text().trim())
          })
          .then(() => {
            return farmsList
          })
    })
})

Cypress.Commands.add('getMyFarmsAPI', () => {
  cy.request({
      method: 'GET',
      url: 'api/users/me/farms?size=1000',
      headers: {
        'Accept': 'application/json, text/plain, */*',
      }
    })
    .then((response) => {
        return ({status:response.status, farms:response.body.content})
  })    
})

Cypress.Commands.add('getMyMembershipDetailsToFarmAPI', (farmName) => {
    cy.request({
        method: 'GET',
        url: 'api/users/me/farmMemberships?size=1000',
        headers: {
          'Accept': 'application/json, text/plain, */*',
        }
      })
      .then((response) => {
          let index = response.body.content.findIndex(el => el.farm.name === farmName)
          return ({status:response.status, farmMembershipDetails:response.body.content[index]})
      })    
})

Cypress.Commands.add('isMyFarmsDisplayed', () => {
  cy.goToMyFarms()
    .then(() => {
      cy.get('dm-my-farm-memberships')
        .then((el) => {
          if(el.is(':visible')) {
            return ({status: true})
          }
          else {return ({status: false})}
        })
    })
})

Cypress.Commands.add('isFarmInMyFarmsUI', (farmName) => {
  cy.goToMyFarms()
    .then(() => { 
      cy.get('dm-my-farm-memberships table>tr>td').find('a').contains(farmName)
        .then((el) => {
          if(el) {
            // farm is found
            return (true)
          }
          return (false)
        })
    })
})

Cypress.Commands.add('getMyAccessToFarmUI', (farmName) => {
  cy.goToMyFarms()
    .then(() => {
      cy.get('dm-my-farm-memberships table>tr>td').find('a').contains(farmName).parent().siblings()      
        .then((el) => {
          return (el.text().trim())
        })
    }) 
})

Cypress.Commands.add('getNameActiveFarmUI', () => {
    cy.get('#currentFarmMenuItem')
      .then((farm) => {return farm.text()})
})

Cypress.Commands.add('switchToFarmUI', (farmName) => {
    // Do an intercept here to wait for the page to reload
    cy.intercept('GET', /\/api\/users\/me$/).as('getMe')
    cy.get('#currentFarmMenuItem').first().click({force:true})
      .then(() => {
        cy.get('.dropdown-menu>.dropdown-item:contains(\'' + farmName + '\')').first().click({force: true})
          .then(() => {})
    })  
    cy.wait('@getMe')
      .then((interception) => {
        return ({status:interception.response.statusCode, activeFarmName:interception.response.body.activeFarm.name, activeFarmId:interception.response.body.activeFarm.id})
    })
})

Cypress.Commands.add('switchToFarmAPI', (requestBody) => {
//    cy.request({
//        method: 'PUT',
//        url: '/api/users/me/activeFarm',
//        headers: {
//          'Accept': 'application/json, text/plain, */*',
//          'Content-Type': 'application/json'
//        },
//        body: '{"activeFarm": {"id": "' + requestBody.id + '",' + '"name": "' + requestBody.name + '"}}'
//      })
//      .then((response) => {
//        return ({status:response.status})
//      })

      cy.request({
        method: 'PATCH',
        url: '/api/users/me',
        headers: {
          'Accept': 'application/json, text/plain, */*',
          'Content-Type': 'application/json'
        },
        body: '{"activeFarm": {"id": "' + requestBody.id + '",' + '"name": "' + requestBody.name + '"}}'
      })
      .then((response) => {
        return ({status:response.status})
      })

})

Cypress.Commands.add('clearActiveFarmAPI', () => {
    cy.request({
        method: 'PATCH',
        url: '/api/users/me',
        headers: {
          'Accept': 'application/json, text/plain, */*',
          'Content-Type': 'application/json'
        },
        body: '{"activeFarm": {"id": null}}'
      })
      .then((response) => {
        return ({status:response.status})
      })
})

Cypress.Commands.add('getTopListOfFarmsUI', () => {
  let farmsList = []

  cy.intercept('GET', '/api/users/me/farms?page=0&size=5&sort=name,asc').as('getMyFarms')
  cy.get('#currentFarmMenuItem').click({force: true})
  cy.wait('@getMyFarms')    
    .then(() => {
      cy.get('dm-farm-menu > .dropdown > .dropdown-menu > .dropdown-item')
        .each((el, index, list) => {
            if(el.text() != 'New farm') {
             farmsList.push(el.text())
          }
        })
        .then(() => {
          return farmsList
        })  
     })
})

Cypress.Commands.add('getMyDetailsAPI', () => {
  cy.request({
    method: 'GET',
    url: 'api/users/me',
    headers: {
      'Accept': 'application/json, text/plain, */*',
    }
  })
  .then((response) => {
    return ({status: response.status, myDetails:response.body})
  })  
})

Cypress.Commands.add('changeUserDetailsUI', (newUserDetails) => {
  cy.intercept('PUT', 'api/users/me').as('updateUserDetails')
  cy.goToAccountSettingsPage()
    .then(() => {
      if(newUserDetails.firstName) {cy.get('input[formControlName="firstName"]').clear().type(newUserDetails.firstName)}
      if(newUserDetails.lastName) {cy.get('input[formControlName="lastName"]').clear().type(newUserDetails.lastName)}
      if(newUserDetails.phone) {cy.get('input[formControlName="phone"]').clear().type(newUserDetails.phone)}
      if(newUserDetails.country) {
        cy.get('dm-lib-select[controlname="country"] input').click().type(newUserDetails.country)
          .then(() => {
            cy.get('[role="option"]:contains(\'' + newUserDetails.country + '\')').click()
              .then(() => {
                cy.get('dm-lib-select[controlname="region"]').click().type(newUserDetails.region)
                  .within(() => {
                    cy.get('[role="option"]:contains(\'' + newUserDetails.region + '\')').click()
                  })
              })
          })
      }
      
      cy.get('button:contains(\'Save changes\')').click()
      cy.wait('@updateUserDetails')
        .then((interception) => {
          return ({status:interception.response.statusCode})
        })
    })
})

// TODO this is not executing successfully - returning 401
Cypress.Commands.add('changeUserDetailsAPI', (userDetails) => {
  let regions = Cypress.env('regionLookup')
  let countries = Cypress.env("countryLookup")
  let marketingUpdates = Cypress.env("marketingUpdates")

  cy.request({
    method: 'PUT',
    url: Cypress.env('myAccountApplication') + '/api/users/me',
    failOnStatusCode: false,
    headers: {
      'Accept': 'application/json, text/plain, */*',
      'Content-Type': 'application/json'
    },
    body: '{"address": {"country": "' + countries[userDetails.country] + '", "region": "' + regions[userDetails.region] + '"},'
        + '"name": {"firstName": "' + userDetails.firstName + '", "lastName": "' + userDetails.lastName + '"},'
        + '"phone": "' + userDetails.phone + '"'
        + '}'

  })
  .then((response) => {
    return ({status: response.status, myDetails:response.body})
  })  
})

Cypress.Commands.add('changeUserEmailAPI', (userDetails, newEmail) => {
  let regions = Cypress.env('regionLookup')
  let countries = Cypress.env("countryLookup")

  cy.request({
    method: 'PUT',
    url: Cypress.env('myAccountApplication') + '/api/users/me',
    failOnStatusCode: false,
    headers: {
      'Accept': 'application/json, text/plain, */*',
      'Content-Type': 'application/json'
    },
    body: '{"address": {"country": "' + countries[userDetails.country] + '", "region": "' + regions[userDetails.region] + '"},'
        + '"name": {"firstName": "' + userDetails.firstName + '", "lastName": "' + userDetails.lastName + '"},'
        + '"phone": "' + userDetails.phone + '",'
        + '"email": "' + newEmail + '"'
        + '}'

  })
  .then((response) => {
    return ({status: response.status, myDetails:response.body})
  })
})  

Cypress.Commands.add('getMyDetailsUI', () => {
  cy.goToAccountSettingsPage()
    .then(() => {
      let returnObj = {}
      cy.get('input[formControlName="firstName"]').invoke('val')
        .then((fName) => {
          Object.assign(returnObj, {firstName: fName})
          cy.get('input[formControlName="lastName"]').invoke('val')
            .then((lName) => {
              Object.assign(returnObj, {lastName: lName})
              cy.get('input[formControlName="phone"]').invoke('val')
                .then((phone) => {
                  Object.assign(returnObj, {phone: phone})
                  cy.waitUntil(() => cy.get('dm-lib-select[controlname="country"] div .ng-value>span').then(value => value.text().trim().length>0))
                    .then(() => {
                      cy.get('dm-lib-select[controlname="country"] div .ng-value>span')
                      .then((country) => {
                        Object.assign(returnObj, {country: country.text().trim()})
                        cy.get('dm-lib-select[controlname="region"] div .ng-value>span')
                          .then((region) => {
                            Object.assign(returnObj, {region: region.text().trim()})
                            return returnObj
                          })
                      })  
                    })
                })
            })
        })
    })
})

Cypress.Commands.add('isAllowedChangeEmailUI', () => {
  cy.goToAccountSettingsPage()
    .then(() => {
      cy.get('input[formcontrolname="email"]').invoke('attr', 'disabled')
        .then((attr) => {
          if(attr === 'disabled') {
            return ({status: false})
          }
          else {return ({status: true})}
        })
    })
})

Cypress.Commands.add('changePasswordUI', (currentPassword, newPassword) => {
  cy.intercept('PUT', 'api/users/me/changePassword').as('changePassword')
  cy.goToSecurityPage()
    .then(() => {
      cy.get('input[formcontrolname="currentPassword"]').type(currentPassword)
      cy.get('input[formcontrolname="newPassword"]').type(newPassword)
      cy.get('input[formcontrolname="confirmNewPassword"]').type(newPassword)

      cy.get('button:contains(\'Change password\')').click()
      cy.wait('@changePassword')
        .then((interception) => {
          return ({status:interception.response.statusCode})
        })
    })
})

// TODO This is returning 401
Cypress.Commands.add('changePasswordAPI', (userDetails, currentPassword, newPassword) => {
  cy.request({
    method: 'PUT',
    url: Cypress.env('myAccountApplication') + '/api/users/me/changePassword',
    failOnStatusCode: false,
    headers: {
      'Accept': 'application/json, text/plain, */*',
      'Content-Type': 'application/json'
    },
    body: '{"currentPassword": "' + currentPassword + '",'
        + '"email": "' + userDetails.email + '",'
        + '"newPassword": "' + newPassword + '"'
        + '}'

  })
  .then((response) => {
    return ({status: response.status, myDetails:response.body})
  })
})

Cypress.Commands.add('subscribeOccasionalUpdates', () => {
  cy.intercept('PATCH', 'api/users/me').as('subscribeUpdates')
  cy.goToAccountSettingsPage()
    .then(() => {
      cy.get('label[for="marketingAgreed"]').click()
        .then(() => {
          cy.get('button:contains(\'Save changes\')').click()
        })

      cy.wait('@subscribeUpdates')
        .then((interception) => {
          return ({status:interception.response.statusCode})
        })
    })
})

Cypress.Commands.add('unsubscribeOccasionalUpdates', () => {
  cy.intercept('PATCH', 'api/users/me').as('subscribeUpdates')
  cy.goToAccountSettingsPage()
    .then(() => {
      cy.get('label[for="marketingAgreed"]').click()
        .then(() => {
          cy.get('button:contains(\'Save changes\')').click()
        })

      cy.wait('@subscribeUpdates')
        .then((interception) => {
          return ({status:interception.response.statusCode})
        })
    })
})

Cypress.Commands.add('subscribeOccasionalUpdatesAPI', () => {  
  cy.request({
    method: 'PATCH',
    url: '/api/users/me',
    failOnStatusCode: false,
    headers: {
      'Accept': 'application/json, text/plain, */*',
      'Content-Type': 'application/json'
    },
    body: '{"marketingAgreed": true}'

  })
  .then((response) => {
    return ({status: response.status})
  })
})

Cypress.Commands.add('unsubscribeOccasionalUpdatesAPI', () => {  
  cy.request({
    method: 'PATCH',
    url: '/api/users/me',
    failOnStatusCode: false,
    headers: {
      'Accept': 'application/json, text/plain, */*',
      'Content-Type': 'application/json'
    },
    body: '{"marketingAgreed": false}'

  })
  .then((response) => {
    return ({status: response.status})
  })
})