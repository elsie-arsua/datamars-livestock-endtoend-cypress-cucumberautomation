@FarmManagement
Feature: Farm Management
Allows user to create a farm, delete a farm, edit a farm according to their role permissions.
Any user can create a farm and they are automatically assigned an Admin role.
Only Admin-role users can edit or delete a farm.
Only Admin-role users can invite other users to the farm; or change users' role to the farm.
A user can no longer be invited if they already have access to the farm
If user has no access to any farm yet, then they cannot use the website until they create a farm.
Any user of a farm can remove themselves from it.

@P1
Scenario: Successful farm creation
    Given I am logged in as "john.walker@mailinator.com"
    When I create a farm "Farm 1" successfully
    Then "Farm 1" should be added to the list of farms
    And I should be an admin of farm "Farm 1"
    And I should be able to switch to farm "Farm 1"

@P1
Scenario: The selected farm is persisted as the active farm
    Given I am logged in as "john.walker@mailinator.com"
    And active farm is not "Dawsons"
    When I select farm "Dawsons"
    Then "Dawsons" becomes my active farm
    
@P1
Scenario: The active farm is always pre-selected
    Given I am logged in as "elsie.arsua@datamars.com"
    And I have an active farm
    Then active farm should be pre-selected

@P2
Scenario Outline: Admin can edit a farm
    Given I am logged in as "elsie.arsua@datamars.com"
    And I am an Admin of farm <farm>
    When I change the name of <farm> to <new name>
    Then the <new name> should be reflected

    Examples:
       | farm  | new name      |
       | "270" | "Two Seventy" |
  
@P1
Scenario Outline: Member or Viewer cannot edit a farm
    Given I am logged in as "elsie.arsua@datamars.com"
    And I have a role <read access> to farm <farm>
    Then I should not be able to edit the <farm> name

    Examples:
       | farm             | read access   |
       | "Bonetti PlanA"  | "FARM_READ"   |
       | "Argentina Farm" | "FARM_MEMBER" |
    
@P2
Scenario: Admin can delete a farm
    Given I am logged in as "john.walker@mailinator.com"
    And I am an Admin of farm "Farm to Delete"
    When I delete the farm "Farm to Delete"
    Then "Farm to Delete" should be removed from my list of farms

@P1
Scenario Outline: Member or Viewer cannot delete a farm
    Given I am logged in as "elsie.arsua@datamars.com"
    And I have a role <read access> to farm <farm>
    Then I should not be able to delete the <farm>

    Examples:
       | farm             | read access   |
       | "Bonetti PlanA"  | "FARM_READ"   |
       | "Argentina Farm" | "FARM_MEMBER" |

@P1
Scenario Outline: Admin can remove a user from farm
    Given I am logged in as "elsie.arsua@datamars.com"
    And I am an Admin of farm <farm>
    And user <user> already has access <access> to the farm <farm>
    When I remove the user from farm
    Then the user <user> with access <access> should be removed from the farm <farm>

    Examples:
       | farm  | user                | password   | access        |
       | "270" | "bb@mailinator.com" | "test1234" | "FARM_MEMBER" |

@P1
Scenario Outline: Member or Viewer cannot remove a user from farm
    Given I am logged in as "elsie.arsua@datamars.com"
    And I have a role <read access> to farm <farm>
    Then I should not be able to remove others from <farm>

    Examples:
       | farm             | read access   |
       | "Bonetti PlanA"  | "FARM_READ"   |
       | "Argentina Farm" | "FARM_MEMBER" |

@P1
Scenario Outline: Admin cannot remove themselves if they are the only admin
    Given I am logged in as "elsie.arsua@datamars.com"
    And I am the only admin to <farm>
    Then I should not be able to remove myself from the farm <farm>

    Examples:
       | farm      |
       | "Elsie's" |
       | "LC"      |

@P1
Scenario Outline: Admin can invite other users to farm
    Given I am logged in as "elsie.arsua@datamars.com"
    And I am an Admin of farm <farm>
    And user <user> is not invited to the farm <farm> for role <role> yet
    When I invite user <user> with role <role> to the farm <farm>
    Then a pending invite should be added for the user

    Examples:
       | farm  | user                       | role          |
       | "270" | "dd@mailinator.com"        | "FARM_MEMBER" |

@P1
Scenario Outline: Member or Viewer cannot invite users to farm
    Given I am logged in as "elsie.arsua@datamars.com"
    And I have a role <read access> to farm <farm>
    Then I should not be able to invite <user> for <role> to the <farm>

    Examples:
       | farm             | read access   | user                | role          |
       | "Bonetti PlanA"  | "FARM_READ"   | "dd@mailinator.com" | "FARM_MEMBER" |
       | "Argentina Farm" | "FARM_MEMBER" | "dd@mailinator.com" | "FARM_READ"   |

