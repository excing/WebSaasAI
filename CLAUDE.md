# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a SvelteKit starter kit with authentication, payments, and AI chat capabilities.

## Tech Stack

### Frontend Framework
| Tech | Version | Purpose |
|------|---------|---------|
| **SvelteKit** | ^2.49.1 | Full-stack framework |
| **Svelte 5** | ^5.45.6 | UI framework (Runes syntax) |
| **Vite** | ^7.2.6 | Build tool |
| **TypeScript** | ^5.9.3 | Type safety |

### Styling & UI
| Tech | Version | Purpose |
|------|---------|---------|
| **Tailwind CSS v4** | ^4.1.18 | CSS framework |
| **shadcn-svelte** | - | UI component library (125+ components) |
| **bits-ui** | ^2.15.4 | Accessible component primitives |
| **Lucide Icons** | ^0.562.0 | Icon library |
| **tailwind-variants** | ^3.2.2 | Component variant management |

### Backend & Database
| Tech | Version | Purpose |
|------|---------|---------|
| **Drizzle ORM** | ^0.45.1 | Database ORM |
| **Neon PostgreSQL** | ^1.0.2 | Serverless database |

### Authentication & Payments
| Tech | Version | Purpose |
|------|---------|---------|
| **Better Auth** | ^1.4.12 | Authentication framework |
| **@polar-sh/better-auth** | ^1.6.4 | Polar payment integration |
| **@polar-sh/sdk** | ^0.42.2 | Polar API SDK |

### AI Capabilities
| Tech | Version | Purpose |
|------|---------|---------|
| **Vercel AI SDK** | ^6.0.35 | AI chat framework |
| **@ai-sdk/openai** | ^3.0.10 | OpenAI integration |

### Storage & Others
| Tech | Version | Purpose |
|------|---------|---------|
| **@aws-sdk/client-s3** | ^3.969.0 | Cloudflare R2 storage |
| **Resend** | ^6.7.0 | Email service |
| **canvas-confetti** | ^1.9.4 | Celebration animations |
| **layerchart** | ^1.0.13 | Chart library |

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

## Project Structure

```
src/
├── lib/
│   ├── components/
│   │   ├── ui/          # 125+ shadcn-svelte components
│   │   ├── homepage/    # Landing page components
│   │   ├── dashboard/   # Dashboard components
│   │   ├── pricing/     # Pricing components
│   │   ├── logos/       # Logo components
│   │   └── common/      # Shared components
│   └── server/
│       ├── auth.ts          # Authentication configuration
│       ├── db/              # Database config & schema
│       ├── subscription.ts  # Subscription helpers
│       └── upload-image.ts  # R2 upload
└── routes/
    ├── /                    # Landing page
    ├── sign-in/             # Sign in page
    ├── sign-up/             # Sign up page
    ├── verify-email/        # Email verification
    ├── forgot-password/     # Password recovery
    ├── reset-password/      # Password reset
    ├── pricing/             # Pricing page
    ├── success/             # Post-checkout success
    ├── dashboard/           # Protected dashboard routes
    │   ├── chat/            # AI chat interface
    │   ├── payment/         # Subscription management
    │   ├── settings/        # User settings (with billing history)
    │   └── upload/          # Image upload
    ├── api/
    │   ├── auth/[...all]    # Better Auth routes
    │   ├── chat/            # AI chat API
    │   ├── orders/          # Orders API
    │   ├── subscription/    # Subscription API
    │   └── upload-image/    # Image upload API
    └── (legal)/             # Legal pages (privacy policy, etc.)
```

## Path Aliases

Configured in `svelte.config.js`:
- `$components` → `src/lib/components`
- `$server` → `src/lib/server`
- `$lib` → `src/lib` (SvelteKit default)

## Database Schema

Located in `src/lib/server/db/schema.ts`:

| Table | Purpose |
|-------|---------|
| `user` | User information |
| `session` | Session management |
| `account` | OAuth account linking |
| `verification` | Email verification codes |
| `subscription` | Polar subscription data |
| `order` | Polar one-time orders |
| `rate_limit` | Rate limiting |

## Authentication Flow

Authentication is handled by Better Auth with the Polar plugin:
- Configuration: `src/lib/server/auth.ts`
- Session management via `hooks.server.ts` - sets `event.locals.session`
- Google OAuth is configured as the social provider
- Protected routes: `/dashboard/*` requires authentication
- Auth routes: `/sign-in`, `/sign-up` redirect to `/dashboard` if already authenticated
- Webhook endpoint `/api/auth/polar/webhooks` bypasses authentication

## Subscription Management

The app integrates Polar for subscription payments:
- **Configuration**: Better Auth Polar plugin in `src/lib/server/auth.ts`
- **Webhook handling**: Subscription webhooks (created, active, canceled, etc.) automatically upsert to the `subscription` table
- **Helper functions** in `src/lib/server/subscription.ts`:
  - `getSubscriptionDetails(event)` - Get user's subscription with status
  - `isUserSubscribed(event)` - Check if user has active subscription
  - `hasAccessToProduct(event, productId)` - Check access to specific product
  - `getUserSubscriptionStatus(event)` - Get status: 'active' | 'canceled' | 'expired' | 'none'
- **Environment variables**: `PUBLIC_STARTER_TIER` defines the subscription product

## AI Chat Integration

- **API endpoint**: `src/routes/api/chat/+server.ts`
- Uses Vercel AI SDK with OpenAI's `gpt-4o` model
- Includes web search preview tool
- Streams responses using `streamText()`

## Image Upload

- **Module**: `src/lib/server/upload-image.ts`
- **Storage**: Cloudflare R2 (S3-compatible)
- **API endpoint**: `src/routes/api/upload-image/+server.ts`
- Note: The public URL in `upload-image.ts:25` needs to be replaced with your actual R2 public domain

## Environment Variables

Required environment variables (see `.env`):
- `PUBLIC_APP_URL` - Frontend URL
- `DATABASE_URL` - Neon PostgreSQL connection string
- `BETTER_AUTH_SECRET` - Auth encryption secret
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` - Google OAuth
- `POLAR_ACCESS_TOKEN`, `POLAR_WEBHOOK_SECRET` - Polar payments
- `PUBLIC_STARTER_TIER` - Subscription product ID
- `R2_UPLOAD_IMAGE_ACCESS_KEY_ID`, `R2_UPLOAD_IMAGE_SECRET_ACCESS_KEY`, `CLOUDFLARE_ACCOUNT_ID`, `R2_UPLOAD_IMAGE_BUCKET_NAME` - Cloudflare R2
- `OPENAI_API_KEY` - OpenAI API

## Important Notes

### Polar Configuration
The Polar client is configured in **sandbox mode** (`src/lib/server/auth.ts:24`). Change to production when deploying.

### Session Caching
Better Auth session caching is enabled with a 5-minute TTL to reduce database queries.

### Webhook Processing
Subscription webhooks intentionally don't throw errors on failure to avoid webhook retries. Errors are logged but the webhook returns success.

### Database Migrations
After schema changes:
1. Generate migration: `npx drizzle-kit generate`
2. Review migration files in `drizzle/migrations/`
3. Apply migrations: `npx drizzle-kit migrate`

For rapid development, use `npx drizzle-kit push` to push schema changes directly without migrations.
