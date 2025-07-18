# Requirements Document

## Introduction

The Fragrance Collection Tracker is a personal application that allows fragrance enthusiasts to manage their collection, track inventory levels, and maintain a calendar of which fragrances they wore on specific days. The application will integrate with online fragrance databases or APIs to make adding new fragrances quick and easy, while providing comprehensive tracking capabilities for personal collection management.

## Requirements

### Requirement 1

**User Story:** As a fragrance collector, I want to easily add fragrances to my collection using an online database, so that I don't have to manually enter all the fragrance details.

#### Acceptance Criteria

1. WHEN I search for a fragrance by name THEN the system SHALL display matching results from an online fragrance database
2. WHEN I select a fragrance from search results THEN the system SHALL automatically populate fragrance details (brand, name, notes, year, etc.)
3. WHEN I add a fragrance to my collection THEN the system SHALL save it with initial inventory information
4. IF a fragrance is not found in the database THEN the system SHALL allow manual entry of fragrance details

### Requirement 2

**User Story:** As a fragrance owner, I want to track my inventory levels for each fragrance, so that I know how much I have left and when I might need to repurchase.

#### Acceptance Criteria

1. WHEN I add a fragrance to my collection THEN the system SHALL allow me to specify the bottle size and current fill level
2. WHEN I update usage information THEN the system SHALL calculate and display remaining quantity
3. WHEN a fragrance reaches a low inventory threshold THEN the system SHALL notify me
4. WHEN I view my collection THEN the system SHALL display current inventory status for each fragrance

### Requirement 3

**User Story:** As a fragrance enthusiast, I want to track which fragrances I wore on specific days, so that I can remember my preferences and avoid repeating the same scent too frequently.

#### Acceptance Criteria

1. WHEN I select a date on the calendar THEN the system SHALL allow me to record which fragrance(s) I wore
2. WHEN I record wearing a fragrance THEN the system SHALL automatically update the inventory level if usage tracking is enabled
3. WHEN I view the calendar THEN the system SHALL display which fragrances were worn on each day
4. WHEN I select a fragrance THEN the system SHALL show me the last time I wore it and frequency of use

### Requirement 4

**User Story:** As a user, I want to view and manage my complete fragrance collection, so that I can see what I own and organize my fragrances effectively.

#### Acceptance Criteria

1. WHEN I access my collection THEN the system SHALL display all my fragrances with key details (name, brand, inventory status)
2. WHEN I select a fragrance THEN the system SHALL show detailed information including notes, purchase date, and usage history
3. WHEN I want to organize my collection THEN the system SHALL allow sorting and filtering by various criteria (brand, type, inventory level, last worn)
4. WHEN I no longer own a fragrance THEN the system SHALL allow me to remove it from my collection

### Requirement 5

**User Story:** As a fragrance collector, I want to track additional details about my fragrances, so that I can maintain comprehensive records of my collection.

#### Acceptance Criteria

1. WHEN I add or edit a fragrance THEN the system SHALL allow me to record purchase information (date, price, retailer)
2. WHEN I view a fragrance THEN the system SHALL display fragrance composition (top, middle, base notes)
3. WHEN I want to add personal notes THEN the system SHALL allow me to save custom notes for each fragrance
4. WHEN I track usage THEN the system SHALL maintain a history of when and how much I used each fragrance

### Requirement 6

**User Story:** As a fragrance enthusiast, I want to rate my fragrances, so that I can remember which ones I love and make better choices about what to wear or purchase.

#### Acceptance Criteria

1. WHEN I view a fragrance THEN the system SHALL allow me to assign a rating (1-5 stars or 1-10 scale)
2. WHEN I rate a fragrance THEN the system SHALL save and display my rating
3. WHEN I view my collection THEN the system SHALL allow me to sort fragrances by rating
4. WHEN I update a rating THEN the system SHALL replace the previous rating with the new one

### Requirement 7

**User Story:** As a fragrance collector, I want to organize fragrances into different lists (owned, tried, wishlist), so that I can track my relationship with each fragrance beyond just ownership.

#### Acceptance Criteria

1. WHEN I add a fragrance THEN the system SHALL allow me to categorize it as "Owned", "Tried", or "Wishlist"
2. WHEN I view my fragrances THEN the system SHALL allow me to filter by list type (owned, tried, wishlist)
3. WHEN I change my relationship with a fragrance THEN the system SHALL allow me to move it between lists
4. WHEN I own a fragrance from my wishlist or tried list THEN the system SHALL allow me to move it to owned and add inventory details
5. WHEN I view each list THEN the system SHALL display appropriate information (inventory for owned, experience notes for tried, priority for wishlist)