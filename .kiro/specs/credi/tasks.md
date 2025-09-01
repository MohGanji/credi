# Implementation Plan

## Core Analysis Pipeline (Free MVP)

- [ ] 1. Initialize Next.js project with TypeScript
  - Create new Next.js project with TypeScript configuration
  - Set up ESLint and Prettier for code formatting
  - Configure Tailwind CSS for styling
  - _Requirements: 1.1_

- [ ] 2. Create basic application layout with URL input form
  - Build main layout component with header
  - Create home page with URL input form for social media profiles
  - Add basic form validation and submission handling
  - _Requirements: 10.1, 11.1, 1.1_

- [ ] 3. Set up database schema for analysis storage
  - Install and configure database ORM (Prisma or similar)
  - Create Analysis table for storing analysis results with profile URL, results, timestamps
  - Set up database connection and basic CRUD operations
  - _Requirements: 17.1, 18.1_

- [ ] 4. Implement URL validation for social media platforms
  - Create URL validation functions for Twitter and LinkedIn
  - Add platform detection logic from URL patterns
  - Build error handling for unsupported platforms
  - _Requirements: 1.1, 1.2_

- [ ] 5. Build profile preview component
  - Create component to display detected platform and profile info
  - Show username, display name, and basic profile details
  - Add user confirmation button before proceeding with analysis
  - _Requirements: 11.1, 11.2, 11.3, 11.4_

- [ ] 6. Create SocialMediaCrawler interface
  - Define polymorphic interface for social media crawlers
  - Create Post and ProfileInfo data models
  - Build CrawlerFactory for platform-specific crawler selection
  - _Requirements: 2.1_

- [ ] 7. Implement mock crawlers for testing
  - Create TwitterCrawler class with mock post data for testing
  - Create LinkedInCrawler class with mock post data for testing
  - Add realistic mock data that covers different content types and patterns
  - _Requirements: 2.2_

- [ ] 8. Set up zen-mcp-server configuration
  - Install and configure zen-mcp-server
  - Set up MCP configuration with multiple AI models (Claude, GPT-4, Gemini)
  - Test basic MCP server connectivity and consensus tool
  - _Requirements: 6.1_

- [ ] 9. Create ZenConsensusAnalyzer class
  - Build analyzer class using zen-mcp-server consensus tool
  - Implement multi-model credibility assessment logic
  - Add structured result parsing from consensus responses
  - _Requirements: 6.2, 6.3_

- [ ] 10. Implement credibility analysis prompt
  - Create comprehensive analysis prompt covering 8 criteria
  - Add structured output formatting requirements for JSON parsing
  - Test prompt with real profile data
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8_

- [ ] 11. Build consensus result parsing
  - Create parser for zen-mcp-server consensus responses
  - Extract credibility scores and criteria evaluations
  - Handle parsing errors and incomplete responses
  - _Requirements: 4.1, 4.2, 4.3_

- [ ] 12. Create PipelineCoordinator class
  - Build coordinator to manage sequential pipeline stages
  - Implement stage-by-stage execution: crawler → analyzer → aggregator → reporter
  - Add basic error handling between pipeline stages
  - _Requirements: 5.1, 8.1_

- [ ] 13. Implement real-time progress tracking
  - Set up Server-Sent Events for real-time progress updates
  - Create progress update system for analysis stages
  - Build progress display component on frontend showing current stage
  - _Requirements: 10.2, 10.3, 10.4, 10.5, 10.6_

- [ ] 14. Build result aggregation and database storage
  - Create aggregator to combine crawler and analysis results
  - Implement data validation and completeness checking
  - Add structured AnalysisResult generation and database persistence
  - _Requirements: 5.4, 5.5, 17.1_

- [ ] 15. Implement analysis result caching system
  - Create cache lookup logic by profile URL before starting new analysis
  - Implement 24-hour TTL for cached results
  - Add cache serving with transparent user experience
  - _Requirements: 18.1, 18.2, 18.3, 18.4, 18.5_

- [ ] 16. Create analysis overview component
  - Build component showing credibility score and basic stats
  - Display sampled posts count and focus areas
  - Add visual score representation (progress bar or gauge)
  - _Requirements: 5.1_

- [ ] 17. Build criteria evaluation table
  - Create table component showing all 8 criteria with pass/warning/fail status
  - Add detailed evaluation text for each criterion
  - Include specific examples from the analysis
  - _Requirements: 5.2_

- [ ] 18. Implement representative posts section
  - Create component to display highlighted posts with analysis
  - Show post content, timestamps, and identified red flags
  - Add links to original posts when available
  - _Requirements: 5.3_

- [ ] 19. Build score justification section
  - Create component explaining why score is not higher or lower
  - Display reasoning in bullet points for easy reading
  - Add context about scoring methodology
  - _Requirements: 5.4_

