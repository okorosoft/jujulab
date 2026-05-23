# ByLearn - AI Learning & Content Platform

Transform AI-generated content into natural, human-like writing and master programming with our comprehensive AI platform. ByLearn combines advanced academic tools—like a virtual coding assistant, math solver, and subject tutor—with powerful content integrity features.

## 🚀 Features

### ✨ Core Functionality
- **Coding Powerhouse**: Real-time AI coding assistant with personalized lessons and practice challenges
- **AI Study Companion**: Math Solver, Expert Tutors, and Subject Mastery tracking
- **Master Original Writing**: Advanced AI detection and academic writing refinement (99.9% bypass rate)
- **Universal Research**: Multi-model research assistant (GPT-4o, Gemini, DeepSeek)
- **Multi-Language**: Precise translation and global content support
- **17+ AI Tools**: Complete toolkit for content creation, analysis, and educational mastery
- **Real-time Processing**: Fast processing with streaming support for responsive user experience
- **File Upload Support**: Upload and process documents (PDF, DOCX, TXT, Images, Videos) up to 25MB
- **Document Management**: Save and manage your processed documents and learning progress

### 🤖 Available Tools

**Free Tools (No purchase needed, but require credits):**
- AI Humanize - Transform AI content into human-like writing
- AI Detector - Detect AI-generated content
- Ask AI - Chat with GPT-4o, DeepSeek, and Gemini models
- Word Counter - Count words and characters
- Character Counter - Count characters, words, and paragraphs

**Purchasable Tools ($1 each):**
- AI Image Detection - Detect if images are AI-generated
- AI Video Detection - Detect if videos are AI-generated
- Summarizer - Summarize text, PDFs, Word docs, YouTube videos, and images
- AI Homework Helper - Get help with homework across multiple subjects
- AI Math Solver - Solve math problems with step-by-step solutions
- Grammar Check - Check and correct grammar errors
- Spell Check - Find and fix spelling mistakes
- Plagiarism Check - Detect plagiarism using ZeroGPT
- AI Translator - Translate text between multiple languages
- HTML to Text - Convert HTML code to plain text
- Text to HTML - Convert plain text to HTML format
- PDF to HTML - Convert PDF documents to HTML

### 🔐 Authentication & User Management
- **Clerk Integration**: Secure authentication with social logins and email/password
- **User Profiles**: Complete profile management with credit tracking
- **Session Management**: Robust session handling with auto-refresh capabilities

### 💳 Credit-Based System
- **Flexible Pricing**: Purchase credits for individual tools or get the Super Saving Plan
- **Individual Tool Credits**: $1 = 10,000 characters (most tools), $1 = 5 images (Image Detection), $1 = 2 videos (Video Detection)
- **Super Saving Plan**: $17 for credits across all 17 tools (10K chars per tool, 5 images, 2 videos)
- **Stripe Integration**: Secure payment processing with immediate credit updates
- **Real-time Credit Tracking**: Live credit balance updates across all tools

### 🎨 Modern UI/UX
- **Responsive Design**: Mobile-first approach with excellent cross-device support
- **Dark Mode**: Complete theme support with system preference detection
- **Smooth Animations**: Framer Motion powered transitions and micro-interactions
- **Professional Aesthetics**: Glass-morphism effects, modern typography, and clean layouts

## 🛠 Tech Stack

- **Framework**: Next.js 15 with App Router
- **AI Services**: 
  - Undetectable AI API for humanization
  - OpenAI API (GPT-4o) for various AI tools
  - Google Gemini API for Ask AI and document processing
  - DeepSeek API for Ask AI
- **Detection APIs**: 
  - ZeroGPT API for AI detection and plagiarism checks
  - Undetectable AI API for image and video detection
- **Additional Services**:
  - Supadata API for YouTube transcript extraction
- **Authentication**: Clerk for user management
- **Payments**: Stripe for credit purchases and tool purchases
- **Styling**: Tailwind CSS with custom design system
- **Animations**: Framer Motion
- **Database**: MongoDB for document storage and usage tracking
- **Deployment**: Vercel

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Undetectable AI API key (for humanization)
- OpenAI API key (for various AI tools)
- Google Gemini API key (for Ask AI and document processing)
- DeepSeek API key (for Ask AI)
- ZeroGPT API key (for AI detection and plagiarism checks)
- Supadata API key (for YouTube transcript extraction)
- Clerk account and API keys
- Stripe account with webhooks configured
- MongoDB connection string

### 1. Clone and Install
```bash
git clone <repository-url>
cd Aihuman-detect-envato
npm install
```

### 2. Environment Configuration
Copy `env_example` to `.env.local` and configure:

