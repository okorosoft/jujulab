"use client";

import { motion } from "framer-motion";
import { Lock, Eye, Shield, Database, User, Mail } from "lucide-react";
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

export default function PrivacyPage() {
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
                <Lock className="w-4 h-4 mr-2" />
                YOUR PRIVACY MATTERS
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-4" style={{ fontFamily: 'Rubik, sans-serif' }}>
                Privacy Policy
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
                At ByLearn, we are committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our AI humanization and detection services.
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
                  <Database className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white mb-4" style={{ fontFamily: 'Rubik, sans-serif' }}>1. Information We Collect</h2>
                  <p className="text-gray-300 leading-relaxed mb-4">
                    We collect the following types of information:
                  </p>
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-2">Account Information</h3>
                      <ul className="space-y-2 text-gray-300">
                        <li className="flex items-start">
                          <span className="text-white mr-2">•</span>
                          <span>Name, email address, and authentication credentials</span>
                        </li>
                        <li className="flex items-start">
                          <span className="text-white mr-2">•</span>
                          <span>Profile information and preferences</span>
                        </li>
                      </ul>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-2">Usage Data</h3>
                      <ul className="space-y-2 text-gray-300">
                        <li className="flex items-start">
                          <span className="text-white mr-2">•</span>
                          <span>Words processed, documents uploaded, and feature usage</span>
                        </li>
                        <li className="flex items-start">
                          <span className="text-white mr-2">•</span>
                          <span>Session duration and interaction patterns</span>
                        </li>
                      </ul>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-2">Technical Information</h3>
                      <ul className="space-y-2 text-gray-300">
                        <li className="flex items-start">
                          <span className="text-white mr-2">•</span>
                          <span>IP address, browser type, device information</span>
                        </li>
                        <li className="flex items-start">
                          <span className="text-white mr-2">•</span>
                          <span>Cookies and similar tracking technologies</span>
                        </li>
                      </ul>
                    </div>
                  </div>
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
                  <Eye className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white mb-4" style={{ fontFamily: 'Rubik, sans-serif' }}>2. How We Use Your Information</h2>
                  <p className="text-gray-300 leading-relaxed mb-4">
                    We use your information to:
                  </p>
                  <ul className="space-y-2 text-gray-300">
                    <li className="flex items-start">
                      <span className="text-white mr-2">•</span>
                      <span>Provide and improve our AI humanization and detection services</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-white mr-2">•</span>
                      <span>Process your content and deliver results</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-white mr-2">•</span>
                      <span>Send you service updates and important notices</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-white mr-2">•</span>
                      <span>Manage your account and subscription</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-white mr-2">•</span>
                      <span>Generate usage analytics and reports</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-white mr-2">•</span>
                      <span>Detect and prevent fraud or abuse</span>
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
                  <Lock className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white mb-4" style={{ fontFamily: 'Rubik, sans-serif' }}>3. How We Protect Your Content</h2>
                  <p className="text-gray-300 leading-relaxed mb-4">
                    Your content security is our top priority:
                  </p>
                  <ul className="space-y-2 text-gray-300">
                    <li className="flex items-start">
                      <span className="text-white mr-2">•</span>
                      <span><strong>Enterprise-grade encryption:</strong> All data is encrypted in transit and at rest</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-white mr-2">•</span>
                      <span><strong className="text-white">No permanent storage:</strong> Your content is processed and automatically deleted</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-white mr-2">•</span>
                      <span><strong className="text-white">Secure infrastructure:</strong> Built on industry-leading cloud platforms</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-white mr-2">•</span>
                      <span><strong className="text-white">Access controls:</strong> Strict authentication and authorization protocols</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-white mr-2">•</span>
                      <span><strong className="text-white">Regular audits:</strong> Continuous security monitoring and assessments</span>
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
              <h2 className="text-2xl font-bold text-white mb-4" style={{ fontFamily: 'Rubik, sans-serif' }}>4. Data Sharing and Disclosure</h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                We do not sell, trade, or rent your personal information to third parties. We may share your information only in the following circumstances:
              </p>
              <ul className="space-y-2 text-gray-300">
                <li className="flex items-start">
                  <span className="text-white mr-2">•</span>
                  <span><strong className="text-white">Service Providers:</strong> With trusted partners who help us operate our service</span>
                </li>
                <li className="flex items-start">
                  <span className="text-white mr-2">•</span>
                  <span><strong className="text-white">Legal Requirements:</strong> When required by law or legal process</span>
                </li>
                <li className="flex items-start">
                  <span className="text-white mr-2">•</span>
                  <span><strong className="text-white">Business Transfers:</strong> In connection with a merger or sale of assets</span>
                </li>
                <li className="flex items-start">
                  <span className="text-white mr-2">•</span>
                  <span><strong className="text-white">With Your Consent:</strong> When you explicitly authorize disclosure</span>
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
              <div className="flex items-start space-x-4 mb-6">
                <div className="w-12 h-12 bg-white/15 rounded-xl flex items-center justify-center flex-shrink-0 backdrop-blur-sm">
                  <User className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white mb-4" style={{ fontFamily: 'Rubik, sans-serif' }}>5. Your Rights and Choices</h2>
                  <p className="text-gray-300 leading-relaxed mb-4">
                    You have the right to:
                  </p>
                  <ul className="space-y-2 text-gray-300">
                    <li className="flex items-start">
                      <span className="text-white mr-2">•</span>
                      <span>Access and review your personal information</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-white mr-2">•</span>
                      <span>Request correction of inaccurate information</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-white mr-2">•</span>
                      <span>Delete your account and associated data</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-white mr-2">•</span>
                      <span>Opt-out of marketing communications</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-white mr-2">•</span>
                      <span>Export your data in a portable format</span>
                    </li>
                  </ul>
                  <p className="text-gray-300 leading-relaxed mt-4">
                    To exercise these rights, please contact us at <a href="mailto:contact@ByLearn.us" className="text-white hover:text-gray-300 underline">contact@ByLearn.us</a>
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Section 6 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.7 }}
              className="mb-12 bg-white/5 backdrop-blur-xl rounded-2xl p-8 border border-white/10"
            >
              <div className="flex items-start space-x-4 mb-6">
                <div className="w-12 h-12 bg-white/15 rounded-xl flex items-center justify-center flex-shrink-0 backdrop-blur-sm">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white mb-4" style={{ fontFamily: 'Rubik, sans-serif' }}>6. Cookies and Tracking</h2>
                  <p className="text-gray-300 leading-relaxed mb-4">
                    We use cookies and similar technologies to:
                  </p>
                  <ul className="space-y-2 text-gray-300">
                    <li className="flex items-start">
                      <span className="text-white mr-2">•</span>
                      <span>Maintain your session and authenticate your identity</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-white mr-2">•</span>
                      <span>Remember your preferences and settings</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-white mr-2">•</span>
                      <span>Analyze usage patterns and improve our service</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-white mr-2">•</span>
                      <span>Deliver personalized content and features</span>
                    </li>
                  </ul>
                  <p className="text-gray-300 leading-relaxed mt-4">
                    You can control cookies through your browser settings. Note that disabling cookies may limit some features.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Section 7 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
              className="mb-12 bg-white/5 backdrop-blur-xl rounded-2xl p-8 border border-white/10"
            >
              <h2 className="text-2xl font-bold text-white mb-4" style={{ fontFamily: 'Rubik, sans-serif' }}>7. Children&apos;s Privacy</h2>
              <p className="text-gray-300 leading-relaxed">
                Our Service is not intended for users under the age of 13. We do not knowingly collect personal information from children. If you believe we have inadvertently collected such information, please contact us immediately.
              </p>
            </motion.div>

            {/* Section 8 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.9 }}
              className="mb-12 bg-white/5 backdrop-blur-xl rounded-2xl p-8 border border-white/10"
            >
              <h2 className="text-2xl font-bold text-white mb-4" style={{ fontFamily: 'Rubik, sans-serif' }}>8. Changes to This Policy</h2>
              <p className="text-gray-300 leading-relaxed">
                We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the updated policy on our website and updating the &quot;Last updated&quot; date. Your continued use of our Service after such changes constitutes your acceptance of the updated policy.
              </p>
            </motion.div>

            {/* Section 9 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.0 }}
              className="mb-12 bg-white/5 backdrop-blur-xl rounded-2xl p-8 border border-white/10"
            >
              <h2 className="text-2xl font-bold text-white mb-4" style={{ fontFamily: 'Rubik, sans-serif' }}>9. Contact Us</h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                If you have questions about this Privacy Policy or our data practices, please contact us:
              </p>
              <div className="bg-white/5 backdrop-blur-xl rounded-xl p-6 border border-white/10">
                <div className="flex items-center space-x-3 mb-4">
                  <Mail className="w-5 h-5 text-white" />
                  <p className="text-white font-semibold">Email:</p>
                </div>
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

