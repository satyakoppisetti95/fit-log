# FitLog - Fitness Tracker

A Progressive Web App (PWA) for tracking calories and exercise, built with Next.js, TypeScript, and Tailwind CSS.

## Features

- 🔐 Authentication with JWT stored in HTTP-only cookies
- 🌓 Light/Dark theme support
- 🎨 Customizable accent colors (Green, Blue, Orange, Purple)
- 📱 Mobile-first responsive design
- 🔒 Protected routes
- 📲 PWA support for installable app experience

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- MongoDB (local installation or MongoDB Atlas account)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Create a `.env.local` file:
```env
NEXTAUTH_SECRET=your-secret-key-here
NEXTAUTH_URL=http://localhost:3000
MONGODB_URI=mongodb://localhost:27017/fitlog
```

   For MongoDB Atlas (cloud), use:
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/fitlog?retryWrites=true&w=majority
```

3. Run the development server:
```bash
npm run dev
```

4. Initialize the demo user in MongoDB:

   **Option 1: Using npm script (recommended)**
   ```bash
   npm run init-demo
   ```

   **Option 2: Using API endpoint (if script fails)**
   ```bash
   # Start the dev server first
   npm run dev
   
   # In another terminal, call the API
   curl -X POST http://localhost:3000/api/auth/init-demo
   ```

   This will create a demo user with:
   - Username: `demo`
   - Password: `password`

   Or register a new account through the registration API endpoint `/api/auth/register`.

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Demo Credentials

After running the init script:
- Username: `demo`
- Password: `password`

Or register a new account through the API endpoint `/api/auth/register`.

## Project Structure

```
fit-log/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── dashboard/         # Dashboard page
│   ├── recipes/           # Recipes page
│   ├── add/               # Add entry page
│   ├── exercise/          # Exercise page
│   ├── profile/           # Profile & settings page
│   └── login/             # Login page
├── components/            # React components
├── lib/                   # Utility functions
├── models/                # MongoDB models
├── scripts/               # Utility scripts
├── public/                # Static assets
└── middleware.ts          # Route protection
```

## Navigation

The app includes a bottom navigation bar with the following tabs:
- **Dashboard** - Main overview
- **Recipes** - Recipe management
- **Add** - Quick add entry (centered button)
- **Exercise** - Exercise tracking
- **Profile** - Settings and account

## Theme System

The app supports:
- **Light theme** - Light background with dark text
- **Dark theme** - Dark background with light text
- **Accent colors** - Green (default), Blue, Orange, Purple

Theme preferences are saved in localStorage and persist across sessions.

## Authentication

- NextAuth.js authentication (Edge Runtime compatible)
- JWT-based sessions stored in HTTP-only cookies
- 7-day session expiration
- Protected routes via NextAuth middleware
- User data stored in MongoDB
- Password hashing with bcrypt
- Registration API endpoint available at `/api/auth/register`

## PWA Features

PWA support is temporarily disabled due to Node.js 25 compatibility issues with next-pwa. The manifest.json is still configured and can be re-enabled once a compatible PWA solution is implemented.

To enable PWA features:
- Installable on mobile devices
- Works offline (with service worker)
- App-like experience

## Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## Tech Stack

- **Next.js 14** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Lucide React** - Icons
- **MongoDB** - Database
- **Mongoose** - MongoDB ODM
- **NextAuth.js** - Authentication (Edge Runtime compatible)
- **bcryptjs** - Password hashing
