# COM7 Assignment Management System

A modern, full-stack assignment management system built with Next.js, TypeScript, and PostgreSQL. The system provides assignment creation, tracking, and review capabilities with role-based access control, a leaderboard, and a configurable level/badge system.

## Features

### Core Functionality
- **User Authentication** — JWT-based login, registration, and session management with HTTP-only cookies
- **Password Reset** — Admin-triggered password reset via email (SendGrid)
- **Profile Image Upload** — Cloudinary-backed avatar upload on profile settings
- **Assignment Management** — Create, view, update, delete, and rebuild assignments
- **Review System** — Assignment review with scoring, feedback, and approval workflow
- **Role-Based Access** — Three roles: `STAFF`, `ADMIN`, and `SUPER_ADMIN` with scoped permissions
- **File Upload** — Cloudinary integration for assignment submissions
- **Email Notifications** — SendGrid integration for user notifications
- **Late Submission Indicator** — Card-level badge shown when a submission is after the deadline

### Leaderboard
- All-time and per-month/year leaderboard rankings
- Animated top-3 podium display with rank-based visual styles
- Period filtering (Super Admin only)
- Score displayed as a completion percentage

### Level & Badge System
- Configurable score-range levels with emoji, name, and custom color
- Overlap validation on both frontend and backend
- Level badge displayed on user profiles and leaderboard entries
- Animated score progress bar tied to leaderboard total score

### Dashboard
- **User Dashboard** — Profile card with level badge, animated score progress bar, personal rank, and KPI stats
- **Admin Dashboard** — Aggregate KPIs and charts for assignments, scores, and user activity
- Colorful info grid showing user details

### Score Management
- Per-user score reset (Super Admin only)
- Score history linked to individual assignments

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js (App Router) |
| Language | TypeScript 5 |
| UI | React 19, Tailwind CSS v4, shadcn/ui, Recharts |
| ORM | Prisma |
| Database | PostgreSQL (via Supabase) |
| Auth | JWT, bcryptjs |
| File Storage | Cloudinary |
| Email | SendGrid |
| State / Fetching | TanStack React Query v5 |
| Forms | React Hook Form + Zod |
| Package Manager | pnpm |

## Database Schema

### User
- UUID, username (unique), email, nickname, hashed password, profileImage
- Role: `STAFF` | `ADMIN` | `SUPER_ADMIN`

### Assignment
- Full lifecycle: created → submitted → reviewed (Pending / Approved / Rejected)
- Supports `Individual` and `Group` types
- Fields: title, description, reward, deadline, submissionUrl, feedback, finalScore, submitAt
- Sorted by deadline (ascending)

### Score
- Links a `User` (recipient) and optional `Assignment`
- Tracks reviewer, score value, and timestamps

### Level
- Configurable score ranges with name, emoji, color
- Used to classify users on the leaderboard and profile cards

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL database (or Supabase project)
- Cloudinary account
- SendGrid account

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd com7-assignment-system
```

2. **Install dependencies**
```bash
pnpm install
```

3. **Environment setup** — create a `.env` file:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/dbname"
DIRECT_URL="postgresql://username:password@localhost:5432/dbname"
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"
SENDGRID_API_KEY="your-sendgrid-key"
JWT_SECRET="your-jwt-secret"
```

4. **Database setup**
```bash
npx prisma generate
npx prisma db push
```

5. **Seed initial data** (optional)
```bash
pnpm seed
```

6. **Run the development server**
```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

## API Endpoints

### Auth
| Method | Path | Description |
|---|---|---|
| POST | `/api/auth/register` | Register a new user |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/logout` | Logout |
| GET | `/api/auth/me` | Get current user |
| GET | `/api/auth/get-users` | List all users (Admin+) |
| PUT | `/api/auth/update/[id]` | Update user profile |
| DELETE | `/api/auth/delete/[id]` | Delete user |
| POST | `/api/auth/reset-password` | Reset user password (Admin+) |

### Assignments
| Method | Path | Description |
|---|---|---|
| GET | `/api/assignment` | List assignments (sorted by deadline) |
| POST | `/api/assignment` | Create assignment |
| GET/PUT/DELETE | `/api/assignment/[id]` | Get / update / delete |
| POST | `/api/assignment/[id]/rebuild` | Rebuild (clone) assignment with new deadline |
| PUT | `/api/assignment/review/[id]` | Review and score |
| POST | `/api/assignment/submission/[id]` | Submit assignment |

### Dashboard
| Method | Path | Description |
|---|---|---|
| GET | `/api/assignment/dashboard/user` | User KPIs and charts |
| GET | `/api/assignment/dashboard/admin` | Admin KPIs and charts |

### Leaderboard
| Method | Path | Description |
|---|---|---|
| GET | `/api/leaderboard` | Admin leaderboard (with filters) |
| GET | `/api/leaderboard/public` | Public leaderboard (all roles) |

### Levels
| Method | Path | Description |
|---|---|---|
| GET/POST | `/api/level` | List / create levels |
| PUT/DELETE | `/api/level/[id]` | Update / delete level |

### Score
| Method | Path | Description |
|---|---|---|
| DELETE | `/api/score/reset/[userId]` | Reset all scores for a user (Super Admin) |

### Upload
| Method | Path | Description |
|---|---|---|
| POST | `/api/upload` | Upload file to Cloudinary |

## Available Scripts

```bash
pnpm dev        # Start development server
pnpm build      # Build for production
pnpm start      # Start production server
pnpm lint       # Run ESLint
pnpm seed       # Seed the database
```

## Database Management

```bash
npx prisma studio     # Open Prisma Studio GUI
npx prisma generate   # Regenerate Prisma client
npx prisma db push    # Push schema changes to the database
npx prisma migrate    # Run migrations
```

## Project Structure

```
├── app/
│   ├── (main)/                  # Authenticated app pages
│   │   ├── dashboard/           # User & admin dashboard
│   │   ├── assignment/          # Assignment list, add, manage, review
│   │   ├── leaderboard/         # Leaderboard page
│   │   ├── level-management/    # Level CRUD page (Super Admin)
│   │   └── user-management/     # User management (Super Admin)
│   └── api/                     # API route handlers
│       ├── auth/                # Auth endpoints (login, register, reset-password, etc.)
│       ├── assignment/          # Assignment + dashboard + rebuild endpoints
│       ├── leaderboard/         # Leaderboard endpoints
│       ├── level/               # Level endpoints
│       ├── score/               # Score reset endpoint
│       └── upload/              # File upload endpoint
├── components/
│   ├── card/                    # Assignment card with late submission badge
│   ├── chart/                   # Recharts-based chart components
│   ├── dashboard/               # Profile card, leaderboard widget, KPI grid
│   ├── dialog/                  # Rebuild, review, and other action dialogs
│   ├── form/                    # Assignment and user forms
│   ├── leaderboard/             # Podium card, table, filters, skeleton
│   ├── level-management/        # Level table, form, dialogs, utils
│   ├── shared/                  # LevelBadge and other shared UI
│   ├── table/                   # Reusable table components
│   └── ui/                      # shadcn/ui primitives
├── hooks/                       # React Query hooks
├── services/                    # API call functions
├── types/                       # TypeScript interfaces
├── contexts/                    # Auth context
├── prisma/                      # Schema and seed file
└── lib/                         # Prisma client, auth, middleware
```

## Security

- Passwords hashed with **bcrypt**
- **JWT** tokens stored in HTTP-only cookies
- All API routes validate the token via `isAuthorize` middleware
- Role checks enforced server-side on sensitive endpoints
- Input validation on all create/update routes

## License

This project is licensed under the MIT License.
