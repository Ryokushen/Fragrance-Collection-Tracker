# Implementation Plan

- [x] 1. Set up project structure and core interfaces
  - Create directory structure for frontend (React) and backend (Express.js) components
  - Initialize package.json files with required dependencies
  - Set up TypeScript configuration for both frontend and backend
  - Create core interface definitions for Fragrance, Inventory, DailyWear, and UsageEntry models
  - _Requirements: All requirements depend on proper project structure_

- [x] 2. Implement database schema and models
  - Create SQLite database schema with tables for fragrances, inventory, daily_wear, and usage_entries
  - Write database migration scripts for schema creation
  - Implement data access layer with proper TypeScript interfaces
  - Create database connection utilities and error handling
  - _Requirements: 1.3, 2.1, 3.1, 4.1, 5.1, 7.1_

- [ ] 3. Build external fragrance API integration service
  - Implement FragranceService with external API search functionality
  - Create HTTP client for fragrance database API calls (Fragrantica or similar)
  - Add response caching with Redis to improve performance
  - Implement fallback handling when external APIs are unavailable
  - Write unit tests for API integration service
  - _Requirements: 1.1, 1.2, 1.4_

- [ ] 4. Create core fragrance management backend endpoints
  - Implement POST /api/fragrances endpoint for adding fragrances to collection
  - Implement GET /api/fragrances endpoint with filtering and sorting capabilities
  - Implement PUT /api/fragrances/:id endpoint for updating fragrance details
  - Implement DELETE /api/fragrances/:id endpoint for removing fragrances
  - Add request validation middleware for all endpoints
  - Write integration tests for fragrance CRUD operations
  - _Requirements: 1.3, 4.1, 4.2, 4.3, 4.4, 5.1, 5.2, 5.3, 6.1, 6.2, 7.1, 7.3_

- [ ] 5. Implement inventory management system
  - Create InventoryService with methods for tracking bottle levels and usage
  - Implement POST /api/inventory endpoint for updating inventory levels
  - Implement GET /api/inventory/alerts endpoint for low inventory notifications
  - Add automatic inventory calculation based on usage entries
  - Create background job for calculating estimated remaining days
  - Write unit tests for inventory calculations and alerts
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [ ] 6. Build calendar and daily wear tracking system
  - Implement CalendarService for recording and retrieving daily wear data
  - Create POST /api/daily-wear endpoint for recording fragrance usage
  - Create GET /api/daily-wear endpoint for retrieving wear history by date range
  - Add automatic inventory updates when recording daily wear
  - Implement usage statistics calculation (frequency, last worn dates)
  - Write unit tests for calendar service and wear tracking
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [ ] 7. Create rating and personal notes system
  - Add rating fields to fragrance model and database schema
  - Implement PUT /api/fragrances/:id/rating endpoint for updating ratings
  - Add personal notes functionality to fragrance update endpoints
  - Implement GET /api/fragrances endpoint sorting by rating
  - Write tests for rating and notes functionality
  - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [ ] 8. Implement fragrance list categorization system
  - Add listType field to fragrance model (owned/tried/wishlist)
  - Implement PUT /api/fragrances/:id/list-type endpoint for moving between lists
  - Add filtering by list type to GET /api/fragrances endpoint
  - Create logic for handling transitions from wishlist/tried to owned
  - Write tests for list categorization functionality
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ] 9. Build React frontend foundation
  - Set up React application with TypeScript and routing
  - Create main layout component with navigation
  - Implement authentication context and protected routes
  - Set up API client with error handling and loading states
  - Create reusable UI components (buttons, forms, modals)
  - Add responsive design framework (Material-UI or Tailwind CSS)
  - _Requirements: All requirements need frontend interface_

- [ ] 10. Implement fragrance search and addition interface
  - Create FragranceSearch component with autocomplete functionality
  - Implement search results display with fragrance details
  - Add "Add to Collection" functionality with list type selection
  - Create manual fragrance entry form for items not in external database
  - Add loading states and error handling for search operations
  - Write component tests for search functionality
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 7.1_

- [ ] 11. Build collection management interface
  - Create CollectionView component with grid/list toggle
  - Implement filtering controls (brand, list type, inventory level, rating)
  - Add sorting functionality (name, brand, rating, last worn)
  - Create fragrance cards with key information and quick actions
  - Implement bulk operations for managing multiple fragrances
  - Add pagination for large collections
  - Write component tests for collection view
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 7.2_

- [ ] 12. Create fragrance detail and editing interface
  - Build FragranceDetail component with comprehensive information display
  - Implement inline editing for personal notes and ratings
  - Add purchase information tracking form
  - Create usage history display with charts/graphs
  - Implement inventory level editing with visual indicators
  - Add photo upload functionality for personal fragrance images
  - Write component tests for detail view and editing
  - _Requirements: 4.2, 5.1, 5.2, 5.3, 5.4, 6.1, 6.4_

- [ ] 13. Build inventory tracking interface
  - Create InventoryTracker component with visual fill level indicators
  - Implement inventory update forms with bottle size and current level
  - Add low inventory alerts display and notification system
  - Create usage tracking interface with spray count input
  - Implement estimated days remaining calculation display
  - Add inventory history charts and statistics
  - Write component tests for inventory tracking
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [ ] 14. Implement calendar and daily wear interface
  - Create CalendarComponent with monthly/weekly views
  - Implement daily wear entry modal with fragrance selection
  - Add drag-and-drop functionality for quick fragrance assignment
  - Create wear history display with usage patterns
  - Implement quick actions for marking fragrances as worn today
  - Add statistics dashboard for wear frequency and preferences
  - Write component tests for calendar functionality
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [ ] 15. Add data persistence and offline functionality
  - Implement local storage for offline fragrance browsing
  - Create sync mechanism for offline actions when connection restored
  - Add data export functionality (JSON/CSV formats)
  - Implement data import functionality for migrating existing collections
  - Create backup and restore functionality
  - Write tests for data persistence and sync functionality
  - _Requirements: 4.1, 4.4 (data management aspects)_

- [ ] 16. Implement comprehensive error handling and user feedback
  - Add global error boundary for React application
  - Implement toast notifications for user actions and errors
  - Create loading states for all async operations
  - Add form validation with user-friendly error messages
  - Implement retry mechanisms for failed API calls
  - Create offline mode indicators and messaging
  - Write tests for error handling scenarios
  - _Requirements: All requirements need proper error handling_

- [ ] 17. Add performance optimizations and caching
  - Implement React.memo and useMemo for expensive components
  - Add virtual scrolling for large fragrance collections
  - Implement image lazy loading and optimization
  - Add debounced search inputs to reduce API calls
  - Create service worker for caching static assets
  - Optimize database queries with proper indexing
  - Write performance tests and benchmarks
  - _Requirements: 1.1, 4.1 (performance aspects)_

- [ ] 18. Create comprehensive test suite
  - Write unit tests for all service layer functions
  - Create integration tests for API endpoints
  - Implement end-to-end tests for critical user workflows
  - Add component tests for all React components
  - Create test data factories and database seeding
  - Set up continuous integration with automated testing
  - Write performance and load tests for search functionality
  - _Requirements: All requirements need test coverage_