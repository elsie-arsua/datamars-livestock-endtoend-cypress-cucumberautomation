@UserAccountManagement
Feature: User account management
Allows user to 
 - edit their details: name, contact details, address, but not email
 - delete their account
 - change their password
 - view a list of farms they have access to
 - un/subscribe to occasional updates for new products, offers, and news

#@P1
#Scenario: User is able to change their name, contact and address
#   Given I am logged in as "john.doe@mailinator.com"+"test1234"
#   And user has account details
#      | firstName | lastName | email                   | password | phone        | region   | country     | updates |
#      | John      | Doe      | john.doe@mailinator.com | test1234 | +64 21123456 | Auckland | New Zealand | no      |
#   When user details is changed
#       | firstName | lastName | phone         | region     | country    |
#       | Johnny    | Doe Jr.  | +64 021123456 | Queensland | Australia  |
#   Then new user details should be reflected  
#
#@P1
#Scenario: User is not able to change their email
#   Given I am logged in as "john.doe@mailinator.com"+"test1234"
#   And user has account details
#      | firstName | lastName | email                   | password | phone        | region   | country     | updates |
#      | John      | Doe      | john.doe@mailinator.com | test1234 | +64 21123456 | Auckland | New Zealand | no      |
#   Then user should not be able to change to a new email "johnny.doe@mailinator.com" 
#
##@P1
##Scenario: User is able to delete their account
#
#@P1
#Scenario: User is able to change their password
#   Given I am logged in as "john.doe@mailinator.com"+"test1234"
#   And user has account details
#      | firstName | lastName | email                   | password | phone        | region   | country     | updates |
#      | John      | Doe      | john.doe@mailinator.com | test1234 | +64 21123456 | Auckland | New Zealand | no      |
#   Then user should be able to change to a new password "test12345"
#
#@P2
#Scenario: User is able to view a list of farms they have access to and their respective access
#   Given I am logged in as "elsie.arsua@datamars.com"+"test1234"
#   Then I should have a list of farms I have access to
#      | farm           | role        |
#      | 270            | FARM_ADMIN  |
#      | Argentina Farm | FARM_MEMBER |
#      | Lars Farm      | FARM_READ   |
#
@P2
Scenario: User is able to subscribe to occasional updates
   Given I am logged in as "elsie.arsua@datamars.com"+"test1234"
   And I am not subscribed to occasional updates
   Then I should be able to subscribe to occasional updates

@P2
Scenario: User is able to unsubscribe to occasional updates
   Given I am logged in as "zz@mailinator.com"+"test1234"
   And I am subscribed to occasional updates
   Then I should be able to unsubscribe to occasional updates
