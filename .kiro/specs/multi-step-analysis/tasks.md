# Implementation Plan

- [ ] 1. Remove Fake Responses and Add Posts Storage
  - Create Posts table in Prisma schema (profileUrl, platform, posts JSON, createdAt, expiresAt)
  - Add state column to Analysis table (COMPLETED, FAILED)
  - Remove all fallback/mock response generation from CredibilityAnalyzer
  - Update analysis route to store posts separately before AI analysis
  - Return proper error messages when AI parsing fails (no fake scores)
  - _Requirements: 1.1, 1.2, 3.1, 3.2, 3.3_

- [ ] 2. Implement Retry Logic
  - Create simple retry logic: check for existing failed analysis, reuse posts if available
  - When same URL submitted after failure, retry AI analysis with existing posts
  - Add basic retry count limit (max 3 attempts)
  - Update analysis route to handle retry scenarios automatically
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [ ] 3. Add Error Handling and Cleanup
  - Add user-friendly error messages for different failure types
  - Implement posts expiration (24 hours) and cleanup
  - Add comprehensive tests for success, failure, and retry scenarios
  - _Requirements: 3.4, 3.5, 5.1, 5.2, 8.1, 8.2_