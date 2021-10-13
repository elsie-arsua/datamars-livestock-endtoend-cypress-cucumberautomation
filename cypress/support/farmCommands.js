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

Cypress.Commands.add('getFarmDetailsAPIById', (farmID) => {
    cy.request({
        method: 'GET',
        url: 'api/farms/' + farmID,
        headers: {
          'Accept': 'application/json, text/plain, */*',
        }
      })
      .then((response) => {
          return ({status:response.status, farmDetails:response.body})
    })    

})

Cypress.Commands.add('getFarmDetailsAPIByName', (farmName) => {
  cy.getMyFarmsAPI()
    .then((response) => {
      let index = response.farms.findIndex(farm => farm.name === farmName)
      return ({status:response.status, farmDetails:response.farms[index]})
    })
})

Cypress.Commands.add('changeFarmNameAPI', (newFarmName, farmDetails) => {
    cy.request({
        method: 'PUT',
        url: '/api/farms/' + farmDetails.id,
        failOnStatusCode: false,
        headers: {
          'Accept': 'application/json, text/plain, */*',
          'Content-Type': 'application/json'
        },
        body: '{'
            + '"name": "' + newFarmName + '",'
            + '"address": {"region": "' + farmDetails.address.region + '", "country": "' + farmDetails.address.country + '"}'
            +  '}'
        })
        .then((response) => {
            return ({status:response.status})
        })        
})

Cypress.Commands.add('changeFarmNameUI', (newFarmName, farmDetails) => {
  // TODO get /api/farms instead of /me -> need to pass farm ID to url   
  cy.goToFarmSettingsPage()  
    .then(() => {
      cy.get('button:contains(\'Edit farm details\')').click()
        .then(() => {
          cy.get('input[formControlName=name]').clear()
            .type(newFarmName)
          cy.intercept('GET', /\/api\/users\/me$/).as('getMe2')
          cy.get('button:contains(\'Save changes\')').click()
            .then(() => {
              cy.wait('@getMe2')
                .then((interception) => {
                  return ({status:interception.response.statusCode, 
                           name:interception.response.body.activeFarm.name})
                })            
            })
        })
    })
 })

Cypress.Commands.add('deleteFarmAPI', (farmDetails) => {
    cy.request({
        method: 'DELETE',
        failOnStatusCode: false,
        url: 'api/farms/' + farmDetails.id,
        headers: {
          'Accept': 'application/json, text/plain, */*',
        }
      })
      .then((response) => {
        return ({status:response.status})
      })  
})

Cypress.Commands.add('createFarmUI', (farmDetails) => {
  let returnObj = {}
  cy.get('#currentFarmMenuItem').first().click({force:true})    
    .then(() => {
      cy.get('button:contains(\'New farm\')').first().click({force:true})
        .then(() => {
          cy.intercept('POST', '/api/farms').as('postCreateFarm')
          let reg = /\/api\/farms\/[A-Za-z0-9\-]+$/
          cy.intercept('GET', reg).as('getFarm')
          cy.get('input[formcontrolname="name"]').as('newFarmModalInputName').type(farmDetails.name)
          cy.get('button:contains(\'Save farm\')').click()
          })
  })
  cy.wait('@postCreateFarm')
  .then((interception) => {
    Object.assign(returnObj, {status:interception.response.statusCode})
  })

  cy.wait('@getFarm')
    .then((interception) => {
      Object.assign(returnObj, {farmDetails: interception.response.body})
      cy.get('dm-switch-to-farm').then((prompt) => {
        Object.assign(returnObj, {uiMessage:prompt.text()})
      })
      .then(() => {
        cy.get('.btn-close').last().click()
          .then(() => {return returnObj})
      })
  })
})

