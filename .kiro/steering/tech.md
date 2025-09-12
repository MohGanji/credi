# Technology Stack

## Framework & Runtime
- **Next.js 15** - React framework with App Router
- **TypeScript** - Strict typing enabled
- **Node.js** - Runtime environment
- **React 18** - UI library

## Database & ORM
- **SQLite** - Local development database (`prisma/dev.db`)
- **Prisma** - ORM with client generation to `app/generated/prisma`
- Database schema: Single `Analysis` model with JSON sections for flexible data storage

## AI & Language Models
- **LangChain** - AI orchestration framework
- **Multiple AI Providers**:
  - Anthropic Claude (primary)
  - OpenAI GPT models
  - Google Gemini
- **Execution Modes**:
  - Single model execution
  - Consensus analysis with aggregation
  - Mock mode for testing

## Styling & UI
- **Tailwind CSS** - Utility-first CSS framework
- **@tailwindcss/typography** - Typography plugin for rich content

## Testing
- **TAP (Test Anything Protocol)** - Primary testing framework
- **@types/tap** - TypeScript definitions
- Test timeout: 30 seconds
- Separate test TypeScript config (`tsconfig.test.json`)

## Code Quality
- **ESLint** - Linting with Next.js and Prettier integration
- **Prettier** - Code formatting (single quotes, 2 spaces, 80 char width)
- **TypeScript strict mode** - Enhanced type checking

## External Services
- **Apify** - Social media scraping service
- **Winston** - Structured logging

## Common Commands

### Development
```bash
npm run dev          # Start development server on port 3001
npm run build        # Build for production
npm run start        # Start production server on port 3001
```

### Code Quality
```bash
npm run lint         # Run ESLint
npm run format       # Format code with Prettier
npm run format:check # Check formatting without changes
```

### Testing
```bash
npm test            # Run all tests with TAP
```

### Database
```bash
npx prisma generate # Generate Prisma client
npx prisma migrate dev # Run database migrations
npx prisma studio   # Open database GUI
```

## Environment Configuration
- `.env` file for local development
- Key variables: AI API keys, database URL, crawler settings
- Mock modes available for testing without external dependencies