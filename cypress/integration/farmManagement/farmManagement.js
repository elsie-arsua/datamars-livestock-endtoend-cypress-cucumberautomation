import { Before, After, Given , And , Then , When} from "cypress-cucumber-preprocessor/steps"

Before (() => {
  cy.log('BEFORE EACH @FarmManagement TEST')
  cy.wrap(false).as('isRestoreActiveFarm')
  cy.wrap(false).as('isRestoreUserRoleToFarm')
  cy.wrap(false).as('isRestoreFarmName')
  cy.wrap(false).as('isRestoreRemovedUser')
  cy.wrap(false).as('isDeleteFarm')
})

// NOTE: It is recommended for restores to be in Before hook, but since the following requires
//       user to be logged in, then these are done in After hook.
After (() => {
  cy.log('RESTORE AFTER EACH @FarmManagement TEST')
  // Restore previous active farm if any
  cy.get('@isRestoreActiveFarm')
    .then((restore) => {
      if (restore) {
        cy.get('@initialActiveFarmDetails')
          .then((initialActiveFarmDetails) => {
            if (initialActiveFarmDetails === null) {
              cy.clearActiveFarmAPI()
            }
            else {
              cy.switchToFarmAPI(initialActiveFarmDetails)
            }
            cy.wrap(false).as('isRestoreActiveFarm')    
          })
      }
    })

  // Restore user role if it was changed
  cy.get('@isRestoreUserRoleToFarm')
    .then((restore) => {
      if (restore) {
        cy.get('@oldRole')
          .then((oldRole) => {
            cy.get('@farmMembershipDetails')
              .then((farmMembershipDetails) => {
                cy.changeUserRoleToFarmAPI(farmMembershipDetails, oldRole)
              })  
            cy.wrap(false).as('isRestoreUserRoleToFarm')
          })          
      }
    })
  
  // Restore farm name if it was changed
  cy.get('@isRestoreFarmName')
    .then((restore) => {
      if (restore) {
        cy.get('@activeFarmDetails')
          .then((activeFarmDetails) => {
            cy.get('@oldName')
              .then((oldName) => {
                cy.changeFarmNameAPI(oldName, activeFarmDetails)
                  .then((response) => {
                    // Check that original name is restored
                    cy.getFarmDetailsAPIById(activeFarmDetails.id)
                      .then((response) => {
                        cy.log('DO NOT CONTINUE RUNNING TESTS IF RESTORATION FAILS')
                        expect(response.farmDetails.name).to.eql(oldName)
                        // Farm name is successfully restored
                        cy.wrap(false).as('isRestoreFarmName')
                      })    
                  })
              })  
          })
      }
    })

  cy.get('@isRestoreRemovedUser')
    .then((restore) => {
      if (restore) {
        // Invite the removed user again, so login as the admin
        // Then login as the invited user and accept the invite
        cy.loginAsSuperAdminAPI()
          .then(() => {
            cy.get('@userToRestoreDetails')
              .then((userToRestore) => {
               cy.get('@activeFarmDetails')
                 .then((activeFarmDetails) => {
                   cy.inviteOthersToFarmAPI(userToRestore.email, userToRestore.role, activeFarmDetails)
                     .then((response) => {
                      cy.wrap(response.farmInviteCode).as('farmInviteCode')
                      acceptInviteToFarm(userToRestore, activeFarmDetails)
                     })
                 })                              
              })
          })
      } 
    })

  cy.get('@isDeleteFarm')
    .then((restore) => {
      if (restore) {
        cy.get('@farmToDelete')
          .then((farmToDelete) => {
            cy.deleteFarmAPI(farmToDelete)
          })        
      }      
    })
})

When ('I create a farm {string} successfully', (farmName) => {
  cy.createFarmUI({name: farmName})
    .then((response) => {
      expect(response.status).to.eql(201)
      expect(response.uiMessage).to.include('"' + farmName + '" has been created successfully')
      expect(response.farmDetails.name).to.eql(farmName)
      cy.wrap(response.farmDetails).as('farmToDelete')
      cy.wrap(true).as('isDeleteFarm')
  })
})

When ('I select farm {string}', (farmName) => {
  cy.getActiveFarmAPI()
    .then((response) => {
      expect(response.status).to.be.eql(200)
      cy.wrap(response.activeFarm).as('initialActiveFarmDetails')

      cy.switchToFarmUI(farmName)
        .then((response) => {
          expect(response.status).to.eql(200)
          expect(response.activeFarmName).to.eql(farmName)
          cy.wrap(true).as('isRestoreActiveFarm')
        })
  })
})

When ('I change the name of {string} to {string}', (oldName, newName) => {
  // If we're changing the farm name from the UI, then this farm must
  // be the current farm. In this case we need to get the current active
  // farm so we can restore it later.
  saveActiveFarmThenSwitchFarm(oldName)
    .then((activeFarmDetails) => {
      // Now change the name
      cy.changeFarmNameUI(newName, activeFarmDetails)
        .then((response) => {
          expect(response.status).to.eql(200)
          expect(response.name).to.eql(newName)
        })    
      cy.wrap(oldName).as('oldName')
    })  
})

