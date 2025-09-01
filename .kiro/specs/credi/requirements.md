# Requirements Document

## Introduction

Credi is a web application that evaluates the credibility of social media profiles by analyzing their content against evidence-based criteria. The platform aims to help users identify trustworthy sources of information while incentivizing content creators to produce high-value, well-researched content rather than clickbait or misleading information. Initially focusing on Twitter and LinkedIn profiles, Credi provides a 0-10 credibility score along with detailed analysis based on eight key criteria including complexity, commercialization, tribalism, overselling, emotional manipulation, source citation, contrarianism, and guru syndrome.

## Requirements

### Requirement 1

**User Story:** As a user, I want to input a social media profile URL and receive a credibility analysis, so that I can determine if the content creator is a trustworthy source of information.

#### Acceptance Criteria

1. WHEN a user enters a valid Twitter or LinkedIn profile URL THEN the system SHALL validate the URL format and platform support
2. WHEN a user enters an unsupported social media platform URL THEN the system SHALL display an error message indicating the platform is not supported
3. WHEN a user enters a private or inaccessible profile URL THEN the system SHALL return a message indicating the profile cannot be analyzed
4. WHEN a valid public profile URL is submitted THEN the system SHALL initiate the credibility analysis process

### Requirement 2

**User Story:** As a user, I want the system to crawl and analyze recent posts from a social media profile, so that the credibility assessment is based on current content patterns.

#### Acceptance Criteria

1. WHEN analyzing a profile THEN the system SHALL collect a configurable number of recent posts (default 50)
2. WHEN crawling posts THEN the system SHALL extract text content, engagement metrics, and posting patterns
3. WHEN posts contain external links THEN the system SHALL identify and catalog referenced sources
4. WHEN crawling fails due to rate limits THEN the system SHALL implement exponential backoff retry logic
5. WHEN insufficient posts are available THEN the system SHALL analyze available content and note the limitation

### Requirement 3

**User Story:** As a user, I want the system to evaluate content against eight credibility criteria, so that I receive a comprehensive assessment of the profile's trustworthiness.

#### Acceptance Criteria

1. WHEN analyzing content THEN the system SHALL evaluate against unnecessary complexity criterion
2. WHEN analyzing content THEN the system SHALL evaluate against proprietary/pushy selling criterion
3. WHEN analyzing content THEN the system SHALL evaluate against us-vs-them framing criterion
4. WHEN analyzing content THEN the system SHALL evaluate against overselling narrow interventions criterion
5. WHEN analyzing content THEN the system SHALL evaluate against emotion/story over data criterion
6. WHEN analyzing content THEN the system SHALL evaluate against lack of sourcing criterion
7. WHEN analyzing content THEN the system SHALL evaluate against serial contrarian criterion
8. WHEN analyzing content THEN the system SHALL evaluate against guru syndrome criterion

### Requirement 4

**User Story:** As a user, I want to receive a numerical credibility score from 0-10, so that I can quickly assess the overall trustworthiness of a profile.

#### Acceptance Criteria

1. WHEN analysis is complete THEN the system SHALL generate a credibility score between 0 and 10
2. WHEN generating the score THEN the system SHALL weight each criterion appropriately
3. WHEN multiple AI agents provide scores THEN the system SHALL use consensus methodology to determine final score
4. WHEN confidence is low THEN the system SHALL indicate uncertainty in the scoring

### Requirement 5

**User Story:** As a user, I want to see a detailed analysis report with specific examples, so that I can understand the reasoning behind the credibility score.

#### Acceptance Criteria

1. WHEN analysis is complete THEN the system SHALL generate a structured report with profile overview
2. WHEN generating the report THEN the system SHALL include identified strengths with specific examples
3. WHEN generating the report THEN the system SHALL include red-flag criteria evaluation table
4. WHEN generating the report THEN the system SHALL highlight representative posts with links
5. WHEN generating the report THEN the system SHALL explain why the score is not higher or lower

### Requirement 6

**User Story:** As a system administrator, I want to use multiple AI agents with consensus methodology, so that the credibility analysis is robust and unbiased.