Cypress.Commands.add('createFarmAPI', (farmDetails) => {
  cy.request({
    method: 'POST',
    failOnStatusCode: false,
    url: '/api/farms/',
    headers: {
      'Accept': 'application/json, text/plain, */*',
      'Content-Type': 'application/json'
    },
    body: '{"address": {"country": "' + farmDetails.address.country + '",'
        +            '"region" : "' + farmDetails.address.region + '"' 
        +           '},'
        + '"name": "' + farmDetails.name + '",'
        + '"timeZone": "' + farmDetails.timeZone + '"'
        + '}'
  })
  .then((response) => {
    if (response.status === 201) {
      return ({status:response.status, farmId: response.headers.location.substring('/farms/'.length)})
    }
    else
    {
      return ({status:response.status,
        code: response.body.code,
        message: response.body.message
       })
    }
  })  
})

Cypress.Commands.add('isPresentUiToEditFarm', () => {
  return cy.isSettingsOptionAvailable()
})

Cypress.Commands.add('deleteFarmUI', (farm) => {
  cy.goToFarmSettingsPage()  
    .then((btn) => {
      cy.get('button:contains(\'Delete farm\')').click()
        .then((element) => {
          cy.intercept('DELETE', '/api/farms/' + farm.id).as('deleteFarm')
          cy.get('dm-lib-confirmation-interaction .modal-body .btn-primary:contains(\'OK\')').click()
            .then((el) => {
              cy.wait('@deleteFarm')
                .then((interception) => {
                  cy.get('dm-farm-deleted .btn-primary').click()
                    .then(() => {
                      return {status:interception.response.statusCode}
                    })                
                })          
            })        
        })      
    })
})

Cypress.Commands.add('isPresentUiToDeleteFarm', () => {
  return cy.isSettingsOptionAvailable()
})

Cypress.Commands.add('isPresentUiToInviteOthersToFarm', () => {
  return cy.isSettingsOptionAvailable()
})

Cypress.Commands.add('isSettingsOptionAvailable', () => {
  cy.document()
    .then((doc) => {
      let isFound = false
      let matches = doc.querySelectorAll('span')     
      matches.forEach(el => {
        if (el.innerText === 'Farm settings') {
          isFound = true
          return
        }
      }) 
      return {status: isFound}  
    })
})

Cypress.Commands.add('isCancelPendingInviteAllowedUI', () => {
  return cy.isSettingsOptionAvailable()
})

Cypress.Commands.add('isMainMenuAvailable', () => {
  cy.document()
    .then((doc) => {
      let isFound = false
      let matches = doc.querySelectorAll('.main-menu-nav')
      if(matches.length > 0)
      {
        isFound = true
      }
      return (isFound)
    })
})

Cypress.Commands.add('isChangeRoleToFarmAllowedUI', (farmMembershipDetails) => {
  // Returns true if it finds one of the radio buttons enabled
  openUserFarmSettings(farmMembershipDetails.user.email)
    .then((el) => {
      cy.get('dm-authorized-to-write input[id="FARM_READ"]').invoke('attr', 'disabled')
        .then((attr) => {
          if(attr === 'disabled') {
            cy.get('dm-authorized-to-write input[id="FARM_MEMBER"]').invoke('attr', 'disabled')
              .then((attr) => {
                if(attr === 'disabled') {
                  cy.get('dm-authorized-to-write input[id="FARM_ADMIN"]').invoke('attr', 'disabled')
                    .then((attr) => {
                      if(attr === 'disabled') {
                        return ({status: false})
                      }
                      else {return ({status: true})}
                    })
                  }
                  else {return ({status: true})}
              })
          }
          else {return ({status: true})}
        })          
    })
})

Cypress.Commands.add('isRemoveUserFromFarmAllowedUI', (farmMembershipDetails) => {
  openUserFarmSettings(farmMembershipDetails.user.email)
    .then(() => {
      cy.get('.card > .card-footer > button:contains(\'Remove myself from the farm\')').invoke('attr', 'disabled')
        .then((attr) => {
          if(attr === 'disabled') {return ({status: false})}
          return ({status: true})
        })
    })
})