- [ ] 20. Design responsive report layout
  - Ensure report displays properly on mobile and desktop
  - Optimize component layout for different screen sizes
  - Test accessibility and readability across devices
  - _Requirements: 5.5_

- [ ] 21. Add timeout and error handling
  - Implement 3-minute timeout for complete analysis
  - Add error handling for failed pipeline stages
  - Create user-friendly error messages and retry options
  - _Requirements: 8.3, 8.4, 8.5_

- [ ] 22. Set up job queue system for async processing
  - Install and configure job queue library (Bull, Agenda, or similar)
  - Create job queue for analysis processing to handle concurrent requests
  - Implement basic job creation and processing with progress updates
  - _Requirements: 8.1, 9.1_

## Feedback Collection System

- [ ] 23. Create feedback button and modal interface
  - Add feedback button to main application interface (corner placement)
  - Build modal with feedback form supporting bug reports and general feedback
  - Implement form validation and submission handling
  - _Requirements: 19.1, 19.2_

- [ ] 24. Implement feedback storage and confirmation
  - Create feedback database table and storage endpoints
  - Store feedback with categorization, user info, and browser details
  - Add feedback submission confirmation for users
  - _Requirements: 19.3, 19.4_

- [ ] 25. Build admin feedback review interface
  - Create admin dashboard for reviewing submitted feedback
  - Add feedback status management (new, in progress, resolved, closed)
  - Implement feedback search, filtering, and response capabilities
  - _Requirements: 19.5_

## User Management and Monetization

- [ ] 26. Extend database schema for user management
  - Add User table with email, phone, credits, verification status
  - Create user session and authentication tables
  - Update Analysis table to link with user accounts
  - _Requirements: 13.1, 17.1_

- [ ] 27. Implement guest user experience
  - Add session tracking for guest users with single-use limitation
  - Create blurred score component and limited summary for guests
  - Build call-to-action modal encouraging registration
  - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

- [ ] 28. Build user registration form
  - Create registration page with email and phone input fields
  - Add form validation for email and phone number formats
  - Implement basic form submission handling
  - _Requirements: 13.1, 13.2_

- [ ] 29. Implement email verification system
  - Set up email service integration (SendGrid, Resend, or similar)
  - Create email verification token generation and storage
  - Build email verification endpoint and confirmation page
  - _Requirements: 13.2_

- [ ] 30. Implement SMS verification system
  - Set up SMS service integration (Twilio or similar)
  - Create SMS verification code generation and storage
  - Build SMS verification endpoint and confirmation form
  - _Requirements: 13.2_

- [ ] 31. Create user login and session management
  - Build login form with email/password authentication
  - Implement session management with secure cookies or JWT
  - Create logout functionality
  - _Requirements: 13.3_

- [ ] 32. Build credit system foundation
  - Add credit balance tracking to user model
  - Implement credit initialization (3 free credits for new users)
  - Create credit deduction logic for analysis requests
  - _Requirements: 13.4, 14.1, 14.2, 14.4_

- [ ] 33. Create user dashboard
  - Build dashboard page showing current credit balance
  - Display analysis history with basic information
  - Add navigation to other user features
  - _Requirements: 14.5_

## Payment and Referral System

- [ ] 34. Set up payment gateway integration
  - Choose and integrate payment provider (Stripe recommended)
  - Set up payment processing endpoints and webhook handling
  - Create credit package selection and checkout flow
  - _Requirements: 16.1, 16.2, 16.3, 16.4, 16.5_

- [ ] 35. Create referral system
  - Build referral link generation and tracking
  - Implement credit rewards for successful referrals (3 credits)
  - Create referral dashboard and abuse prevention
  - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5_

## Monitoring and Analytics

- [ ] 36. Implement comprehensive monitoring
  - Add analysis performance tracking and success rate monitoring
  - Create user activity logging for support and analytics
  - Build admin dashboard for system health and user metrics
  - _Requirements: 8.5, 8.6, 17.3, 17.4, 17.5_

## Real Social Media Integration

- [ ] 37. Replace mock crawlers with real API integration
  - Integrate TwitterCrawler with Twitter/X API for real post extraction
  - Integrate LinkedInCrawler with LinkedIn API for real post extraction
  - Add proper rate limiting and error handling for social media APIs
  - Handle authentication, API quotas, and platform-specific challenges
  - _Requirements: 2.2, 2.4_

## Testing and Production

 - [ ] 38. Write unit tests for core components
  - Create tests for social media crawlers and validation
  - Test pipeline stages and result aggregation
  - Add tests for analysis parsing and error handling
  - _Requirements: 19.1_

- [ ] 39. Create integration tests
  - Build tests for complete analysis workflows
  - Test user registration and payment flows
  - Add tests for caching and error scenarios
  - _Requirements: 19.2_

- [ ] 40. Set up production environment
  - Configure production database with proper indexing and backup
  - Deploy application with proper scaling and load balancing
  - Set up monitoring, logging, and alerting infrastructure
  - _Requirements: 8.6, 9.1_