When ('I delete the farm {string}', (farmName) => {
  // A farm can be deleted thru the UI only if it's the active farm so make it the active farm first.
  // First get the current active farm so it can be restored when the test completes but only if it's not the farm to be deleted. 
  saveActiveFarmThenSwitchFarm(farmName)
    .then((activeFarmDetails) => {
      // Delete the farm thru UI
      cy.deleteFarmUI(activeFarmDetails)
        .then((resp2) => {
          expect(resp2.status).to.eql(200)
          cy.wrap('true').as('recreateFarm')
        })  
            
      // Restore the previous active farm only if it is not the deleted one
      cy.get('@initialActiveFarmDetails')
        .then((initialActiveFarmDetails) => {
          if (initialActiveFarmDetails && initialActiveFarmDetails.name != farmName) {cy.wrap(true).as('isRestoreActiveFarm')}  
              else {cy.wrap(false).as('isRestoreActiveFarm')}  
        })              
    })
})

When ('I change the user {string} role {string} to new role {string} on {string}', (user, oldRole, newRole, farmName) => {
// If we're changing a user's role from the UI, then this farm must
// be the current farm. In this case we need to get the current active
// farm so we can restore it later.
  saveActiveFarmThenSwitchFarm (farmName)
    .then((activeFarmDetails) => {
      // Now change the user's role thru the UI
      cy.log('Change the user\'s role to farm')
      cy.changeUserRoleToFarmUI(user, newRole)
        .then(() => {
          cy.getUserRoleToFarmUI(user)
            .then((displayedRole) => {
              // Save the displayed role for later verification in the Then statement
              cy.wrap(displayedRole).as('displayedRole')
              cy.wrap(true).as('isRestoreUserRoleToFarm')
              cy.wrap(oldRole).as('oldRole')
            })      
        })
    })
})

When ('I invite user {string} with role {string} to the farm {string}', (user, role, farmName) => {
// If we're changing a user's role from the UI, then this farm must
// be the current farm. In this case we need to get the current active
// farm so we can restore it later.
  saveActiveFarmThenSwitchFarm(farmName)
    .then((activeFarmDetails) => {
      // Now invite user(s) to the farm  
      cy.log('Invite user(s) to the farm')
      cy.inviteOthersToFarmUI(user, role, activeFarmDetails)
        .then((response) => {
          if(response.code) {
            // The invite was unsuccessful
            cy.wrap(response.status).as('inviteResultStatus')
            cy.wrap(response.code).as('inviteResultCode')
            cy.wrap(response.message).as('inviteResultMessage')
          }
          else {
            // The invite was successful
            expect(response.status).to.eql(201)
            cy.wrap({email: user, role: role}).as('invitedUser')
          }
        })  
    })
})

When ('I remove the user from farm', () => {
  cy.get('@farmMembershipDetails')
    .then((farmMembershipDetails) => {
      saveActiveFarmThenSwitchFarm(farmMembershipDetails.farm.name)
      .then((activeFarmDetails) => {
        cy.removeUserFromFarmUI(farmMembershipDetails)
          .then((response) => {
            expect(response.status).to.eql(200)
          })        
      })
    })  
})

Then ('{string} should be added to the list of farms', (farmName) => {
  cy.getTopListOfFarmsUI()
    .then((farmsList) => {
        expect(farmsList).to.include(farmName)
    })  
})

Then ('{string} becomes my active farm', (farmName) => {
  cy.getNameActiveFarmUI()
    .then((name) => {
      expect(name).to.eql(farmName)
    })  
})

Then ('active farm should be pre-selected', () => {
  cy.getNameActiveFarmUI()
    .then((name) => {
      cy.get('@initialActiveFarmDetails')
        .then((initialActiveFarmDetails) => {
          expect(name).to.eql(initialActiveFarmDetails.name)          
        })
    })
})

Then ('the {string} should be reflected', (newName) => {
  cy.wrap(true).as('isRestoreFarmName')
  cy.getNameActiveFarmUI()
    .then((name) => {
      expect(name).to.eql(newName)

      // Restore the original farm name
      cy.get('@activeFarmDetails')
        .then((activeFarmDetails) => {
          cy.get('@oldName')
            .then((oldName) => {
              cy.changeFarmNameAPI(oldName, activeFarmDetails)
              .then((response) => {
                expect(response.status).to.eql(200)
                // Check that original name is restored
                cy.getFarmDetailsAPIById(activeFarmDetails.id)
                  .then((response) => {
                    expect(response.farmDetails.name).to.eql(oldName)
                    // Farm name is successfully restored so no need to restore it in AfterEach
                    cy.wrap(false).as('isRestoreFarmName')
                  })    
              })
            })  
        })
    })
})

