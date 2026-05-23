"use client";

import { motion } from "framer-motion";
import { Shield, FileText, UserCheck, Zap } from "lucide-react";
import NextLink from "next/link";
import { useUser, SignInButton } from '@clerk/nextjs';
import { Navbar, NavBody, NavbarLogo, NavItems, NavbarButton, MobileNav, MobileNavHeader, MobileNavToggle, MobileNavMenu } from "@/components/ui/resizable-navbar";
import { useState } from "react";
import Image from "next/image";

// Footer Logo component with fallback
function FooterLogo() {
  const [imageError, setImageError] = useState(false);

  if (imageError) {
    return (
      <div className="text-2xl font-bold text-white mb-4">
        <span className="text-white">By</span>Pass<span className="text-white">AI</span>
      </div>
    );
  }

  return (
    <Image
      src="/logo.png"
      alt="ByLearn Logo"
      width={150}
      height={40}
      className="h-10 w-auto mb-4"
      onError={() => setImageError(true)}
    />
  );
}

export default function TermsPage() {
  const { isSignedIn } = useUser();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { name: "Features", link: "/#features" },
    { name: "AI Tools", link: "/#ai-tools" },
    { name: "Pricing", link: "/#pricing" },
    { name: "FAQ", link: "/#faq" },
  ];

  return (
    <div className="min-h-screen bg-black">
      {/* Navbar */}
      <Navbar>
        {/* Desktop Navigation */}
        <NavBody>
          <NavbarLogo />
          <NavItems items={navItems} />
          <div className="flex items-center gap-4">
            {isSignedIn ? (
              <NextLink href="/dashboard">
                <NavbarButton variant="secondary">Dashboard</NavbarButton>
              </NextLink>
            ) : (
              <SignInButton mode="modal">
                <NavbarButton variant="secondary">Login</NavbarButton>
              </SignInButton>
            )}
            {isSignedIn ? (
              <NextLink href="/dashboard/ai-humanize">
                <NavbarButton variant="primary">Get Started</NavbarButton>
              </NextLink>
            ) : (
              <SignInButton mode="modal">
                <NavbarButton variant="primary">Get Started</NavbarButton>
              </SignInButton>
            )}
          </div>
        </NavBody>

        {/* Mobile Navigation */}
        <MobileNav>
          <MobileNavHeader>
            <NavbarLogo />
            <MobileNavToggle
              isOpen={isMobileMenuOpen}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            />
          </MobileNavHeader>
          <MobileNavMenu isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)}>
            {navItems.map((item, idx) => (
              <a
                key={`mobile-nav-${idx}`}
                href={item.link}
                className="block px-4 py-3 text-white hover:bg-white/10 rounded-lg transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {item.name}
              </a>
            ))}
            <div className="mt-4 pt-4 border-t border-white/10 space-y-2">
              {isSignedIn ? (
                <>
                  <NextLink href="/dashboard" className="block px-4 py-3 bg-white/10 text-white rounded-lg text-center hover:bg-white/20 transition-colors">
                    Dashboard
                  </NextLink>
                  <NextLink href="/dashboard/ai-humanize" className="block px-4 py-3 bg-white text-black rounded-lg text-center hover:bg-gray-100 transition-colors">
                    Get Started
                  </NextLink>
                </>
              ) : (
                <>
                  <SignInButton mode="modal">
                    <button className="w-full px-4 py-3 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors">
                      Login
                    </button>
                  </SignInButton>
                  <SignInButton mode="modal">
                    <button className="w-full px-4 py-3 bg-white text-black rounded-lg hover:bg-gray-100 transition-colors">
                      Get Started
                    </button>
                  </SignInButton>
                </>
              )}
            </div>
          </MobileNavMenu>
        </MobileNav>
      </Navbar>

      <div className="pt-24">
        {/* Header */}
        <div className="bg-black">
          <div className="max-w-4xl mx-auto px-6 py-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center"
            >
              <div className="inline-flex items-center px-4 py-2 bg-white/10 border border-white/20 rounded-full text-sm font-medium text-white mb-6 backdrop-blur-sm">
                <FileText className="w-4 h-4 mr-2" />
                LEGAL DOCUMENT
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-4" style={{ fontFamily: 'Rubik, sans-serif' }}>
                Terms of Service
              </h1>
              <p className="text-lg text-gray-400">
                Last updated: December 2024
              </p>
            </motion.div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-4xl mx-auto px-6 py-16">
          <div className="prose prose-slate max-w-none">

            {/* Introduction */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="mb-12"
            >
              <p className="text-lg text-gray-300 leading-relaxed">
                Welcome to ByLearn. These Terms of Service (&quot;Terms&quot;) govern your access to and use of our AI humanization and detection services. By using our services, you agree to be bound by these Terms.
              </p>
            </motion.div>

            {/* Section 1 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mb-12 bg-white/5 backdrop-blur-xl rounded-2xl p-8 border border-white/10"
            >
              <div className="flex items-start space-x-4 mb-6">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0 backdrop-blur-sm">
                  <UserCheck className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white mb-4" style={{ fontFamily: 'Rubik, sans-serif' }}>1. Acceptance of Terms</h2>
                  <p className="text-gray-300 leading-relaxed">
                    By accessing or using ByLearn (&quot;Service&quot;), you agree to comply with and be bound by these Terms. If you do not agree to these Terms, please do not use our Service.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Section 2 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="mb-12 bg-white/5 backdrop-blur-xl rounded-2xl p-8 border border-white/10"
            >
              <div className="flex items-start space-x-4 mb-6">
                <div className="w-12 h-12 bg-white/15 rounded-xl flex items-center justify-center flex-shrink-0 backdrop-blur-sm">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white mb-4" style={{ fontFamily: 'Rubik, sans-serif' }}>2. Description of Service</h2>
                  <p className="text-gray-300 leading-relaxed mb-4">
                    ByLearn provides AI content humanization and detection services. We offer:
                  </p>
                  <ul className="space-y-2 text-gray-300">
                    <li className="flex items-start">
                      <span className="text-white mr-2">•</span>
                      <span>AI content humanization to make content undetectable by AI detectors</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-white mr-2">•</span>
                      <span>AI content detection across multiple platforms</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-white mr-2">•</span>
                      <span>File upload and batch processing capabilities</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-white mr-2">•</span>
                      <span>Usage analytics and dashboard features</span>
                    </li>
                  </ul>
                </div>
              </div>
            </motion.div>

            {/* Section 3 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="mb-12 bg-white/5 backdrop-blur-xl rounded-2xl p-8 border border-white/10"
            >
              <div className="flex items-start space-x-4 mb-6">
                <div className="w-12 h-12 bg-white/15 rounded-xl flex items-center justify-center flex-shrink-0 backdrop-blur-sm">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white mb-4" style={{ fontFamily: 'Rubik, sans-serif' }}>3. User Responsibilities</h2>
                  <p className="text-gray-300 leading-relaxed mb-4">
                    As a user of our Service, you agree to:
                  </p>
                  <ul className="space-y-2 text-gray-300">
                    <li className="flex items-start">
                      <span className="text-white mr-2">•</span>
                      <span>Use the Service in compliance with all applicable laws and regulations</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-white mr-2">•</span>
                      <span>Not use the Service for any illegal, harmful, or fraudulent purposes</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-white mr-2">•</span>
                      <span>Maintain the security of your account credentials</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-white mr-2">•</span>
                      <span>Not attempt to reverse engineer, decompile, or extract source code</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-white mr-2">•</span>
                      <span>Respect intellectual property rights of others</span>
                    </li>
                  </ul>
                </div>
              </div>
            </motion.div>

            {/* Section 4 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="mb-12 bg-white/5 backdrop-blur-xl rounded-2xl p-8 border border-white/10"
            >
              <h2 className="text-2xl font-bold text-white mb-4" style={{ fontFamily: 'Rubik, sans-serif' }}>4. Subscription and Payment</h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                We offer free and paid subscription plans. By subscribing to a paid plan:
              </p>
              <ul className="space-y-2 text-gray-300">
                <li className="flex items-start">
                  <span className="text-white mr-2">•</span>
                  <span>You agree to pay all fees associated with your subscription</span>
                </li>
                <li className="flex items-start">
                  <span className="text-white mr-2">•</span>
                  <span>Subscriptions are billed monthly or annually in advance</span>
                </li>
                <li className="flex items-start">
                  <span className="text-white mr-2">•</span>
                  <span>All fees are non-refundable except as required by law</span>
                </li>
                <li className="flex items-start">
                  <span className="text-white mr-2">•</span>
                  <span>You may cancel your subscription at any time through your account settings</span>
                </li>
                <li className="flex items-start">
                  <span className="text-white mr-2">•</span>
                  <span>We reserve the right to change our pricing with 30 days&apos; notice</span>
                </li>
              </ul>
            </motion.div>

            {/* Section 5 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="mb-12 bg-white/5 backdrop-blur-xl rounded-2xl p-8 border border-white/10"
            >
              <h2 className="text-2xl font-bold text-white mb-4" style={{ fontFamily: 'Rubik, sans-serif' }}>5. Limitation of Liability</h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                To the maximum extent permitted by law, ByLearn and its service providers shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising out of or relating to your use of the Service.
              </p>
              <p className="text-gray-300 leading-relaxed">
                Our total liability for any claim arising out of these Terms or the Service shall not exceed the amount you paid us in the 12 months preceding the claim.
              </p>
            </motion.div>

            {/* Section 6 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.7 }}
              className="mb-12 bg-white/5 backdrop-blur-xl rounded-2xl p-8 border border-white/10"
            >
              <h2 className="text-2xl font-bold text-white mb-4" style={{ fontFamily: 'Rubik, sans-serif' }}>6. Termination</h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                We may suspend or terminate your access to the Service at any time, with or without cause, with or without notice.
              </p>
              <p className="text-gray-300 leading-relaxed">
                You may terminate your account at any time by canceling your subscription or contacting us at <a href="mailto:contact@ByLearn.us" className="text-white hover:text-gray-300 underline">contact@ByLearn.us</a>.
              </p>
            </motion.div>

            {/* Section 7 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
              className="mb-12 bg-white/5 backdrop-blur-xl rounded-2xl p-8 border border-white/10"
            >
              <h2 className="text-2xl font-bold text-white mb-4" style={{ fontFamily: 'Rubik, sans-serif' }}>7. Changes to Terms</h2>
              <p className="text-gray-300 leading-relaxed">
                We reserve the right to modify these Terms at any time. We will notify you of any material changes by posting the updated Terms on our website. Your continued use of the Service after such changes constitutes your acceptance of the updated Terms.
              </p>
            </motion.div>

            {/* Section 8 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.9 }}
              className="mb-12 bg-white/5 backdrop-blur-xl rounded-2xl p-8 border border-white/10"
            >
              <h2 className="text-2xl font-bold text-white mb-4" style={{ fontFamily: 'Rubik, sans-serif' }}>8. Contact Information</h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                If you have any questions about these Terms, please contact us at:
              </p>
              <div className="bg-white/5 backdrop-blur-xl rounded-xl p-6 border border-white/10">
                <p className="text-white font-semibold mb-2">Email:</p>
                <a href="mailto:contact@ByLearn.us" className="text-white hover:text-gray-300">
                  contact@ByLearn.us
                </a>
              </div>
            </motion.div>

          </div>
        </div>

      </div>

      {/* Footer */}
      <footer className="bg-black border-t border-white/10 py-12 mt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <FooterLogo />
              <p className="text-gray-400 text-sm">
                Transform AI content into natural, human-like writing.
              </p>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Product</h3>
              <ul className="space-y-2">
                <li><NextLink href="/#features" className="text-gray-400 hover:text-white text-sm transition-colors">Features</NextLink></li>
                <li><NextLink href="/#ai-tools" className="text-gray-400 hover:text-white text-sm transition-colors">AI Tools</NextLink></li>
                <li><NextLink href="/#pricing" className="text-gray-400 hover:text-white text-sm transition-colors">Pricing</NextLink></li>
                {isSignedIn && (
                  <>
                    <li><NextLink href="/dashboard/market" className="text-gray-400 hover:text-white text-sm transition-colors">Market</NextLink></li>
                    <li><NextLink href="/dashboard/credits" className="text-gray-400 hover:text-white text-sm transition-colors">Credits</NextLink></li>
                  </>
                )}
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Company</h3>
              <ul className="space-y-2">
                <li><NextLink href="/privacy" className="text-gray-400 hover:text-white text-sm transition-colors">Privacy Policy</NextLink></li>
                <li><NextLink href="/terms" className="text-gray-400 hover:text-white text-sm transition-colors">Terms of Service</NextLink></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Support</h3>
              <ul className="space-y-2">
                <li><a href="mailto:support@webbuddy.agency" className="text-gray-400 hover:text-white text-sm transition-colors">Contact Us</a></li>
                <li><NextLink href="/#faq" className="text-gray-400 hover:text-white text-sm transition-colors">FAQ</NextLink></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 pt-8 text-center">
            <p className="text-gray-400 text-sm">
              © {new Date().getFullYear()} ByLearn. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