Cypress.Commands.add('removeUserFromFarmAPI', (farmMembershipDetails) => {
  cy.request({
    method: 'DELETE',
    failOnStatusCode: false,
    url: '/api/farms/' + farmMembershipDetails.farm.id + '/farmMemberships/' + farmMembershipDetails.id,
    headers: {
      'Accept': 'application/json, text/plain, */*',
    }
  })
  .then((response) => {
    if (response.status === 200)
      return ({status:response.status})
    else
    {
      return ({status:response.status,
        code: response.body.code,
        message: response.body.message
       })
    }
  })  
})

Cypress.Commands.add('removeUserFromFarmUI', (farmMembershipDetails) => {
  cy.intercept('GET', '/api/farms/' + farmMembershipDetails.farm.id + '/invitations?size=1000&sort=createdAt,asc').as('getInvitesToFarm')
  cy.goToFarmSettingsUsersList()
    .then((el) => {
      //cy.goToFarmSettingsUsersList()
      cy.wait('@getInvitesToFarm')
        .then((interception) => {
          cy.get('table > tbody > tr > td > a:contains(\'' + farmMembershipDetails.user.name.fullName + '\')').click()
            .then(() => {
              cy.get('dm-authorized-to-write .card > .card-footer > button:contains(\'Remove user\')').click()
                .then(() => {
                  cy.intercept('DELETE', '/api/farms/' + farmMembershipDetails.farm.id + '/farmMemberships/' + farmMembershipDetails.id).as('deleteUserFromFarm')
                  cy.get('dm-lib-confirmation-interaction button:contains(\'OK\')').click()
                    .then(() => {
                      cy.wait('@deleteUserFromFarm')
                        .then((interception) => {
                          return {status:interception.response.statusCode}
                        })
                    })
                })
            })      
        })
    })  
})

Cypress.Commands.add('getUsersToAFarmAPI', (farmDetails) => {
  cy.request({
    method: 'GET',
    failOnStatusCode: false,
    url: '/api/farms/' + farmDetails.id + '/farmMemberships',
    headers: {
      'Accept': 'application/json, text/plain, */*',
    }
  })
  .then((response) => {
    if (response.status === 200)
    {
      return ({status: response.status,        
               users: response.body.content
             })
    }
    else
    {
      return ({status:response.status,
              code: response.body.code,
              message: response.body.message
             })
    }    
  })  
})

Cypress.Commands.add('isUserAMemberOfFarm', (user, farmDetails) => {
  cy.getUsersToAFarmAPI(farmDetails)
    .then((response) => {
      if (response.status === 200) {
        let farmMembershipDetails = response.users.filter(item => item.user.email === user)
        if (farmMembershipDetails.length > 0) {
          return ({status: response.status, member: true, farmMembershipDetails: farmMembershipDetails[0]})
        }
        else {return ({status: response.status, member: false})}
      }

      else {return response}
    })
})

Cypress.Commands.add('getUserRoleToFarmAPI', (user, farmDetails) => {
  cy.getUsersToAFarmAPI(farmDetails)
    .then((response) => {
      let userMembership = response.users.filter(item => item.user.email === user)
      return (userMembership[0].role)
    })
})

Cypress.Commands.add('getUserRoleToFarmUI', (user) => {
  cy.goToFarmSettingsUsersList()  
    .then(() => {
      cy.get('dm-farm-settings-users table > tbody > tr > td:contains(\'' + user + '\')').siblings().children('dm-enums-general-i18n')
        .then((el) => {
          return (el.text().trim())
        })
    })
})

Cypress.Commands.add('getAdminToFarmByName', (farmName) => {
  cy.getFarmDetailsAPIByName(farmName)
    .then((response) => {
      cy.getAdminToFarm(response.farmDetails)
        .then((adminList) => { return adminList})
    })
})

Cypress.Commands.add('getAdminToFarm', (farmDetails) => {
  let usersList
  cy.getUsersToAFarmAPI(farmDetails)
    .then((response) => {
      usersList = response.users.filter(user => user.role === 'FARM_ADMIN')
      return usersList
  })
})