Then ('I should not be able to edit the {string} name', (farmName) => {
  // Check that the API forbids it
  cy.getFarmDetailsAPIByName(farmName)
    .then((response) => {
      cy.wrap(response.farmDetails).as('activeFarmDetails')
      expect(response.status).to.eql(200)
      cy.changeFarmNameAPI(farmName + ' - NEW', response.farmDetails)  
        .then((response) => {
          expect(response.status).to.eql(403)
        })
    })

  // Check that UI does not provide option
  saveActiveFarmThenSwitchFarm(farmName)
    .then((activeFarmDetails) => {
      cy.isPresentUiToEditFarm()
      .then((response) => {
        expect(response.status).to.eql(false)
      })          
    })
})

Then ('{string} should be removed from my list of farms', (farmName) => {
  cy.getMyFarmsUI()
    .then((farmsList) => {
        expect(farmsList).to.not.include(farmName)
  })  

  cy.get('@recreateFarm')
    .then((recreate) => {
      if (recreate === 'true') {
        cy.get('@activeFarmDetails')
          .then((activeFarmDetails) => {
            cy.createFarmAPI(activeFarmDetails)
          })        
      }
    })
})

Then ('I should not be able to delete the {string}', (farmName) => {
  // Check that the API forbids it
  cy.getFarmDetailsAPIByName(farmName)
    .then((response) => {
      cy.wrap(response.farmDetails).as('activeFarmDetails')
      expect(response.status).to.eql(200)
      cy.deleteFarmAPI(response.farmDetails)  
        .then((response) => {
          expect(response.status).to.eql(403)
        })
    })

  // Check that UI does not provide option
  saveActiveFarmThenSwitchFarm(farmName)
  .then((activeFarmDetails) => {
    cy.isPresentUiToDeleteFarm()
      .then((response) => {
        expect(response.status).to.eql(false)
    })        
  })  
})

Then ('I should not be able to remove others from {string}', (farmName) => {
  cy.getFarmDetailsAPIByName(farmName)
    .then((response) => {
      cy.getUsersToAFarmAPI(response.farmDetails)
        .then((response) => {
          // I should not be able to see the users to the farm
          expect(response.status).to.eql(403)
        })
  })
})

Then ('I should not be able to remove myself from the farm {string}', (farmName) => {
  // Check that the API forbids it
 cy.get('@farmMembershipDetails')
    .then((farmMembershipDetails) => {
      cy.removeUserFromFarmAPI(farmMembershipDetails)
        .then((response) => {
          expect(response.status).to.eql(400)
          expect(response.message).to.eql('Can\'t delete last admin member of this farm')
        })

      cy.removeUserFromFarmAPI(farmMembershipDetails)
        .then((response) => {
          expect(response.status).to.eql(400)
          expect(response.message).to.eql('Can\'t delete last admin member of this farm')
        })
  
      // Check that the UI forbids it too
      saveActiveFarmThenSwitchFarm(farmName)
        .then((activeFarmDetails) => {
          cy.isRemoveUserFromFarmAllowedUI(farmMembershipDetails)
            .then((response) => {
              expect(response.status).to.eql(false)
            })          
        })
    })
})

Then ('I should not be able to invite {string} for {string} to the {string}', (user, role, farmName) => {
  // Check that the API forbids it
  cy.getFarmDetailsAPIByName(farmName)
    .then((response) => {
      cy.wrap(response.farmDetails).as('activeFarmDetails')
      expect(response.status).to.eql(200)
      cy.inviteOthersToFarmAPI(user, role, response.farmDetails)  
        .then((response) => {
          expect(response.status).to.eql(403)
        })
    })

  // Check that UI does not provide option
  // But first needs to make the farm the active farm
  cy.getActiveFarmAPI()
    .then((response) => {
      expect(response.status).to.be.eql(200)
      cy.wrap(response.activeFarm).as('initialActiveFarmDetails')
  })

  cy.get('@activeFarmDetails')
    .then((activeFarmDetails) => {
      cy.switchToFarmAPI(activeFarmDetails)
      .then((response) => {
        expect(response.status).to.eql(200)
        cy.wrap(true).as('isRestoreActiveFarm')
        cy.reload()
      })    
    })
  
  cy.isPresentUiToInviteOthersToFarm()
  .then((response) => {
    expect(response.status).to.eql(false)
  })      
})

Then ('the user {string} new role {string} should be reflected', (user, role) => {
  // Check that new role is persisted
  cy.get('@activeFarmDetails')
    .then((activeFarmDetails) => {
      cy.getUserRoleToFarmAPI(user, activeFarmDetails)
        .then((actualRole) => {
          expect(actualRole).to.eql(role)
        })  

      // Check that new role is displayed in the UI
      cy.log('check new role is displayed in UI')
      cy.get('@displayedRole')
        .then((actualRole) => {      
          expect(actualRole).to.eql(Cypress.env('userRoleToFarmAPIToUI')[role])
        })      
    })
})

