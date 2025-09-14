# Product Overview

**Credi** is a social media credibility analysis tool that helps users evaluate the trustworthiness of social media profiles.

## Purpose

In the age of "evidence-based" advice, Credi helps users figure out which social media profiles they can trust by analyzing content quality, sourcing practices, and communication patterns.

## Core Functionality

- Analyzes public social media profiles (Twitter/X and LinkedIn)
- Evaluates content against 8 credibility criteria:
  1. Unnecessary Complexity
  2. Proprietary/Pushy Selling
  3. Us-vs-Them Framing
  4. Overselling Narrow Interventions
  5. Emotion/Story Over Data
  6. Lack of Sourcing
  7. Serial Contrarian
  8. Guru Syndrome
- Provides a 0-10 Credi Score with detailed analysis
- Caches results for 24 hours to improve performance

## User Flow

1. User submits a social media profile URL
2. System validates and normalizes the URL
3. Profile and recent posts are crawled (or mock data is used)
4. AI agents analyze content for credibility
5. Comprehensive analysis with score is returned
6. Results are cached and can be viewed via unique analysis ID

## Key Features

- Real-time analysis with AI models (Claude, GPT, Gemini)
- Consensus analysis mode for higher accuracy
- Mock mode for testing and development
- Rate limiting and caching for performance
- Detailed audit trail with prompts and metadata