```env
# Application Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Database Configuration
MONGODB_URI=your-mongodb-connection-string

# AI Provider Configuration
OPENAI_API_KEY=your-openai-api-key
GEMINI_API_KEY=your-gemini-api-key
DEEPSEEK_API_KEY=your-deepseek-api-key
UNDETECTABLE_API_KEY=your-undetectable-api-key
UNDETECTABLE_API_URL=https://api.undetectable.ai
ZEROGPT_API_KEY=your-zerogpt-api-key
SUPADATA_API_KEY=your-supadata-api-key

# Authentication (Clerk)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your-clerk-key
CLERK_SECRET_KEY=sk_test_your-clerk-secret
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/

# Payment Processing (Stripe)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your-stripe-key
STRIPE_SECRET_KEY=sk_test_your-stripe-secret
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret
```

**Note**: See `env_example` for complete list of all environment variables with descriptions.

### 3. Stripe Webhook Setup
1. Create a webhook endpoint in Stripe Dashboard
2. Point to: `https://your-domain.com/api/stripe-webhook`
3. Listen for events: `checkout.session.completed`, `payment_intent.succeeded`
4. Copy webhook secret to `STRIPE_WEBHOOK_SECRET`

### 4. Run Development Server
```bash
npm run dev
```

Visit `http://localhost:3000` to see the application.

## 📁 Project Structure

```
├── app/
│   ├── (preview)/              # Main application pages
│   │   ├── page.tsx           # Landing page
│   │   ├── ai-humanize/       # AI humanization tool
│   │   ├── ai-detector/       # AI detection tool
│   │   ├── ask-ai/            # Ask AI chat interface
│   │   ├── summarizer/        # Document summarization
│   │   ├── ai-homework-helper/# Homework helper
│   │   ├── ai-math-solver/    # Math solver
│   │   ├── ai-image-detection/# Image detection
│   │   ├── ai-video-detection/# Video detection
│   │   ├── ai-tools/          # AI tools (grammar, spell, etc.)
│   │   ├── dashboard/         # User dashboard
│   │   ├── market/            # Tool marketplace
│   │   ├── credits/           # Credit purchase
│   │   ├── documents/         # Document management
│   │   ├── profile/           # User profile
│   │   ├── privacy/           # Privacy policy
│   │   └── terms/             # Terms of service
│   └── api/                   # API routes
│       ├── humanize/          # Humanization endpoints
│       ├── detect-ai/         # AI detection endpoints
│       ├── ask-ai/            # Ask AI endpoints (GPT, Gemini, DeepSeek)
│       ├── summarizer/         # Summarization endpoints
│       ├── math-solver/       # Math solver endpoints
│       ├── homework-helper/   # Homework helper endpoints
│       ├── image-detection/   # Image detection endpoints
│       ├── video-detection/   # Video detection endpoints
│       ├── ai-tools/          # AI tools endpoints
│       ├── credits/            # Credit management
│       ├── tools/              # Tool purchase/activation
│       ├── tool-usage/         # Usage tracking
│       ├── stripe-webhook/    # Payment webhooks
│       └── documents/         # Document management
├── components/                # Reusable UI components
│   ├── ui/                   # Base UI components
│   ├── dashboard-sidebar.tsx  # Dashboard navigation
│   └── dashboard-top-navbar.tsx # Top navigation
├── lib/                      # Utility functions
│   ├── tool-definitions.ts   # Tool definitions and metadata
│   ├── document-storage.ts   # MongoDB document storage
│   ├── mongodb.ts            # MongoDB connection handler
│   ├── api-error-handler.ts  # Standardized API error handling
│   ├── detection-helpers.ts  # AI detection helper functions
│   ├── stripe.ts             # Stripe utilities
│   └── utils.ts              # General utilities
└── public/                   # Static assets
```

## 🔧 API Endpoints

### Humanization
- `POST /api/humanize/submit` - Submit text for humanization
- `POST /api/humanize/document` - Humanize document file
- `POST /api/humanize/file` - Humanize uploaded file
- `POST /api/humanize/rehumanize` - Rehumanize existing content
- `GET /api/humanize/list` - Get humanization history

### AI Detection
- `POST /api/detect-ai` - Detect AI content in text (uses ZeroGPT)
- `POST /api/detect-file` - Detect AI content in uploaded file (uses ZeroGPT)
- `POST /api/image-detection/detect` - Detect AI in images
- `POST /api/image-detection/presigned-url` - Get presigned URL for image upload
- `POST /api/image-detection/query` - Query image detection status
- `POST /api/video-detection/detect-file` - Detect AI in videos
- `POST /api/video-detection/query` - Query video detection status

### Ask AI
- `POST /api/ask-ai/gpt` - Chat with GPT-4o
- `POST /api/ask-ai/gemini` - Chat with Gemini
- `POST /api/ask-ai/deepseek` - Chat with DeepSeek

### Summarization
- `POST /api/summarizer/text` - Summarize text
- `POST /api/summarizer/pdf` - Summarize PDF documents
- `POST /api/summarizer/word` - Summarize Word documents
- `POST /api/summarizer/youtube` - Summarize YouTube videos
- `POST /api/summarizer/image` - Summarize images