Then ('I should not be able to change user {string} role {string} to the farm {string}', (user, role, farmName) => {
  // Check that the API forbids it.
  // Note that if current user has FARM_READ or FARM_MEMBER, then the API that fails 
  //   is the /api/farms/<farmId>/farmMemberships, ie even before getting to the 
  //   PUT /api/farms/<farmId>/farmMemberships/<farmMembershipId>.
  //   And as for the UI, the Settings option is not there.
  cy.getFarmDetailsAPIByName(farmName)
    .then((response) => {
      cy.wrap(response.farmDetails).as('activeFarmDetails')
      cy.getUserFarmMembershipDetails(user, response.farmDetails)
        .then((response) => {
          expect(response.status).to.eql(403)
        })    
    })

  // Check that UI forbids it
  saveActiveFarmThenSwitchFarm(farmName)
    .then((activeFarmDetails) => {
      cy.isSettingsOptionAvailable()
        .then((response) => {
          expect(response.status).to.eql(false)
        })      
    })
})

Then ('I should not be able to change my role to farm {string} to a non-admin role {string}', (farmName, nonAdminRole) => {
  // Check that API forbids it
  cy.getFarmDetailsAPIByName(farmName)
    .then((response) => {
      cy.wrap(response.farmDetails).as('activeFarmDetails')
      cy.get('@userDetails')
        .then((userDetails) => {
          cy.getUserFarmMembershipDetails(userDetails.email, response.farmDetails)
          .then((response) => {
            cy.changeUserRoleToFarmAPI(response.farmMembershipDetails, nonAdminRole)
              .then((response) => {
                expect(response.status).to.eql(400)
                expect(response.code).to.eql('DELETE_LAST_FARM_ADMIN')
                expect(response.message).to.eql('Can\'t delete last admin member of this farm')
              })
          })  
        })
    })

  // Check that UI forbids it
  saveActiveFarmThenSwitchFarm(farmName)
    .then((activeFarmDetails) => {
      cy.get('@farmMembershipDetails')
        .then((farmMembershipDetails) => {
          cy.isChangeRoleToFarmAllowedUI(farmMembershipDetails)      
            .then((response) => {
              expect(response.status).to.eql(false)
            })
        })    
    })
})

Then ('I am required to create a farm', () => {
  cy.url().should('eq',Cypress.env('monitoringWebsite') + '/en-US/setup/setup-your-farm')
})

Then ('I should not be able to cancel the pending invite', () => {
  // Check API does not allow
  cy.log('Check API does not allow cancel of the pending invite')
  cy.get('@farmInviteCode')
    .then((farmInviteCode) => {
      cy.cancelPendingInvite(farmInviteCode)
        .then((response) => {
          expect(response.status).to.eql(403)
          expect(response.code).to.eql('ACCESS_DENIED')
          expect(response.message).to.eql('Access denied')
        })
    })
    
  // Check UI does not allow but first needs to make the farm the active farm
  // We have only the farmMembershipDetails from the previous step. This will do as we need only the name and the ID to switch
  cy.get('@farmMembershipDetails')
    .then((farmMembershipDetails) => {
      saveActiveFarmThenSwitchFarm(farmMembershipDetails.farm.name)
      .then((activeFarmDetails) => {
        cy.log('Check UI does not allow cancel of the pending invite') 
        cy.isCancelPendingInviteAllowedUI()
          .then((response) => {
            expect(response.status).to.eql(false)
          })    
      })  
    })
})

Then ('I should be able to cancel the pending invite', () => {
  cy.get('@farmInviteCode')
    .then((farmInviteCode) => {
      cy.cancelPendingInvite(farmInviteCode)
        .then((response) => {
          expect(response.status).to.eql(200)
        })
    })  
})

Then ('a pending invite should be added for the user', () => {
  cy.get('@invitedUser')
    .then((invitedUser) => {
      cy.get('@activeFarmDetails')
      .then((activeFarmDetails) => {
        cy.hasUserAPendingInviteForRoleToFarm(invitedUser.email, invitedUser.role, activeFarmDetails)
          .then((response) => {
            cy.log('Verify API returns pending invite')                
            expect(response.status).to.eql(200)
            expect(response.hasPendingInviteForRole).to.eql(true)
            
            // It also reflects the pending invite in the UI
            cy.log('Verify UI displays pending invite')
            cy.hasUserAPendingInviteForRoleToFarmUI(invitedUser.email, Cypress.env('userRoleToFarmAPIToUI')[invitedUser.role])
              .then((pendingInvite) => {
                expect(pendingInvite).to.eql(true)
              })
            
            // Now that it's verified, the pending invite can be 
            // cancelled so test passes the next time it runs
            cy.log('Restore - cancel pending invite')
            cy.cancelPendingInvite(response.farmInviteDetails.code)
              .then((response) => {
                expect(response.status).to.eql(200)
              })
          })
      })
    })
})