Cypress.Commands.add('inviteOthersToFarmUI', (user, role, farmDetails) => {
  // TODO should this accept array of users?
  cy.goToFarmSettingsUsersList()  
    .then(() => {
      cy.get('button:contains(\'Invite users to your farm\')').click()
        .then(() => {
          cy.get('input[type="email"]').type(user)
          cy.get('input[value="' + role + '"]').click({force: true})
          cy.intercept('POST', '/api/farms/' + farmDetails.id + '/invitations').as('inviteUsers')
          cy.get('button:contains(\'Send invitations\')').click()
          cy.wait('@inviteUsers')
            .then((interception) => {
              if(interception.response.statusCode === 200) { return ({status:interception.response.statusCode}) }
              else {
                return ({status:interception.response.statusCode, 
                         code: interception.response.body.code,
                         message: interception.response.body.message
                        })
              }
              
            })
        })
    })  

})

Cypress.Commands.add('inviteOthersToFarmAPI', (user, role, farmDetails) => {
  // TODO should this accept array of users?
  cy.request({
    method: 'POST',
    failOnStatusCode: false,
    url: '/api/farms/' + farmDetails.id + '/invitations',
    headers: {
      'Accept': 'application/json, text/plain, */*',
      'Content-Type': 'application/json'
    },
    body: '{"farm": {"id": "' + farmDetails.id + '",'
        +            '"name" : "' + farmDetails.name + '"' 
        +           '},'
        + '"email": "' + user + '",'
        + '"role": "' + role + '"'
        + '}'
  })
  .then((response) => {
    if (response.status === 201) {
      cy.getUserInviteDetailsToFarm(user, role, farmDetails, 'NOTIFICATION_SENT', false)
      .then((response2) => {
        if (response2.status === 200)
        {
          return ({status: response2.status,        
                   farmInviteCode: response2.farmInviteDetails.code
                 })
        }
        else
        {
          return ({status:response2.status,
                  code: response2.body.code,
                  message: response2.body.message
                 })
        }      
      })
    }
    else {
      return ({status:response.status,
        code: response.body.code,
        message: response.body.message
       })
    }
  })  
})

Cypress.Commands.add('getInvitationsToFarmAPI', (farmDetails) => {
  cy.request({
    method: 'GET',
    failOnStatusCode: false,
    url: '/api/farms/' + farmDetails.id + '/invitations?size=1000&sort=createdAt,desc',
    headers: {
      'Accept': 'application/json, text/plain, */*',
    }
  })
  .then((response) => {
    if (response.status === 200)
    {
      return ({status: response.status,        
               invites: response.body.content
             })
    }
    else
    {
      return ({status:response.status,
              code: response.body.code,
              message: response.body.message
             })
    }    
  })
})

Cypress.Commands.add('getUserInviteDetailsToFarm', (user, role, farmDetails, inviteStatus, expired) => {
  cy.getInvitationsToFarmAPI(farmDetails)
    .then((response) => {
      if(response.status === 200)
      {
        let farmInviteDetails = response.invites.filter(item => item.email === user 
                                                        && item.role === role 
                                                        && item.status === inviteStatus 
                                                        && item.expired === expired)
        if (farmInviteDetails.length === 1)                                                      
          return ({status: response.status, farmInviteDetails: farmInviteDetails[0]})
        else
          return ({status: response.status, farmInviteDetails: null})
      }
      else {return (response)}
    })
})

Cypress.Commands.add('hasUserAPendingInviteForRoleToFarm', (user, role, farmDetails) => {
  cy.getInvitationsToFarmAPI(farmDetails)
    .then((response) => {
      if(response.status === 200)
      {
        let farmInviteDetails = response.invites.filter(item => item.email === user 
                                                        && item.role === role 
                                                        && item.status === 'NOTIFICATION_SENT' 
                                                        && item.expired === false)
        if (farmInviteDetails.length === 1)                                                      
          return ({status: response.status, hasPendingInviteForRole: true, farmInviteDetails: farmInviteDetails[0]})
        else
          return ({status: response.status, hasPendingInviteForRole: false, farmInviteDetails: null})
      }
      else {return (response)}
    })
})

