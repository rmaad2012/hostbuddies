# Host Buddies - Gamified AI Guest Experience

A Next.js web application that provides a gamified AI agent experience for Airbnb guests, complete with quest tracking, chat functionality, and reward systems.

## 🚀 Features

- **Interactive Guest Sessions**: Dynamic routes for individual guest experiences
- **Gamified Quest System**: Photo and text-based challenges with progress tracking
- **AI Chat Agent**: OpenAI-powered FAQ assistance with RAG over property knowledge base
- **Real-time Progress**: Visual progress bars and celebration animations
- **Supabase Integration**: Full database connectivity for sessions, tracks, and submissions
- **Responsive Design**: Mobile-friendly UI with brand-consistent styling

## 🛠️ Tech Stack

- **Frontend**: Next.js 15 (App Router), TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL)
- **AI**: OpenAI GPT-4o-mini
- **Animations**: Canvas Confetti, Framer Motion
- **Icons**: Lucide React

## 📋 Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account
- OpenAI API key

## 🔧 Installation

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd hostbuddies
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   Create a `.env.local` file in the root directory:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://daasugoddauwhqzxorsc.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRhYXN1Z29kZGF1d2hxenhvcnNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgwNjcwNzMsImV4cCI6MjA3MzY0MzA3M30.CkyVoGEbT0RUBkJnd4ZPKKoie3_skQOofIatSIHOOKo
   OPENAI_API_KEY=your_openai_api_key_here
   
   # OAuth Configuration (optional - for social login)
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   GITHUB_CLIENT_ID=your_github_client_id
   GITHUB_CLIENT_SECRET=your_github_client_secret
   ```

4. **Set up Google OAuth (Optional)**:
   To enable Google login:
   
   a. Go to [Google Cloud Console](https://console.cloud.google.com/)
   b. Create a new project or select an existing one
   c. Enable the Google+ API
   d. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client IDs"
   e. Set application type to "Web application"
   f. Add authorized redirect URIs:
      - `http://localhost:54321/auth/v1/callback` (for local development)
      - `https://daasugoddauwhqzxorsc.supabase.co/auth/v1/callback` (for production)
   g. Copy the Client ID and Client Secret to your `.env.local` file

5. **Set up the database**:
   Create the following tables in your Supabase database:

   ```sql
   -- Properties table
   CREATE TABLE properties (
     id TEXT PRIMARY KEY,
     name TEXT NOT NULL,
     created_at TIMESTAMP DEFAULT NOW()
   );

   -- Tracks table
   CREATE TABLE tracks (
     id TEXT PRIMARY KEY,
     name TEXT NOT NULL,
     description TEXT,
     total_steps INTEGER NOT NULL,
     badge_emoji TEXT,
     created_at TIMESTAMP DEFAULT NOW()
   );

   -- Guest sessions table
   CREATE TABLE guest_sessions (
     id TEXT PRIMARY KEY,
     property_id TEXT REFERENCES properties(id),
     guest_hash TEXT NOT NULL,
     track_id TEXT REFERENCES tracks(id),
     points INTEGER DEFAULT 0,
     status TEXT DEFAULT 'active',
     created_at TIMESTAMP DEFAULT NOW(),
     updated_at TIMESTAMP DEFAULT NOW()
   );

   -- Track steps table
   CREATE TABLE track_steps (
     id TEXT PRIMARY KEY,
     track_id TEXT REFERENCES tracks(id),
     order_idx INTEGER NOT NULL,
     prompt TEXT NOT NULL,
     quest_type TEXT CHECK (quest_type IN ('photo', 'text')),
     created_at TIMESTAMP DEFAULT NOW()
   );

   -- Submissions table
   CREATE TABLE submissions (
     id TEXT PRIMARY KEY,
     session_id TEXT REFERENCES guest_sessions(id),
     step_id TEXT REFERENCES track_steps(id),
     proof_url TEXT,
     text_content TEXT,
     approved_bool BOOLEAN DEFAULT FALSE,
     points_awarded INTEGER DEFAULT 0,
     created_at TIMESTAMP DEFAULT NOW()
   );

   -- Knowledge base table
   CREATE TABLE kb_docs (
     id TEXT PRIMARY KEY,
     property_id TEXT REFERENCES properties(id),
     question TEXT NOT NULL,
     answer TEXT NOT NULL,
     created_at TIMESTAMP DEFAULT NOW()
   );
   ```

5. **Run the development server**:
   ```bash
   npm run dev
   ```

6. **Open your browser**:
   Navigate to [http://localhost:3000/guest/session-123](http://localhost:3000/guest/session-123)

## 🎯 Usage

### For Guests
1. Visit `/guest/[sessionId]` to start your quest
2. Complete photo and text challenges to earn points
3. Chat with the AI agent for property information
4. Track your progress and earn badges

### For Hosts
- Configure property knowledge base through Supabase
- Set up custom quest tracks and steps
- Monitor guest engagement and progress

## 🎨 Brand Colors

The application uses a consistent purple color scheme:
- Primary: `#532de0`
- Secondary: `#8b5cf6`
- Accent: `#a855f7`

## 🧪 Development

The application includes mock data for development purposes. All Supabase queries fall back to mock responses when the database is not available.

### Key Files
- `src/app/guest/[sessionId]/page.tsx` - Main guest interface
- `src/lib/supabase.ts` - Database client and helper functions
- `src/app/api/chat/route.ts` - OpenAI chat API endpoint
- `src/hooks/useChat.ts` - Chat integration hook

## 🚀 Deployment

1. **Build the application**:
   ```bash
   npm run build
   ```

2. **Deploy to Vercel** (recommended):
   ```bash
   npx vercel --prod
   ```

3. **Set environment variables** in your deployment platform

## 📝 License

This project is licensed under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

---

Built with ❤️ for creating memorable guest experiences