Then ('the invite should be unsuccessful', () => {
  cy.get('@inviteResultStatus')
    .then((status) => {
      expect(status).to.eql(400)
    })
  
  cy.get('@inviteResultCode')
    .then((code) => {
      expect(code).to.eql('INVITED_USER_ALREADY_FARM_MEMBER')
    })

    cy.get('@inviteResultMessage')
    .then((message) => {
      expect(message).to.eql('Invited user is already farm member')
    })    
})

//Then ('the user {string}+{string} with access {string} should be removed from the farm {string}', (user, password, access, farmName) => {
Then ('the user {string} with access {string} should be removed from the farm {string}', (user, access, farmName) => {
    //cy.wrap(password).as('userToRestorePassword')

  cy.getFarmDetailsAPIByName(farmName)
  .then((response) => {
    cy.wrap(response.farmDetails).as('activeFarmDetails')
  })

  cy.get('@activeFarmDetails')
    .then((activeFarmDetails) => {
      cy.isUserAMemberOfFarm(user, activeFarmDetails)
        .then((response) => {
          expect(response.member).to.eql(false)

          cy.wrap(true).as('isRestoreRemovedUser')
          //cy.wrap({email: user, password: password, role: access}).as('userToRestoreDetails')
          cy.wrap({email: user, role: access}).as('userToRestoreDetails')
        })
    })
})

Then ('I should be able to remove myself from the farm', () => {
  cy.get('@farmMembershipDetails')
    .then((farmMembershipDetails) => {
      // First get farm details for restoring later
      cy.getFarmDetailsAPIByName(farmMembershipDetails.farm.name)
        .then((response) => {
          cy.wrap(response.farmDetails).as('activeFarmDetails')

          cy.removeUserFromFarmAPI(farmMembershipDetails)
            .then((response) => {
              expect(response.status).to.eql(200)
              cy.wrap(true).as('isRestoreRemovedUser')
              cy.wrap({email: farmMembershipDetails.user.email, role: farmMembershipDetails.role}).as('userToRestoreDetails')
            })
        })
    })  
})

And ('I should be able to switch to farm {string}', (farmName) => {
  // First, save the current active farm before switching. This is so we can restore this later.
  saveActiveFarmThenSwitchFarm(farmName)
    .then((activeFarmDetails) => {})
})

And ('I should be an admin of farm {string}', (farmName) => {
  cy.getMyMembershipDetailsToFarmAPI(farmName)
    .then((response) => {
      expect(response.farmMembershipDetails.role).to.be.eql('FARM_ADMIN')
      expect(response.status).to.eql(200)
    })
})

And ('active farm is not {string}', (farmName) => {
  // Clear the active farm
  cy.clearActiveFarmAPI()
    .then((response) => {
      cy.getActiveFarmAPI()
        .then((response2) => {
          expect(response2.activeFarm).to.be.null
        })        
    })
})

And ('I have an active farm', () => {  
  cy.getActiveFarmAPI()
    .then((response) => {
      if(response.activeFarm === null) {
        // No active farm so select the first one
        cy.getMyFarmsAPI()
          .then((response2) => {
            if(response2.farms.length > 0) {
              cy.switchToFarmAPI(response2.farms[0])
                .then(() => {
                  cy.reload()
                })
            }
            else {
              // User has no active farm so create one
              let farmDetails = {}
              let regions = Cypress.env('regionLookup')
              let countries = Cypress.env("countryLookup")
      
              Object.assign(farmDetails, {address: {
                                           country: countries['New Zealand'],
                                           region: regions['Auckland']
                                          },
                                          name: 'Active',
                                          timeZone: 'Pacific/Auckland' 
              })
              cy.createFarmAPI(farmDetails)
                .then((response) => {
                  if(response.status === 201) {
                    Object.assign(farmDetails, {id: response.farmId})
                    cy.log('farmDetails farm ID ' + farmDetails.id)
                    cy.switchToFarmAPI(farmDetails)
                      .then(() => {
                        cy.reload()
                      })    
                  }
                })
            }
          })

      }
      cy.getActiveFarmAPI()
        .then((response3) => {
          expect(response3.status).to.be.eql(200)
          expect(response3.activeFarm.name).to.be.not.null
          cy.wrap(response3.activeFarm).as('initialActiveFarmDetails')    
        })
    })
})

And ('I am an Admin of the active farm', () => {
  cy.getActiveFarmAPI()
    .then((response) => {
      expect(response.status).to.be.eql(200)
      expect(response.activeFarm.role).to.eql('FARM_ADMIN')
      cy.wrap(response.activeFarm).as('initialActiveFarmDetails')
    })
})

