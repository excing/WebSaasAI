# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a SvelteKit starter kit with authentication, payments, and AI chat capabilities. It uses:
- **SvelteKit** with Svelte 5 for the frontend framework
- **Better Auth** with Polar integration for authentication and subscription management
- **Drizzle ORM** with Neon PostgreSQL for database
- **Tailwind CSS v4** with shadcn-svelte components for UI
- **Vercel AI SDK** with OpenAI for AI chat features
- **Cloudflare R2** for image storage

## Development Commands

```bash
# Start development server (runs on http://0.0.0.0:3000)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Type checking
npm run check

# Type checking in watch mode
npm run check:watch

# Database migrations (Drizzle)
npx drizzle-kit generate    # Generate migrations from schema
npx drizzle-kit migrate     # Run migrations
npx drizzle-kit push        # Push schema changes directly (dev only)
npx drizzle-kit studio      # Open Drizzle Studio GUI
```

## Architecture

### Path Aliases

Configured in `svelte.config.js`:
- `$components` → `src/lib/components`
- `$server` → `src/lib/server`
- `$lib` → `src/lib` (SvelteKit default)

### Authentication Flow

Authentication is handled by Better Auth with the Polar plugin:
- Configuration: `src/lib/server/auth.ts`
- Session management via `hooks.server.ts` - sets `event.locals.session`
- Google OAuth is configured as the social provider
- Protected routes: `/dashboard/*` requires authentication
- Auth routes: `/sign-in`, `/sign-up` redirect to `/dashboard` if already authenticated
- Webhook endpoint `/api/auth/polar/webhooks` bypasses authentication

### Database Schema

Located in `src/lib/server/db/schema.ts`:
- **Better Auth tables**: `user`, `session`, `account`, `verification`
- **Subscription table**: Stores Polar subscription data synced via webhooks
- Database connection: `src/lib/server/db/index.ts` uses Neon serverless driver

### Subscription Management

The app integrates Polar for subscription payments:
- **Configuration**: Better Auth Polar plugin in `src/lib/server/auth.ts`
- **Webhook handling**: Subscription webhooks (created, active, canceled, etc.) automatically upsert to the `subscription` table
- **Helper functions**: `src/lib/server/subscription.ts` provides:
  - `getSubscriptionDetails(event)` - Get user's subscription with status
  - `isUserSubscribed(event)` - Check if user has active subscription
  - `hasAccessToProduct(event, productId)` - Check access to specific product
  - `getUserSubscriptionStatus(event)` - Get status: 'active' | 'canceled' | 'expired' | 'none'
- **Environment variables**: `PUBLIC_STARTER_TIER` defines the subscription product

### AI Chat Integration

- **API endpoint**: `src/routes/api/chat/+server.ts`
- Uses Vercel AI SDK with OpenAI's `gpt-4o` model
- Includes web search preview tool
- Streams responses using `streamText()`

### Image Upload

- **Module**: `src/lib/server/upload-image.ts`
- **Storage**: Cloudflare R2 (S3-compatible)
- **API endpoint**: `src/routes/api/upload-image/+server.ts`
- Note: The public URL in `upload-image.ts:25` needs to be replaced with your actual R2 public domain

### Component Structure

- `src/lib/components/ui/` - shadcn-svelte UI components (configured via `components.json`)
- `src/lib/components/homepage/` - Landing page components
- `src/lib/components/dashboard/` - Dashboard-specific components
- `src/lib/components/pricing/` - Pricing page components
- `src/lib/components/logos/` - Logo components
- `src/lib/components/common/` - Shared components
- `src/lib/components/UserProfile.svelte` - User profile component

### Route Structure

- `/` - Landing page
- `/sign-in`, `/sign-up` - Authentication pages
- `/dashboard/*` - Protected dashboard routes
  - `/dashboard/chat` - AI chat interface
  - `/dashboard/payment` - Payment/subscription management
  - `/dashboard/settings` - User settings
  - `/dashboard/upload` - Image upload interface
- `/pricing` - Pricing page
- `/success` - Post-checkout success page
- `/(legal)/privacy-policy` - Legal pages (route group)
- `/api/auth/[...all]` - Better Auth API routes
- `/api/chat` - AI chat API
- `/api/upload-image` - Image upload API

## Important Notes

### Environment Variables

Required environment variables (see `.env`):
- `PUBLIC_APP_URL` - Frontend URL
- `DATABASE_URL` - Neon PostgreSQL connection string
- `BETTER_AUTH_SECRET` - Auth encryption secret
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` - Google OAuth
- `POLAR_ACCESS_TOKEN`, `POLAR_WEBHOOK_SECRET` - Polar payments
- `PUBLIC_STARTER_TIER` - Subscription product ID
- `R2_UPLOAD_IMAGE_ACCESS_KEY_ID`, `R2_UPLOAD_IMAGE_SECRET_ACCESS_KEY`, `CLOUDFLARE_ACCOUNT_ID`, `R2_UPLOAD_IMAGE_BUCKET_NAME` - Cloudflare R2
- `OPENAI_API_KEY` - OpenAI API (currently empty in .env)

### Polar Configuration

The Polar client is configured in **sandbox mode** (`src/lib/server/auth.ts:24`). Change to production when deploying.

### Session Caching

Better Auth session caching is enabled with a 5-minute TTL to reduce database queries.

### Webhook Processing

Subscription webhooks intentionally don't throw errors on failure to avoid webhook retries. Errors are logged but the webhook returns success.

### Database Migrations

The Drizzle schema is at `src/lib/server/db/schema.ts`. After schema changes:
1. Generate migration: `npx drizzle-kit generate`
2. Review migration files in `drizzle/migrations/`
3. Apply migrations: `npx drizzle-kit migrate`

For rapid development, use `npx drizzle-kit push` to push schema changes directly without migrations.