#### Acceptance Criteria

1. WHEN processing a profile THEN the system SHALL use multiple specialized AI agents
2. WHEN agents complete analysis THEN the system SHALL aggregate responses using consensus methodology
3. WHEN agents disagree significantly THEN the system SHALL flag the analysis for review
4. WHEN using different AI models THEN the system SHALL track which models were used for transparency

### Requirement 7

**User Story:** As a system administrator, I want to implement a two-tier agent architecture, so that the system is scalable and maintainable.

#### Acceptance Criteria

1. WHEN processing requests THEN the system SHALL use primary agents for orchestration
2. WHEN executing tasks THEN the system SHALL use stateless subagents for specific functions
3. WHEN subagents complete tasks THEN they SHALL return structured results without maintaining state
4. WHEN primary agents coordinate THEN they SHALL handle all context management and task decomposition

### Requirement 8

**User Story:** As a system administrator, I want comprehensive error handling and monitoring, so that the system is reliable and issues can be quickly identified.

#### Acceptance Criteria

1. WHEN subagents fail THEN the system SHALL implement graceful degradation
2. WHEN API calls fail THEN the system SHALL retry with exponential backoff
3. WHEN processing takes too long THEN the system SHALL timeout and indicate failure without partial results
4. WHEN timeout occurs THEN the system SHALL encourage the user to try again
5. WHEN errors occur THEN the system SHALL log detailed error information for debugging
6. WHEN system performance degrades THEN monitoring SHALL alert administrators

### Requirement 9

**User Story:** As a user, I want the system to be fast and efficient, so that I can get credibility analysis results quickly.

#### Acceptance Criteria

1. WHEN processing profiles THEN the system SHALL complete analysis within 3 minutes for standard profiles
2. WHEN possible THEN the system SHALL execute independent tasks in parallel
3. WHEN caching is beneficial THEN the system SHALL cache results for 24 hours
4. WHEN using AI models THEN the system SHALL select appropriate models based on task complexity

### Requirement 10

**User Story:** As a user, I want to see real-time progress updates during analysis, so that I understand what the system is doing and stay engaged during the process.

#### Acceptance Criteria

1. WHEN analysis begins THEN the system SHALL display progress indicators showing current stage
2. WHEN collecting posts THEN the system SHALL show "Credi is collecting user's recent posts"
3. WHEN verifying access THEN the system SHALL show "Credi is verifying that the page is public"
4. WHEN analyzing content THEN the system SHALL show "Credi is analyzing posts"
5. WHEN generating report THEN the system SHALL show "Credi is generating report"
6. WHEN calculating score THEN the system SHALL show "Credi is scoring page [PageName]"

### Requirement 11

**User Story:** As a user, I want visual confirmation of the profile being analyzed, so that I can verify the system found the correct profile before analysis begins.

#### Acceptance Criteria

1. WHEN a URL is entered THEN the system SHALL identify and display the social media platform
2. WHEN profile is detected THEN the system SHALL show the profile owner's name
3. WHEN profile is detected THEN the system SHALL show the page title or description
4. WHEN profile information is displayed THEN the user SHALL be able to confirm before proceeding
5. WHEN profile cannot be identified THEN the system SHALL show an appropriate error message

### Requirement 12

**User Story:** As a guest user, I want to try the system once without creating an account, so that I can see the value before committing to registration.

#### Acceptance Criteria

1. WHEN a guest user submits a profile URL THEN the system SHALL allow one free analysis
2. WHEN analysis is complete for guest users THEN the system SHALL show partial results with summary sections
3. WHEN displaying guest results THEN the Credi score SHALL be blurred out
4. WHEN showing partial results THEN the system SHALL display a call-to-action to create an account
5. WHEN guest user tries to analyze a second profile THEN the system SHALL require account creation

### Requirement 13

**User Story:** As a new user, I want to create an account with email and phone verification, so that I can access the full analysis features while preventing system abuse.

#### Acceptance Criteria