And ('I have a role {string} to farm {string}', (role, farmName) => {  
  let details
  cy.getMyDetailsAPI()
    .then((response) => {
      details = response.myDetails
      cy.wrap(response.myDetails).as('userDetails')
  })
  
  
  cy.loginAsSuperAdminAPI()
    .then(() => {
      isUserInFarmWithRoleIfNotAddToFarm(details, farmName, role)
      .then((farmMembershipDetails) => {
        expect(farmMembershipDetails.role).to.eql(role)
        cy.wrap(farmMembershipDetails).as('farmMembershipDetails')
      })   
    })

  cy.get('@userDetails')
    .then((userDetails) => {
      cy.loginAPIDefaultPassword(userDetails.email)
    })
})

And ('I am an Admin of farm {string}', (farmName) => {
  cy.getMyDetailsAPI()
    .then((response) => {
      // Login as super admin and set the user to be Admin if not already
      cy.loginAsSuperAdminAPI()
        .then(() => {
          isUserInFarmWithRoleIfNotAddToFarm(response.myDetails, farmName, 'FARM_ADMIN')
            .then((farmMembershipDetails) => {
              expect(farmMembershipDetails.role).to.eql('FARM_ADMIN')
              cy.wrap(farmMembershipDetails).as('farmMembershipDetails')
            })   
        })
      
      // Re-login as the initial user
      cy.loginAPIDefaultPassword(response.myDetails.email)    
    })    
})

And ('I am the only admin to {string}', (farmName) => {
  let details
  cy.getMyDetailsAPI()
    .then((response) => {
      details = response.myDetails
      cy.wrap(response.myDetails).as('userDetails')
    })

  cy.loginAsSuperAdminAPI()
  cy.getAdminToFarmByName(farmName)
    .then((response2) => {     
      isUserInFarmWithRoleIfNotAddToFarm(details, farmName, "FARM_ADMIN")
       .then((farmMembershipDetails) => {
         expect(farmMembershipDetails.role).to.eql('FARM_ADMIN')
         cy.wrap(farmMembershipDetails).as('farmMembershipDetails')
       })
       // Then change other admins, if there are, to be non-admins
       changeRoleOtherAdminsExceptCurrentUser(details.email, response2)
    })    

  // Re-login as the initial user
  cy.get('@userDetails')
    .then((userDetails) => {
      cy.loginAPIDefaultPassword(userDetails.email)
    })
})

And ('user {string} has role {string} to farm {string}', (user, role, farmName) => {
  // This method should be called from a Given statement. 
  // This sets the user's role to what the scenario requires.
  cy.getFarmDetailsAPIByName(farmName)
    .then((response1) => {
      cy.getUserFarmMembershipDetails(user, response1.farmDetails)
        .then((response2) => {
          cy.wrap(response2.farmMembershipDetails).as('farmMembershipDetails')
          // Change user role to the required role if not already
          cy.getUserRoleToFarmAPI(user, response1.farmDetails)
            .then((actualRole) => {          
              if (actualRole !== role) {
                cy.changeUserRoleToFarmAPI(response2.farmMembershipDetails, role)
                  .then((response3) => {
                    expect(response3.status).to.eql(200)
                  })
                    
                // Confirm that it is the role that the scenario requires
                cy.getUserRoleToFarmAPI(user, response2.farmMembershipDetails.farm).should('eql', role)    
              }
            })
        })
    })
})

And ('I don\'t have any farms', () => {
  cy.getMyFarmsAPI()
    .then((response) => {
      expect(response.farms.length).to.eql(0)
    })
})

And ('I cannot navigate in the website', () => {
  cy.isMainMenuAvailable()
    .then((isAvailable) => {
      expect(isAvailable).to.eql(false)
    })

  cy.goToHomepage()
    .then(() => {
      cy.url().should('eq',Cypress.env('monitoringWebsite') + '/en-US/setup/setup-your-farm')
    })
})

// NOTE This cannot be merged with "When I invite user {string} with role {string} to the farm {string}"
//      because this is a set up method which uses the API, while the "When..." is checking the UI so
//      is using the UI to perform the action.
// TODO This doesn't seem to be used
//And ('I invite user {string} to farm {string} with role {string}', (user, farmName, role) => {
//  cy.getFarmDetailsAPIByName(farmName)
//  .then((response1) => {
//    cy.wrap(response.farmDetails).as('activeFarmDetails')
//    cy.inviteOthersToFarmAPI(user, role, response1.farmDetails)
//      .then((response) => {
//        expect(response.status).to.eql(200)
//        cy.wrap(response.farmInviteCode).as('farmInviteCode')
//      })
//  })  
//})

And ('there is a pending invite for user {string} to farm {string} with role {string}', (user, farmName, role) => {
  // If there is already a pending invite, then grab the invite code. Otherwise create an invite.
  cy.getFarmDetailsAPIByName(farmName)
    .then((response) => {
      cy.wrap(response.farmDetails).as('activeFarmDetails')
      cy.getUserInviteDetailsToFarm(user, role, response.farmDetails, 'NOTIFICATION_SENT', false)
        .then((response) => {
          if(response.farmInviteDetails) {
            // Invite already exists
            cy.log('Invite already exists so just grab the invite code')
            expect(response.status).to.eql(200)
            cy.wrap(response.farmInviteDetails.code).as('farmInviteCode')
          }

          else {
            // Create an invite
            cy.log('Invite does not exist yet so create it')
            cy.get('@activeFarmDetails')
              .then((activeFarmDetails) => {
                cy.inviteOthersToFarmAPI(user, role, activeFarmDetails)
                  .then((response) => {
                    expect(response.status).to.eql(200)
                    cy.wrap(response.farmInviteCode).as('farmInviteCode')
                  })
              })            
          }
        })
    })
})

