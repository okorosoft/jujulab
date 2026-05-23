# Changelog

All notable changes to AI Code Learning Platform are listed here. The project follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) and [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2026-02-03
### 🚀 Rebranding & Major Update: ByLearn
- **Core Pivot**: Transformed into "ByLearn - AI Learning & Content Platform"
- **New Feature**: **Coding Powerhouse** - Real-time AI coding assistant with personalized lessons
- **New Feature**: **AI Study Companion** - Math Solver, Expert Tutors, and Subject Mastery tracking
- **New Feature**: **Master Original Writing** - Advanced AI detection & writing refinement
- **New Feature**: **Universal Research** - Multi-model research assistant (GPT-4o, Gemini, DeepSeek)
- **UI Overhaul**: Complete Bento Grid update with new preview components (SubjectMastery, SecurityCompliance, etc.)
- **Bento Grid**: Enhanced dashboard with interactive visualizations for all new modules

## [1.0.0] - 2026-01-23

### 🎉 Initial Release

#### ✨ Core Product
- **AI Code Translator** – Translate code between 30+ programming languages using OpenAI GPT models.
- **AI Lessons** – Generate personalized programming lessons with customizable difficulty levels.
- **AI Practice** – Create and solve AI-generated coding challenges organized into folders.
- **AI Problem Solver** – Chat-based AI tutor for coding help and problem solving.

#### 🔤 Supported Languages
- **Popular Languages** – Python, JavaScript, TypeScript, Java, C++, C#, Go, Rust, Ruby, PHP
- **Mobile Languages** – Swift, Kotlin, Dart
- **Systems Languages** – C, Assembly, Rust
- **Scripting Languages** – Bash, PowerShell, Perl, Lua
- **Data Languages** – SQL, R, MATLAB
- **Functional Languages** – Haskell, Elixir, Scala, Clojure
- **Special** – Natural Language to Code conversion

#### 🤖 AI Features
- **Code Translation** – Translate code between any supported languages with context-aware AI.
- **Lesson Generation** – Create programming lessons on any topic with Easy/Medium/Hard difficulty.
- **Practice Challenges** – Generate coding challenges with AI evaluation and feedback.
- **Problem Solver Chat** – Interactive AI tutor with conversation history.
- **Monaco Editor** – Professional code editor with syntax highlighting for all languages.

#### 💳 Subscription Plans
- **Free Plan** – Limited translations per month, access to all features with usage limits.
- **Pro Plan ($9/month)** – Unlimited translations, unlimited AI features, priority support.
- **Stripe Integration** – Secure subscription payments with Stripe checkout and webhook processing.

#### 🔐 Authentication & Authorization
- **NextAuth.js** – Industry-standard authentication with JWT sessions.
- **Credentials Auth** – Email/password authentication with bcrypt password hashing.
- **OAuth Providers** – Google and GitHub OAuth login support.
- **Password Reset** – Secure password reset flow with email verification via SMTP.
- **User Management** – User accounts with profile management and subscription tracking.

#### 📊 Dashboard Features
- **Stats Overview** – View translation counts, lessons, practice progress, and tutor chats.
- **Quick Actions** – Easy access to all AI features from the dashboard.
- **Translation History** – View and manage past code translations.
- **Settings** – Manage profile and account settings.
- **Billing** – View and manage subscription with Stripe customer portal.

### 🛠️ Technical Stack
- **Framework**: Next.js 14 (Pages Router), React 18, TypeScript.
- **Data Layer**: MongoDB with native driver (users, translations, lessons, challenges, conversations).
- **Auth**: NextAuth.js with JWT sessions, bcrypt password hashing.
- **Payments**: Stripe SDK, subscription-based checkout sessions, webhook-driven fulfillment.
- **AI**: OpenAI API (GPT-4o-mini/GPT-4o for code translation and generation).
- **Code Editor**: Monaco Editor with syntax highlighting for 30+ languages.
- **UI Kit**: Tailwind CSS, custom components, lucide-react icons.

### 🚀 Deployment Notes
- **Vercel** – Recommended deployment option with automatic scaling and environment variable setup.
- **AWS EC2** – Guide included for Ubuntu server deployment with PM2 and Nginx.
- **Environment Variables** – Comprehensive setup guide for all required API keys and configuration.

### 📚 Documentation Coverage
- Complete user guide for all AI features (Translator, Lessons, Practice, Tutor).
- Step-by-step deployment guides for Vercel and AWS EC2.
- Environment setup, MongoDB configuration, and Stripe integration guides.
- OpenAI API setup and configuration guide.
- Email (SMTP) setup for password reset functionality.
- OAuth setup for Google and GitHub social login.
- Frontend customization and subscription configuration guides.
- Pricing and usage validation configuration.

---

Need help? Check the included documentation set or reach out through the project's support channels. Continuous updates will follow this changelog format.
