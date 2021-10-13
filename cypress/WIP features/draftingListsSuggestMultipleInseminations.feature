Feature: Draft lists for farms that allow suggestions of multiple inseminations per heat 

PASS => Scenario: Only 1 draft time apply into optimal insemination window and is set for reason Heat, then animal is auto added into this slot only
Scenario: Multiple draft times apply into optimal insemination window and all are set for reason Heat, then animal is auto added into these times only
PASS => Scenario: Multiple draft times apply into optimal insemination window but only 1 is set for reason Heat, then animal is auto added only into the time with reason Heat
Scenario: No draft times apply to the optimal insemination window, but multiple draft times apply to the insemination window, then the animal is auto added into the 1st upcoming draft time 
PASS => Scenario: Multiple draft times apply to both optimal insemination window and insemination window, then animal is auto added only to the draft list falling in the optimal insemination window
PASS => Scenario: When one draft time apply to optimal insemination window and another one to insemination window, then animal is auto added only to the draft list falling in the optimal insemination window
PASS => Scenario: No future draft times apply into optimal insemination window or insemination window, then animal is not added to any draft time
PASS => Scenario: When the same draft time apply to 2 events (heat and health), then only 1 entry (with 2 reasons) should be added to the draft time
FAIL (animal not removed) => Scenario: When an animal is marked Sold/Died, then it is automatically removed from any future draft list
IRRELEVANT due to above preceding behaviour => Scenario: When an animal is marked Current, and it has heat/health events that require drafting, then it should be added to relevant draft list
PASS => Scenario: When an animal's heat event is deleted, then it should be removed from the draft lists relating to this event
PASS => Scenario: When an animal's health event is deleted, then it should be removed from the draft lists relating to this event
PASS => Scenario: When an animal's heat event insemination window changes, then the drafting lists to which this event applies should be updated
PASS => Scenario: When an animal's health event period is changed, then the drafting lists to which this event applies should be updated
PASS => Scenario: When multiple draft times apply into health event period (24hours), then animal is auto added into only the 1st drafting list
Scenario: When an animal has an overlapping automated heat event and manual heat event, then it should be added only once to applicable draft list(s)
FAIL (error 400) => Scenario: When adding heat event while animal already in draft list, should be successful and no further entry in the draft list for the animal
Scenario: When adding 


   

 