@P2
Scenario Outline: Admin can cancel pending invites
    Given I am logged in as "elsie.arsua@datamars.com"
    And I am an Admin of farm "270"
    And there is a pending invite for user <user> to farm <farm> with role <role>
    Then I should be able to cancel the pending invite

    Examples:
       | farm  | read access   | admin                      | user                | role         |
       | "270" | "FARM_MEMBER" | "elsie.arsua@datamars.com" | "ad@mailinator.com" | "FARM_ADMIN" |

@P1
Scenario Outline: Member or Viewer cannot cancel pending invites
    Given I am logged in as "elsie.arsua@datamars.com"
    And there is a pending invite for user <user> to farm <farm> with role <role>
    And I have logged out and logged in as "bb@mailinator.com"    
    And I have a role <read access> to farm <farm>
    Then I should not be able to cancel the pending invite

    Examples:
       | farm  | read access   | admin                      | user                | role         |
       | "270" | "FARM_MEMBER" | "elsie.arsua@datamars.com" | "ad@mailinator.com" | "FARM_ADMIN" |

@P1
Scenario Outline: Admin can change a user's role to farm
   Given I am logged in as "elsie.arsua@datamars.com"
   And I am an Admin of farm <farm>
   And user <user> has role <role> to farm <farm>
   When I change the user <user> role <role> to new role <new role> on <farm>
   Then the user <user> new role <new role> should be reflected
   Examples:
      | farm  | user                       | role          | new role      |
      | "270" | "zz@mailinator.com"        | "FARM_READ"   | "FARM_MEMBER" |
      | "270" | "lcd.datamars+1@gmail.com" | "FARM_MEMBER" | "FARM_READ"   |
      
@P2
Scenario Outline: Admin can change an admin's role to a farm if there are other admins
   Given I am logged in as "elsie.arsua@datamars.com"
   And I am an Admin of farm <farm>
   And farm <farm> has another admin user <user>
   When I change the user <user> role <role> to new role <new role> on <farm>
   Then the user <user> new role <new role> should be reflected
   Examples:
      | farm  | user                | role         | new role    |
      | "270" | "ac@mailinator.com" | "FARM_ADMIN" | "FARM_READ" |

@P1
Scenario Outline: Member or Viewer cannot change a user's role to farm
   Given I am logged in as "elsie.arsua@datamars.com"
   And I have a role <my read access> to farm <farm>
   Then I should not be able to change user <user> role <user read access> to the farm <farm>

   Examples:
      | my read access | farm             | user                       | user read access | new role      |
      | "FARM_READ"    | "Bonetti PlanA"  | "elsie.arsua@datamars.com" | "FARM_READ"      | "FARM_MEMBER" |
      | "FARM_MEMBER"  | "Argentina Farm" | "elsie.arsua@datamars.com" | "FARM_MEMBER"    | "FARM_READ"   |

@P1
Scenario Outline: Admin cannot change their role to farm as Member/Viewer if they are the only admin
   Given I am logged in as "elsie.arsua@datamars.com"
   And I am the only admin to <farm>
   Then I should not be able to change my role to farm <farm> to a non-admin role <non-admin role>

   Examples:
      | farm      | non-admin role |
      | "Elsie's" | "FARM_MEMBER"  |
      | "LC"      | "FARM_READ"    |
@P2
Scenario: Any user of a farm can remove themselves from it
    Given I am logged in as "bb@mailinator.com"
    And I have a role "FARM_MEMBER" to farm "270"
    Then I should be able to remove myself from the farm

@P2
Scenario Outline: A user can no longer be invited if they already have access to the farm
    Given I am logged in as "elsie.arsua@datamars.com"
    And I am an Admin of farm <farm>
    And user <user> already has access <access> to the farm <farm>
    When I invite user <user> with role <role> to the farm <farm>
    Then the invite should be unsuccessful

    Examples:
       | farm  | user                       | access        | role          |
       | "270" | "bb@mailinator.com"        | "FARM_MEMBER" | "FARM_ADMIN"  |
       | "270" | "zz@mailinator.com"        | "FARM_READ"   | "FARM_MEMBER" |
       | "270" | "elsie.arsua@datamars.com" | "FARM_ADMIN"  | "FARM_READ"   |

@P2
Scenario: Users without any farm cannot use the website until they create a farm
    Given I am logged in as "ad@mailinator.com"
    And I don't have any farms
    Then I am required to create a farm
    And I cannot navigate in the website
