import "./globals.css";
import { Metadata } from "next";
import { Toaster } from "sonner";
import { ThemeProvider } from "next-themes";
import { Geist, Playfair_Display, Hanken_Grotesk, Rubik } from "next/font/google";
import { ClerkProvider } from '@clerk/nextjs';
import ConditionalNavbar from "@/components/conditional-navbar";
import ErrorBoundary from "@/components/error-boundary";

const geist = Geist({ subsets: ["latin"] });
const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair-display"
});
const hankenGrotesk = Hanken_Grotesk({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-hanken-grotesk"
});
const rubik = Rubik({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-rubik"
});

export const metadata: Metadata = {
  metadataBase: new URL("http://localhost:3000"),
  title: "JujuStudy - AI Learning Platform",
  description: "JujuStudy helps students study smarter with AI tutoring, math solving, homework help, summarizing, translation, academic writing support, and coding tools.",
  keywords: [
     "AI study platform",
    "AI tutor",
    "homework helper",
    "math solver",
    "study assistant",
    "AI learning tools",
    "summarizer",
    "academic writing assistant",
    "coding tutor",
    "exam preparation"
  ],
  authors: [{ name: "JujuStudy" }],
  creator: "JujuStudy",
  publisher: "JujuStudy",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "JujuStudy - AI Learning Platform",
    description: "JujuStudy helps students study smarter with AI tutoring, math solving, homework help, summarizing, translation, academic writing support, and coding tools.",
    url: "http://localhost:3000",
    siteName: "JujuStudy",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "JujuStudy - AI Learning Platform",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "JujuStudy - AI Learning Platform",
    description: "JujuStudy helps students study smarter with AI tutoring, math solving, homework help, summarizing, translation, academic writing support, and coding tools.",
    images: ["/twitter-image.png"],
    creator: "@JujuStudy",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/logo.png', sizes: '32x32', type: 'image/png' },
      { url: '/logo.png', sizes: '16x16', type: 'image/png' },
    ],
    shortcut: '/favicon.svg',
    apple: [
      { url: '/logo.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  verification: {
    google: "your-google-verification-code",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      appearance={{
        baseTheme: undefined,
        variables: {
          colorPrimary: '#ffffff', // white
          colorBackground: '#000000',
          colorInputBackground: '#1a1a1a',
          colorInputText: '#ffffff',
          colorText: '#ffffff',
          colorTextSecondary: '#9ca3af',
          colorDanger: '#000000',
          colorSuccess: '#000000',
          colorWarning: '#000000',
          borderRadius: '0.75rem', // rounded-xl
          fontFamily: 'Rubik, sans-serif',
          fontSize: '16px',
          fontWeight: {
            normal: '400',
            medium: '500',
            semibold: '600',
            bold: '700',
          },
        },
        elements: {
          rootBox: 'bg-black',
          card: 'bg-white/5 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/10',
          headerTitle: 'text-white font-bold text-3xl',
          headerSubtitle: 'text-gray-400',
          socialButtonsBlockButton: 'bg-white/10 border border-white/20 text-white rounded-xl hover:bg-white/20 transition-all duration-200 font-medium backdrop-blur-sm',
          socialButtonsBlockButtonText: 'text-white font-medium',
          socialButtonsBlockButtonArrow: 'text-white',
          formButtonPrimary: 'bg-white hover:bg-gray-100 text-black rounded-xl font-semibold transition-all duration-300 transform hover:scale-[1.02]',
          formFieldLabel: 'text-gray-300 font-medium',
          formFieldInput: 'border border-white/20 bg-white/5 text-white rounded-xl focus:ring-2 focus:ring-white/50 focus:border-white/50 transition-all duration-200 backdrop-blur-sm',
          formFieldInputShowPasswordButton: 'text-gray-400 hover:text-gray-300',
          footerActionLink: 'text-white font-semibold hover:text-gray-300 transition-colors',
          footerActionText: 'text-gray-400',
          identityPreviewText: 'text-white',
          identityPreviewEditButton: 'text-white hover:text-gray-300',
          formFieldSuccessText: 'text-white',
          formFieldErrorText: 'text-white',
          alertText: 'text-white',
          alertTextDanger: 'text-white',
          dividerLine: 'bg-white/20',
          dividerText: 'text-gray-400',
          otpCodeFieldInput: 'border border-white/20 bg-white/5 text-white rounded-xl focus:ring-2 focus:ring-white/50 backdrop-blur-sm',
          formResendCodeLink: 'text-white font-semibold hover:text-gray-300',
          avatarBox: 'rounded-full',
          modalContent: 'bg-black/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20',
          modalBackdrop: 'bg-black/50 backdrop-blur-sm',
          logoImage: 'hidden', // Hide Clerk logo
          logoBox: 'hidden', // Hide Clerk logo container
          headerLogo: 'hidden', // Hide header logo
          headerLogoImage: 'hidden', // Hide header logo image
          footer: 'hidden', // Hide Clerk footer/branding
          footerPages: 'hidden', // Hide footer pages
        },
      }}
    >
      <html lang="en" suppressHydrationWarning className={`${geist.className} ${playfairDisplay.variable} ${hankenGrotesk.variable} ${rubik.variable}`}>
        <head />
        <body className="no-horizontal-scroll">
          <ThemeProvider attribute="class" enableSystem forcedTheme="dark">
            <ErrorBoundary>
              <ConditionalNavbar />
              <Toaster
                position="top-center"
                richColors
                expand={true}
                toastOptions={{
                  duration: 4000,
                  style: {
                    background: 'hsl(var(--background))',
                    color: 'hsl(var(--foreground))',
                    border: '1px solid hsl(var(--border))',
                  },
                }}
              />
              <div className="safe-area-padding">
                {children}
              </div>
            </ErrorBoundary>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