### Math & Homework
- `POST /api/math-solver/solve` - Solve math problems from text
- `POST /api/math-solver/solve-image` - Solve math problems from images
- `POST /api/homework-helper/solve` - Get homework help
- `POST /api/homework-helper/solve-image` - Get homework help from images

### AI Tools
- `POST /api/ai-tools/grammar-check` - Check grammar
- `POST /api/ai-tools/spell-check` - Check spelling
- `POST /api/ai-tools/plagiarism-check` - Check plagiarism
- `POST /api/ai-tools/translator` - Translate text
- `POST /api/ai-tools/html-to-text` - Convert HTML to text
- `POST /api/ai-tools/text-to-html` - Convert text to HTML
- `POST /api/ai-tools/pdf-to-html` - Convert PDF to HTML

### Credit & Tool Management
- `GET /api/credits/status` - Get credit balances
- `POST /api/credits/purchase-checkout` - Purchase credits
- `POST /api/credits/verify-purchase` - Verify credit purchase
- `POST /api/credits/deduct` - Deduct credits after usage
- `GET /api/tools/status` - Get tool purchase/activation status
- `POST /api/tools/activate` - Activate a tool
- `POST /api/tools/deactivate` - Deactivate a tool
- `POST /api/tools/purchase-checkout` - Purchase a tool
- `POST /api/tools/verify-purchase` - Verify tool purchase

### Usage Tracking
- `GET /api/tool-usage/stats` - Get usage statistics
- `GET /api/tool-usage/recent` - Get recent activities
- `GET /api/tool-usage/breakdown` - Get usage breakdown by category

### Payment & Webhooks
- `POST /api/stripe-webhook` - Handle Stripe webhook events

### Document Management
- `GET /api/documents/list` - Get user's saved documents (via humanize/list endpoint)
- `POST /api/documents/save` - Save a document
- `POST /api/documents/delete` - Delete a document

## 🎯 Usage Guide

### For Users
1. **Sign Up**: Create account using email or social login
2. **Purchase Tools**: Buy individual tools ($1 each) or activate free tools
3. **Purchase Credits**: Buy credits for tools (individual or Super Saving Plan)
4. **Use Tools**: Access all 17 AI tools from the dashboard
5. **Track Usage**: Monitor your credit balances and usage statistics
6. **Manage Documents**: Save and manage your processed documents

### For Developers
1. **Error Handling**: Comprehensive error system with user-friendly messages
2. **Credit System**: Real-time credit deduction and balance tracking
3. **Tool Management**: Centralized tool definitions and activation system
4. **Payment Processing**: Immediate purchase verification without webhook dependency
5. **Usage Tracking**: Server-side usage tracking with MongoDB
6. **Mobile Optimization**: Touch-friendly interface with proper tap targets

## 🐛 Troubleshooting

### Common Issues

**Humanization Fails**
- Check Undetectable AI API key and quota
- Ensure content is valid and not empty
- Verify file size is within limits (25MB max)

**AI Detection Issues**
- Verify ZeroGPT API key is configured
- Check API quota limits for detection services
- Ensure file formats are supported

**Credit Purchase Issues**
- Check Stripe webhook configuration
- Verify credit purchase verification endpoint
- Check user metadata in Clerk for credit balances
- Ensure `STRIPE_WEBHOOK_SECRET` is correctly set

**Tool Activation Issues**
- Verify tool purchase status in user metadata
- Check tool definitions in `lib/tool-definitions.ts`
- Ensure free tools are properly marked
- Check credit balance before tool usage

**API Key Issues**
- Verify all required API keys are set in `.env.local`
- Check API key validity and quota limits
- Ensure `NEXT_PUBLIC_` prefix is used for client-side variables

**Mobile Issues**
- Clear browser cache for responsive design updates
- Ensure JavaScript is enabled for interactive features
- Check network connectivity for API calls

## 🚀 Deployment

### Vercel (Recommended)
1. Connect repository to Vercel
2. Configure environment variables
3. Deploy with automatic CI/CD

### Environment Variables for Production
- Set all variables from `env_example`
- Use production Stripe keys and webhook secrets
- Configure proper `NEXT_PUBLIC_APP_URL`
- Set up MongoDB Atlas connection string
- Use production API keys for all AI services
- Configure Clerk production keys

## 📈 Performance

- **Bundle Size**: Optimized with dynamic imports and code splitting
- **Loading**: Skeleton screens and progressive loading
- **Images**: Next.js Image optimization for logos and assets
- **Caching**: Efficient API response caching

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request


## 🆘 Support

- **Email**: support@webbuddy.agency
- **Documentation**: Check the application help section
- **Issues**: Use GitHub Issues for bug reports and feature requests

---

Built with ❤️ by [Webbuddy.agency](https://webbuddy.agency)
