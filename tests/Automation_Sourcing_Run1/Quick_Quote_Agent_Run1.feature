@api @quick-quote
Feature: Procurement agent creation journey

  Scenario: Create a laptop sourcing event
    Given the procurement agent prompt is:
      """
      Create a sourcing event for 100 business laptops and docking stations
      for the India corporate business unit.
      """
    And the expected business outcome is:
      """
      A draft procurement event is created with structured line items,
      recommended suppliers, and a document identifier.
      """
    When I run the procurement creation journey
    Then the journey should create a draft event with line items and suppliers
