# COM7 Assignment Management System

A modern, full-stack assignment management system built with Next.js, TypeScript, and PostgreSQL. This system provides comprehensive assignment creation, tracking, and review capabilities with secure user authentication.

## 🚀 Features

### Core Functionality
- **User Authentication**: Secure login, registration, and session management with JWT
- **Assignment Management**: Create, view, update, and delete assignments
- **Review System**: Comprehensive assignment review with scoring and feedback
- **Role-Based Access**: Staff and Super Admin roles with different permissions
- **File Upload**: Cloudinary integration for assignment submissions
- **Email Notifications**: SendGrid integration for user notifications

### Technical Features
- **Database**: PostgreSQL with Prisma ORM
- **API**: RESTful APIs with Next.js App Router
- **Authentication**: JWT tokens with bcrypt password hashing
- **File Storage**: Cloudinary for media uploads
- **Styling**: Tailwind CSS for modern UI
- **Type Safety**: Full TypeScript implementation

## 🛠️ Tech Stack

- **Frontend**: Next.js 16.1.6, React 19.2.3, TypeScript
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL
- **Authentication**: JWT, bcryptjs
- **File Storage**: Cloudinary
- **Email**: SendGrid
- **Styling**: Tailwind CSS
- **Package Manager**: pnpm

## 📋 Database Schema

The system uses three main entities:

### Users
- UUID-based identification
- Username, email, and password authentication
- Role-based access (STAFF, SUPER_ADMIN)
- Timestamp tracking

### Assignments
- Complete assignment lifecycle management
- Support for Individual and Group assignments
- Deadline tracking and submission management
- Review status (Pending, Approved, Rejected)
- Scoring and feedback system

### Scores
- Assignment scoring and review tracking
- Reviewer assignment and score management
- Historical score tracking

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- PostgreSQL database
- Cloudinary account (for file uploads)
- SendGrid account (for emails)

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd COM7-Assingment-System/code-base
```

2. **Install dependencies**
```bash
pnpm install
```

3. **Environment setup**
Create a `.env` file with the following variables:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/dbname"
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

5. **Run the development server**
```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 📚 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/update/[id]` - Update user
- `DELETE /api/auth/delete/[id]` - Delete user

### Assignments
- `GET /api/assignment` - Get all assignments
- `POST /api/assignment` - Create assignment
- `GET /api/assignment/[id]` - Get specific assignment
- `PUT /api/assignment/[id]` - Update assignment
- `DELETE /api/assignment/[id]` - Delete assignment
- `PUT /api/assignment/review/[id]` - Review assignment
- `POST /api/assignment/submission/[id]` - Submit assignment

## 🔧 Development

### Available Scripts
- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint

### Database Management
```bash
npx prisma studio    # Open Prisma Studio
npx prisma generate  # Generate Prisma client
npx prisma db push   # Push schema to database
npx prisma migrate   # Run database migrations
```

## 🏗️ Project Structure

```
├── app/
│   ├── api/                 # API routes
│   │   ├── auth/           # Authentication endpoints
│   │   └── assignment/     # Assignment endpoints
│   ├── generated/          # Prisma generated files
│   └── layout.tsx          # Root layout
├── components/             # React components
├── lib/                   # Utility libraries
│   ├── auth.ts           # Authentication utilities
│   ├── cloudinary.ts     # Cloudinary config
│   ├── middleware.ts     # Next.js middleware
│   └── prisma.ts         # Prisma client
├── prisma/               # Database schema
├── types/                # TypeScript types
└── public/               # Static assets
```

## 🔐 Security Features

- **Password Hashing**: bcrypt for secure password storage
- **JWT Authentication**: Secure token-based authentication
- **Input Validation**: Comprehensive API input validation
- **CORS Protection**: Proper CORS configuration
- **Environment Variables**: Secure configuration management

## 📝 License

This project is licensed under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request
