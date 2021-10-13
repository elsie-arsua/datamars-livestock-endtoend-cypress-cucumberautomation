@Login
Feature: Login
I want to login to the activity monitoring website

@P1
Scenario: Successful login
    Given I am on the login page
    When I login with valid credentials
        | Email                    | Password |
        | elsie.arsua@datamars.com | test1234 |
    Then I should be logged in successfully
    And I should be redirected to the landing page

@P1
Scenario Outline: Unsuccessful login
    Given I am on the login page
    When I login with invalid <Email> and <Password> combination
    Then I should not be logged in
    And I should be notified
    And I should be kept in the login page

    Examples:
        | Email                      | Password   |
        | "elsie@datamars.com"       | "test1234" |
        | "elsie.arsua@datamars.com" | "test1235" |

