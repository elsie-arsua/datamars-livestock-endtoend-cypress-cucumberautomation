Feature: Auto generated drafting lists

Scenario: A draft list is auto generated for each slot per day starting from current day, and the next day
Scenario: The earliest upcoming draft list is presented to the user by default
Scenario: User is able to view any of the draft list - from a day ago, current day, next day
Scenario: When draft configuration of a farm is deleted, then draft lists relating to this configuration should be deleted and farm now will have an inspection list
Scenario: When a draft time is edited, then their corresponding future draft lists and animals in list are updated
Scenario: When a draft time is edited, then their corresponding historical draft lists and animals in list are not updated
Scenario: When farm configuration is changed to now suggest insemination into multiple drafting times, then animals are added into multiple applicable draft times
Scenario: When farm configuration is changed to now suggest insemination into single drafting time only, then animals are removed from multiple draft times and kept only in the earliest upcoming draft time
Scenario: When animal is removed from the farm, then it is removed from all draft lists
Scenario: If an animal is already in heat when a drafting list is created, then it is not auto added to the created draft list even if draft time falls into insemination window
Scenario: If a drafting slot time is changed and if a corresponding future drafting list has animals in it, then the drafting list is not changed
Scenario: If a drafting slot time is changed and if a corresponding future drafting list has no animals in it, then the drafting list reflects the new time