1. WHEN creating an account THEN the system SHALL require both email and phone number
2. WHEN email is provided THEN the system SHALL send verification email
3. WHEN phone number is provided THEN the system SHALL send SMS verification code
4. WHEN account is verified THEN the user SHALL receive 3 free analysis credits
5. WHEN duplicate phone or email is detected THEN the system SHALL prevent account creation

### Requirement 14

**User Story:** As a registered user, I want to use my analysis credits to get full credibility reports, so that I can make informed decisions about social media profiles.

#### Acceptance Criteria

1. WHEN a registered user submits analysis THEN the system SHALL deduct one credit from their balance
2. WHEN user has sufficient credits THEN the system SHALL provide complete analysis report
3. WHEN user has zero credits THEN the system SHALL redirect to payment or referral options
4. WHEN analysis fails THEN the system SHALL refund the credit to the user
5. WHEN user views their account THEN they SHALL see their current credit balance

### Requirement 15

**User Story:** As a user, I want to invite friends and earn credits, so that I can continue using the service without immediate payment.

#### Acceptance Criteria

1. WHEN user sends an invitation THEN the system SHALL generate a unique referral link
2. WHEN invited user creates verified account THEN the referring user SHALL receive 3 credits
3. WHEN user views referrals THEN they SHALL see pending and completed invitations
4. WHEN referral credits are awarded THEN the user SHALL receive notification
5. WHEN referral system is abused THEN the system SHALL detect and prevent credit farming

### Requirement 16

**User Story:** As a user, I want to purchase additional credits, so that I can continue analyzing profiles when my free credits are exhausted.

#### Acceptance Criteria

1. WHEN user needs more credits THEN the system SHALL provide a payment page
2. WHEN user selects credit package THEN the system SHALL process secure payment
3. WHEN payment is successful THEN credits SHALL be immediately added to user account
4. WHEN payment fails THEN the system SHALL show appropriate error message
5. WHEN purchase is complete THEN the user SHALL receive email confirmation

### Requirement 17

**User Story:** As a developer, I want to track all user activities and transactions, so that I can monitor system usage and provide customer support.

#### Acceptance Criteria

1. WHEN user makes a payment THEN the system SHALL log transaction details with timestamp
2. WHEN user uses credits THEN the system SHALL record credit usage with profile analyzed
3. WHEN user requests analysis THEN the system SHALL log request details and outcomes
4. WHEN viewing analytics THEN developers SHALL see usage patterns and system performance
5. WHEN user contacts support THEN their activity history SHALL be accessible

### Requirement 18

**User Story:** As a developer, I want to cache analysis results, so that repeated requests for the same profile are served efficiently and consistently.

#### Acceptance Criteria

1. WHEN analysis is completed THEN the system SHALL cache results for 24 hours per profile
2. WHEN same profile is requested within cache period THEN the system SHALL serve cached results
3. WHEN cache expires THEN the system SHALL require fresh analysis for subsequent requests
4. WHEN serving cached results THEN the user experience SHALL be identical to fresh analysis
5. WHEN caching is used THEN users SHALL not be aware of whether results are cached or fresh

### Requirement 19

**User Story:** As a user, I want to easily provide feedback or report bugs, so that I can help improve the platform and get issues resolved.

#### Acceptance Criteria

1. WHEN viewing the main page THEN the system SHALL display a feedback button in a corner
2. WHEN user clicks feedback button THEN the system SHALL open a modal with feedback form
3. WHEN submitting feedback THEN the system SHALL collect the feedback in the database
4. WHEN feedback is submitted THEN the user SHALL receive confirmation of submission
5. WHEN feedback form is displayed THEN it SHALL allow both bug reports and general feedback

### Requirement 20

**User Story:** As a developer, I want the system to be modular and testable, so that new features can be added and existing functionality can be maintained easily.

#### Acceptance Criteria

1. WHEN implementing agents THEN each agent SHALL have a single, well-defined responsibility
2. WHEN testing THEN each subagent SHALL be testable in isolation
3. WHEN adding new social media platforms THEN the system SHALL support plugin-style extensions
4. WHEN modifying criteria THEN changes SHALL not require system-wide modifications