Cypress.Commands.add('hasUserAPendingInviteForRoleToFarmUI', (user, role) => {
  cy.goToFarmSettingsUsersList()  
    .then(() => {
      let isFound = false
      cy.get('dm-user-invitations tbody > tr:contains(\'' + user + ' ' + role + '\')')
        .each((row, index) => {
          if(row.text().includes('Pending')) {
            // There is a pending invite for the role for the user
            isFound = true
          }
        })
        .then(() => {
          // There is no pending invite for the role for the user
          return isFound
        })  
    })
})

Cypress.Commands.add('cancelPendingInvite', (farmInviteCode) => {
  cy.request({
    method: 'POST',
    failOnStatusCode: false,
    url: '/api/invitations/' + farmInviteCode + '/cancel',
    headers: {
      'Accept': 'application/json, text/plain, */*',
      'Content-Type': 'application/json'
    },
    body: '{}'
  })
  .then((response) => {
    if (response.status === 200)
    {
      return ({status: response.status,        
               users: response.body.content
             })
    }
    else
    {
      return ({status:response.status,
              code: response.body.code,
              message: response.body.message
             })
    }    
  })  
})

Cypress.Commands.add('changeUserRoleToFarmUI', (user, newRole) => {
  openUserFarmSettings(user)
    .then(() => {
      cy.intercept('GET','/farmMemberships').as('getFarmMemberships')          
      cy.get('dm-authorized-to-write > div > input[id=\''+ newRole +'\']').click({force:true})
        .then((el) => {
          cy.get('.modal-content button:contains(\'Done\')').click()
            .then((el) => {
              //cy.waitUntil(() => cy.get('dm-lib-select[controlname="country"] div .ng-value>span').then(value => value.text().trim().length>0))              
              cy.waitUntil(() => cy.getUserRoleToFarmUI(user).then(displayedRole => displayedRole === Cypress.env('userRoleToFarmAPIToUI')[newRole]))
            })  
        })
    })
})

Cypress.Commands.add('changeUserRoleToFarmAPI', (farmMembershipDetails, newRole) => {
  cy.request({
    method: 'PUT',
    failOnStatusCode: false,
    url: '/api/farms/' + farmMembershipDetails.farm.id + '/farmMemberships/' + farmMembershipDetails.id,
    headers: {
      'Accept': 'application/json, text/plain, */*',
      'Content-Type': 'application/json'
    },
    body: '{"user": {"id": "' + farmMembershipDetails.user.id + '"},'
        + '"role": "' + newRole + '",'
        + '"id": "' + farmMembershipDetails.id + '"'
        + '}'
  })
  .then((response) => {
    if (response.status === 200)
    {
      return ({status: response.status,        
               users: response.body.content
             })
    }
    else
    {
      return ({status:response.status,
              code: response.body.code,
              message: response.body.message
             })
    }    
  })  
})

Cypress.Commands.add('getUserFarmMembershipDetails', (user, farmDetails) => {
  cy.getUsersToAFarmAPI(farmDetails)
    .then((response) => {
      if(response.status === 200)
      {
        let farmMembershipDetails = response.users.filter(item => item.user.email === user)
        return ({status: response.status, farmMembershipDetails: farmMembershipDetails[0]})
      }
      else {return (response)}
    })
})

Cypress.Commands.add('acceptInviteToFarmAPI', (farmInviteCode) => {
  cy.request({
    method: 'POST',
    failOnStatusCode: false,
    url: '/api/invitations/' + farmInviteCode + '/accept/',
    headers: {
      'Accept': 'application/json, text/plain, */*',
      'Content-Type': 'application/json'
    },
    body: '{}'
  })
  .then((response) => {
    if (response.status === 200)
    {
      return ({status: response.status,        
               users: response.body.content
             })
    }
    else
    {
      return ({status:response.status,
              code: response.body.code,
              message: response.body.message
             })
    }    
  })    
})

const openUserFarmSettings = (user) => {
  return cy.goToFarmSettingsUsersList()  
           .then(() => {
             cy.get('dm-farm-settings-users>.card table > tbody > tr > td:contains(\'' + user + '\')').siblings().children('a').click()
           })
}