And ('user {string} is not invited to the farm {string} for role {string} yet', (user, farmName, role) => {
  // Check that user is not in the farm yet or invited to the farm for the role yet  
  cy.getFarmDetailsAPIByName(farmName)
    .then((response) => {
      cy.wrap(response.farmDetails).as('activeFarmDetails')
    })
 
  cy.get('@activeFarmDetails')
    .then((activeFarmDetails) => {
      cy.log('Ensure that user is not in the farm yet')
      cy.isUserAMemberOfFarm(user, activeFarmDetails)
        .then((response) => {
          expect(response.status).to.eql(200)
          if(response.member) {
            cy.removeUserFromFarmAPI(response.farmMembershipDetails)
              .then((response) => {
                cy.log('User already was in the farm so they were removed for test to run')
                expect(response.status).to.eql(200)  
              })
          }
        })

      cy.log('Ensure that user has no pending invite yet')  
      // If there is already a pending invite for the same role for the user, then cancel it
      cy.getUserInviteDetailsToFarm(user, role, activeFarmDetails, 'NOTIFICATION_SENT', false)
        .then((response) => {
          if(response.farmInviteDetails) {
            cy.cancelPendingInvite(response.farmInviteDetails.code)
            .then((response) => {
              cy.log('There was already a pending invite so it was cancelled for test to run')
              expect(response.status).to.eql(200)
            })
          }
        })

      cy.hasUserAPendingInviteForRoleToFarm(user, role, activeFarmDetails)
        .then((response) => {
          expect(response.status).to.eql(200)
          expect(response.hasPendingInviteForRole).to.eql(false)          
        })
    })
})

And ('user {string} already has access {string} to the farm {string}', (user, access, farmName) => {
  cy.getFarmDetailsAPIByName(farmName)
  .then((response) => {
    cy.wrap(response.farmDetails).as('activeFarmDetails')
  })

  cy.getMyDetailsAPI()
    .then((response) => {
      cy.wrap(response.myDetails).as('userDetails')
    })

  cy.loginAsSuperAdminAPI()
    .then(() => {
      isUserInFarmWithRoleIfNotAddToFarm({email: user}, farmName, access)
       .then((farmMembershipDetails) => {
         expect(farmMembershipDetails.role).to.eql(access)
         cy.wrap(farmMembershipDetails).as('farmMembershipDetails')
       })   
    })
  
    // Re-login as the initial user
    cy.get('@userDetails')
      .then((userDetails) => {
        cy.loginAPIDefaultPassword(userDetails.email)
      })
})

And ('farm {string} has another admin user {string}', (farmName, user) => {
  cy.getFarmDetailsAPIByName(farmName)
  .then((response1) => {
    cy.wrap(response1.farmDetails).as('activeFarmDetails')

    cy.getUserFarmMembershipDetails(user, response1.farmDetails)
    .then((response2) => {
      cy.wrap(response2.farmMembershipDetails).as('farmMembershipDetails')
      // Change user role to Admin if not already
      cy.getUserRoleToFarmAPI(user, response1.farmDetails)
        .then((actualRole) => {          
          if (actualRole !== "FARM_ADMIN") {
            cy.changeUserRoleToFarmAPI(response2.farmMembershipDetails, "FARM_ADMIN")
              .then((response3) => {
                expect(response3.status).to.eql(200)
              })
                    
            // Confirm that it is the role that the scenario requires
            cy.getUserRoleToFarmAPI(user, response2.farmMembershipDetails.farm).should('eql', 'FARM_ADMIN')    
          }
        })
    })
  })
})

/**************************************************
  THESE HERE ARE UTILITY FUNCTIONS
**************************************************/

const saveActiveFarmThenSwitchFarm = (farmName) => {
  // This method saves the current active farm then switches the active farm to farmName.
  // This returns farmDetails of the newly active farm.
  cy.log('Save active farm')
  cy.getActiveFarmAPI()
    .then((response) => {
      expect(response.status).to.be.eql(200)
      cy.wrap(response.activeFarm).as('initialActiveFarmDetails')
  })

  cy.log('Get details of farm ' + farmName)
  return cy.getFarmDetailsAPIByName(farmName)
    .then((response1) => {
      cy.wrap(response1.farmDetails).as('activeFarmDetails')
      cy.log('Switch to farm ' + farmName)
      cy.switchToFarmAPI(response1.farmDetails)
        .then((response) => {
          expect(response.status).to.eql(200)          
          cy.wrap(true).as('isRestoreActiveFarm')
          cy.reload()
            .then(() => {return response1.farmDetails})
        })
    })    
}

