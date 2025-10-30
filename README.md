# Sprintopia UI

A joyful home for agile discussions and estimation application, featuring real-time collaboration and planning poker sessions.

This is the frontend UI for Sprintopia, built with React, TypeScript, Vite, and Tailwind CSS, featuring shadcn/ui components and Supabase real-time functionality.

## Features

- **Create Grooming Sessions** - Start new planning poker sessions with your team
- **Real-time Collaboration** - Live updates using Supabase real-time channels
- **Session Management** - Navigate between sessions with persistent state
- **API Integration** - Seamless connection with FastAPI backend
- **Responsive Design** - Beautiful UI that works on all devices

## Tech Stack

- **React 19** - Latest React with React Compiler
- **TypeScript** - Type safety and better development experience
- **Vite** - Fast build tool and development server
- **React Router** - Client-side routing and navigation
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - Beautiful and accessible UI components
- **Supabase** - Real-time database and authentication
- **Lucide React** - Icon library

## Getting Started

### Prerequisites

- Node.js 18+ or 20+
- pnpm (recommended) or npm
- FastAPI backend running at `http://127.0.0.1:8000`
- Supabase project (for real-time features)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/lydongcanh/sprintopia-ui.git
cd sprintopia-ui
```

2. Install dependencies:
```bash
pnpm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your Supabase credentials
```

4. Start the development server:
```bash
pnpm dev
```

5. Open [http://localhost:5173](http://localhost:5173) in your browser.

## Available Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm preview` - Preview production build
- `pnpm lint` - Run ESLint

## Project Structure

```
src/
  components/        # Reusable UI components
    ui/             # shadcn/ui components
  hooks/            # Custom React hooks
    useRealtimeChannel.ts  # Supabase real-time hook
  lib/              # Utility functions
    utils.ts        # cn() utility and other helpers
    supabase.ts     # Supabase client configuration
  pages/            # Application pages
    HomePage.tsx    # Landing page with session creation
    SessionPage.tsx # Grooming session with real-time features
  services/         # API and external services
    api.ts          # FastAPI integration
  types/            # TypeScript type definitions
    api.ts          # API response types
  App.tsx           # Main application with routing
  main.tsx          # Application entry point
  index.css         # Global styles with Tailwind
```

## API Integration

The app integrates with the FastAPI backend running at `http://127.0.0.1:8000`. Key endpoints:

- `POST /api/v1/grooming-sessions` - Create new session
- `GET /api/v1/grooming-sessions/{session_id}` - Get session details

Each session includes a `real_time_channel_name` for Supabase real-time communication.

## Real-time Features

Sessions use Supabase real-time channels for:
- Live collaboration updates
- Participant presence tracking
- Message broadcasting
- Session state synchronization

## Development

The project is set up with:
- **React Compiler** - Automatic optimization
- **Path aliases** - Use `@/` to import from `src/`
- **ESLint** - Code linting with strict rules
- **TypeScript** strict mode
- **Hot module replacement** - Fast development iteration

## Adding UI Components

This project uses shadcn/ui. To add new components:

```bash
npx shadcn@latest add button
npx shadcn@latest add card
npx shadcn@latest add dialog
```

## Environment Variables

Copy `.env.example` to `.env` and configure:

- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Your Supabase anonymous key

## Related Projects

- [Sprintopia Backend](https://github.com/lydongcanh/sprintopia) - The main FastAPI backend service

## License

MIT