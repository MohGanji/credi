# Project Structure

## Root Directory
```
├── app/                    # Next.js App Router directory
├── prisma/                 # Database schema and migrations
├── .kiro/                  # Kiro IDE configuration and steering
├── node_modules/           # Dependencies
└── config files            # Various config files
```

## App Directory Structure (`app/`)
```
app/
├── api/                    # API routes
│   └── analysis/           # Analysis endpoints
│       ├── [id]/          # Get analysis by ID
│       └── route.ts       # Create new analysis
├── components/             # React components
├── lib/                    # Core business logic
│   ├── crawlers/          # Social media crawling
│   ├── services/          # Business services
│   ├── repositories/      # Data access layer
│   ├── types/             # TypeScript type definitions
│   └── hooks/             # React hooks
├── results/[id]/          # Analysis results pages
├── test-*/                # Test/demo pages
├── generated/             # Generated code (Prisma client)
├── globals.css            # Global styles
├── layout.tsx             # Root layout
└── page.tsx               # Home page
```

## Core Architecture Patterns

### Layered Architecture
1. **API Layer** (`app/api/`) - Next.js API routes
2. **Service Layer** (`app/lib/services/`) - Business logic
3. **Repository Layer** (`app/lib/repositories/`) - Data access
4. **External Layer** (`app/lib/crawlers/`) - External integrations

### Key Components

#### Crawlers (`app/lib/crawlers/`)
- **BaseCrawler** - Abstract base class with caching and rate limiting
- **Platform-specific crawlers** - TwitterCrawler, LinkedInCrawler
- **CrawlerFactory** - Factory pattern for crawler instantiation
- **Mock implementations** - For testing without external APIs

#### Services (`app/lib/services/`)
- **CredibilityAnalyzer** - Main analysis orchestration
- **AgentExecutorService** - AI model execution and consensus

#### Repositories (`app/lib/repositories/`)
- **AnalysisRepository** - Database operations for Analysis model

### File Naming Conventions
- **PascalCase** for classes and components (`CredibilityAnalyzer.ts`)
- **camelCase** for utilities and hooks (`useDebounce.ts`)
- **kebab-case** for routes and pages (`[id]/page.tsx`)
- **Test files** end with `.test.ts` and are in `__tests__/` directories

### Import Patterns
- Use relative imports within the same module
- Use `@/` alias for absolute imports from project root
- Group imports: external libraries, internal modules, types

### Testing Structure
- Tests are co-located in `__tests__/` directories
- Use TAP framework with descriptive test names
- Mock external dependencies for unit tests
- Integration tests use real implementations where possible

### Environment-Based Behavior
- **Mock modes** for development and testing
- **Real crawlers** for production
- **Consensus vs single model** execution modes
- **Configurable AI models** via environment variables

### Database Schema
- Single `Analysis` model with flexible JSON `sections` field
- Caching strategy with `expiresAt` field
- Audit trail with prompts and metadata