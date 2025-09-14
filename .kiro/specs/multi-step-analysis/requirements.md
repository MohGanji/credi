# Multi-Step Analysis with Retry Capability - Requirements

## Introduction

This feature transforms the current single-step analysis process into a robust multi-step state machine where each costly operation (crawling, AI analysis) is persisted separately. This enables proper error handling, retry capabilities, and eliminates fake fallback responses in production.

## Requirements

### Requirement 1: Separate Data Storage for Posts

**User Story:** As a system administrator, I want posts to be stored separately from analysis results, so that I can retry failed analyses without re-crawling data.

#### Acceptance Criteria

1. WHEN a profile URL is submitted THEN the system SHALL create a separate Posts record containing all fetched social media posts
2. WHEN storing posts THEN the system SHALL include profile metadata (username, displayName, bio, verified status, followerCount)
3. WHEN an Analysis is created THEN it SHALL reference the Posts record via foreign key relationship
4. WHEN posts are fetched successfully THEN they SHALL be persisted before any AI analysis begins
5. IF posts already exist for a profile URL THEN the system SHALL reuse existing posts if they are not expired (within 24 hours)

### Requirement 2: Analysis State Management

**User Story:** As a user, I want the system to track analysis progress through distinct states, so that I can understand what's happening and retry from appropriate points.

#### Acceptance Criteria

1. WHEN an analysis is initiated THEN it SHALL start in "CRAWLING" state
2. WHEN posts are successfully fetched THEN the state SHALL transition to "ANALYZING"
3. WHEN AI analysis completes successfully THEN the state SHALL transition to "COMPLETED"
4. IF crawling fails THEN the state SHALL transition to "CRAWLING_FAILED"
5. IF AI analysis fails THEN the state SHALL transition to "ANALYSIS_FAILED"
6. WHEN in any failed state THEN the system SHALL provide retry capabilities
7. WHEN retrying from "ANALYSIS_FAILED" THEN the system SHALL reuse existing posts without re-crawling

### Requirement 3: Elimination of Fake Responses

**User Story:** As a user, I want to receive only real analysis results or clear error messages, so that I can trust the system's output.

#### Acceptance Criteria

1. WHEN AI analysis fails to parse THEN the system SHALL NOT store a fake/fallback analysis result
2. WHEN AI analysis fails THEN the system SHALL store the analysis in "ANALYSIS_FAILED" state with error details
3. WHEN displaying failed analysis THEN the system SHALL show a clear error message instead of raw AI output
4. WHEN analysis fails THEN the system SHALL provide a "Retry Analysis" button
5. WHEN cached results exist in failed state THEN the system SHALL NOT serve them as successful results

### Requirement 4: Automatic Retry Logic

**User Story:** As a user, I want failed analyses to be automatically retried when I resubmit the same URL, so that I can get results without manual intervention.

#### Acceptance Criteria

1. WHEN the same profile URL is submitted and previous analysis failed THEN the system SHALL automatically retry from the appropriate step
2. WHEN retry is for "CRAWLING_FAILED" THEN the system SHALL restart from crawling step
3. WHEN retry is for "ANALYSIS_FAILED" THEN the system SHALL restart from AI analysis step using existing posts
4. WHEN retry succeeds THEN the system SHALL update the existing Analysis record to "COMPLETED" state
5. WHEN retry fails again THEN the system SHALL return an error message indicating persistent failure

### Requirement 5: Data Expiration and Cleanup

**User Story:** As a system administrator, I want old posts and failed analyses to be managed appropriately, so that the system doesn't accumulate stale data.

#### Acceptance Criteria

1. WHEN posts are older than 24 hours THEN they SHALL be considered expired for reuse
2. WHEN expired posts exist THEN new crawling SHALL be performed and new Posts record created
3. WHEN analysis is in failed state for more than 7 days THEN it SHALL be eligible for cleanup
4. WHEN successful analysis exists THEN it SHALL follow existing 24-hour expiration rules

### Requirement 6: API Compatibility

**User Story:** As a frontend developer, I want the existing API interface to remain unchanged, so that no frontend modifications are required.

#### Acceptance Criteria

1. WHEN analysis is submitted THEN the API SHALL return the same response format as before (analysis ID and basic info)
2. WHEN polling for results THEN the API SHALL return completed results or appropriate error messages
3. WHEN analysis is in progress internally THEN the API SHALL handle state transitions transparently
4. WHEN analysis fails THEN the API SHALL return a user-friendly error message with retry capability
5. WHEN retry is needed THEN it SHALL be handled through the same POST endpoint with the same URL

### Requirement 7: Database Schema Changes

**User Story:** As a developer, I want proper database schema to support the multi-step process, so that data integrity is maintained.

#### Acceptance Criteria

1. WHEN implementing THEN a new Posts table SHALL be created with fields: id, profileUrl, platform, username, displayName, bio, verified, followerCount, posts (JSON), createdAt, expiresAt
2. WHEN implementing THEN Analysis table SHALL add: postsId (foreign key), state (enum), errorMessage, retryCount, lastRetryAt
3. WHEN implementing THEN foreign key constraints SHALL ensure data integrity
4. WHEN implementing THEN indexes SHALL be added for efficient querying by profileUrl and state
5. WHEN migrating existing data THEN current analyses SHALL be marked as "COMPLETED" state with null postsId

### Requirement 8: Error Handling and Logging

**User Story:** As a system administrator, I want comprehensive error tracking for each step, so that I can diagnose and resolve issues.

#### Acceptance Criteria

1. WHEN any step fails THEN detailed error information SHALL be logged with step context
2. WHEN crawler fails THEN specific crawler error codes and messages SHALL be captured
3. WHEN AI analysis fails THEN the raw response and parsing error SHALL be logged (but not shown to user)
4. WHEN retry attempts are made THEN retry count and timestamps SHALL be tracked
5. WHEN maximum retry attempts are reached THEN the system SHALL log and prevent further automatic retries