const isUserInFarmWithRoleIfNotAddToFarm = (userDetails, farmName, role) => {  
  // This method requires that 
  //  - the current logged in user has admin permissions to the farm
  //  - parameters:
  //     - userDetails: object containing the subject user's email
  //     - farmName: string
  //     - role: string
  // This returns the farmMembershipDetails of subject user.
  return cy.getFarmDetailsAPIByName(farmName)
    .then((response) => {      
      cy.isUserAMemberOfFarm(userDetails.email, response.farmDetails)
        .then((response2) => {
          if(response2.member) {
            // Already a member, just ensure the role is as required
            return (setUserToRequiredRole(response2.farmMembershipDetails, role))
          }
          else {
            // User is not in farm yet, check if there is a pending invite
            cy.hasUserAPendingInviteForRoleToFarm(userDetails.email, role, response.farmDetails)
              .then((response3) => {
                if(response3.hasPendingInviteForRole){
                  // Already has a pending invite for role, then just accept it
                  cy.wrap(response3.farmInviteDetails.code).as('farmInviteCode')
                  return (acceptPendingInvite(userDetails, response.farmDetails))
                }

                else {
                  // No pending invite, so invite the user then accept
                  return (inviteUserThenAcceptInvite(userDetails, role, response.farmDetails))
                }
              })
          }
        })
    })
}

const setUserToRequiredRole = (farmMembershipDetails, requiredRole) => {
  // This method requires that the current logged in user has the right permissions to change the roles.
  // Already a member, just ensure the role is as required
  if(farmMembershipDetails.role === requiredRole) {
    cy.wrap(farmMembershipDetails).as('returnFarmMembershipDetails')
  }
  
  else {
    // Role is not as required
    cy.changeUserRoleToFarmAPI(farmMembershipDetails, requiredRole)
      .then(() => {
        Object.assign(farmMembershipDetails, {role: requiredRole})
        cy.wrap(farmMembershipDetails).as('returnFarmMembershipDetails')
      })
  }
  // Then return the user's farm membership details
  return cy.get('@returnFarmMembershipDetails')
    .then((returnFarmMembershipDetails) => {return returnFarmMembershipDetails})
}

const changeRoleOtherAdminsExceptCurrentUser = (userEmail, adminList) => {
  // This method requires that 
  //  - the current logged in user has admin permissions to the farm
  // Go thru each admin and change their role to Member, except the subject user
  return adminList.forEach(admin => {
    if(admin.user.email !== userEmail) {
      cy.changeUserRoleToFarmAPI(admin, "FARM_MEMBER")
        .then((response) => {})
    }
  }) 
}

const inviteUserThenAcceptInvite = (userDetails, role, farmDetails) => {
  // This method requires that 
  //  - the current logged in user has admin permissions to the farm
  // This returns farmMembershipDetails of subject user in userDetails.
  // Invite the subject user and accept the invite
  return cy.inviteOthersToFarmAPI(userDetails.email, role, farmDetails)
           .then((response) => {
             if(response.status === 200) {
               cy.wrap(response.farmInviteCode).as('farmInviteCode')
               acceptInviteToFarm(userDetails, farmDetails)
                .then((response) => {
                  if(response.status === 200) {
                    cy.logout()
                    cy.loginAsSuperAdminAPI()
                      .then(() => {
                        cy.getUserFarmMembershipDetails(userDetails.email, farmDetails)
                        .then((response2) => {
                          return response2.farmMembershipDetails
                        })
                      })      
                   }
                   else {return null}
                })                
             }
             else {return null}
  })   
}

const acceptPendingInvite = (inviteeDetails, farmDetails) => {
  // This method requires that 
  //  - the current logged in user has admin permissions to the farm
  //  - the invitee has a pending invite to the farm
  // This returns farmMembershipDetails of the invitee to the farm
  return acceptInviteToFarm(inviteeDetails, farmDetails)
     .then((response) => {
       if(response.status === 200) {
        cy.logout()
        cy.loginAsSuperAdminAPI()
          .then(() => {
            cy.getUserFarmMembershipDetails(inviteeDetails.email, farmDetails)
            .then((response2) => {
              return response2.farmMembershipDetails
            })
          })      
       }
       else {return null}
     })
}

const acceptInviteToFarm = (inviteeDetails, farmDetails) => {
  // This method requires that the farmInviteCode has been saved earlier.
  // This returns the response to acceptInviteToFarmAPI
  return cy.get('@farmInviteCode')
    .then((farmInviteCode) => {
      cy.log('Accept the invite to farm')
      cy.loginAPIDefaultPassword(inviteeDetails.email)
        .then(() => {
          return (cy.acceptInviteToFarmAPI(farmInviteCode))
        })                
    })
}