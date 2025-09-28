"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useRouter } from "next/navigation";

const FloatingNavbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const { user, loading, signOut } = useAuth();
  const { toggleTheme, isDark } = useTheme();
  const router = useRouter();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu and profile dropdown when clicking outside
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as Element;
      if (isMobileMenuOpen && !target.closest("nav")) {
        setIsMobileMenuOpen(false);
      }
      if (
        isProfileOpen &&
        !target.closest(".profile-dropdown") &&
        !target.closest(".profile-button")
      ) {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener("click", handleOutsideClick);
    return () => document.removeEventListener("click", handleOutsideClick);
  }, [isMobileMenuOpen, isProfileOpen]);

  // Prevent scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isMobileMenuOpen]);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const toggleProfile = () => {
    setIsProfileOpen(!isProfileOpen);
  };

  const handleSignOut = async () => {
    setIsProfileOpen(false);
    await signOut();
    // The AuthContext will handle the redirect
  };

  return (
    <>
      <nav
        className={`fixed top-6 left-1/2 transform -translate-x-1/2 w-[80%] max-w-7xl z-50 transition-all duration-500 ${
          isScrolled
            ? isDark
              ? "bg-black/80 backdrop-blur-md border border-purple-500/40 shadow-2xl shadow-purple-500/25 glow-effect"
              : "bg-white/80 backdrop-blur-md border border-purple-500/40 shadow-2xl shadow-purple-500/25 glow-effect"
            : isDark
              ? "bg-black/50 backdrop-blur-sm border border-white/10"
              : "bg-white/50 backdrop-blur-sm border border-gray-300/20"
        } rounded-full px-8 py-3`}
      >
        <div className="flex items-center justify-between w-full">
          {/* Brand Logo */}
          <Link
            href="/"
            className={`font-bold text-xl hover:text-purple-400 transition-all duration-200 hover:scale-105 font-heading group ${
              isDark ? "text-white" : "text-gray-900"
            }`}
          >
            <div className="relative overflow-hidden">
              <span
                className={`block bg-gradient-to-r ${
                  isDark
                    ? "from-white to-purple-200"
                    : "from-gray-900 to-purple-600"
                } bg-clip-text text-transparent transition-transform duration-300 ease-out group-hover:-translate-y-full`}
              >
                TranslateA2Z
              </span>
              <span
                className={`absolute top-full left-0 bg-gradient-to-r ${
                  isDark
                    ? "from-white to-purple-200"
                    : "from-gray-900 to-purple-600"
                } bg-clip-text text-transparent transition-transform duration-300 ease-out group-hover:-translate-y-full`}
              >
                TranslateA2Z
              </span>
            </div>
          </Link>

          {/* Center Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            <Link
              href="/"
              className={`relative overflow-hidden px-5 py-2 rounded-full transition-all duration-300 text-sm font-medium group font-body ${
                isDark
                  ? "text-white/80 hover:text-white"
                  : "text-gray-700/80 hover:text-gray-900"
              }`}
            >
              <div className="relative overflow-hidden">
                <span className="block transition-transform duration-300 ease-out group-hover:-translate-y-full">
                  Home
                </span>
                <span className="absolute top-full left-0 transition-transform duration-300 ease-out group-hover:-translate-y-full">
                  Home
                </span>
              </div>
            </Link>
            <button
              onClick={() => {
                const pricingSection =
                  document.getElementById("pricing-section");
                if (pricingSection) {
                  const offset = 100; // Offset for fixed navbar
                  const elementPosition =
                    pricingSection.getBoundingClientRect().top;
                  const offsetPosition =
                    elementPosition + window.pageYOffset - offset;

                  window.scrollTo({
                    top: offsetPosition,
                    behavior: "smooth",
                  });
                }
              }}
              className={`relative overflow-hidden px-5 py-2 rounded-full transition-all duration-300 text-sm font-medium group font-body ${
                isDark
                  ? "text-white/80 hover:text-white"
                  : "text-gray-700/80 hover:text-gray-900"
              }`}
            >
              <div className="relative overflow-hidden">
                <span className="block transition-transform duration-300 ease-out group-hover:-translate-y-full">
                  Pricing
                </span>
                <span className="absolute top-full left-0 transition-transform duration-300 ease-out group-hover:-translate-y-full">
                  Pricing
                </span>
              </div>
            </button>
            <Link
              href="/contact"
              className={`relative overflow-hidden px-5 py-2 rounded-full transition-all duration-300 text-sm font-medium group font-body ${
                isDark
                  ? "text-white/80 hover:text-white"
                  : "text-gray-700/80 hover:text-gray-900"
              }`}
            >
              <div className="relative overflow-hidden">
                <span className="block transition-transform duration-300 ease-out group-hover:-translate-y-full">
                  Contact Us
                </span>
                <span className="absolute top-full left-0 transition-transform duration-300 ease-out group-hover:-translate-y-full">
                  Contact Us
                </span>
              </div>
            </Link>
          </div>

          {/* Right Side - Theme Toggle & Profile/Login */}
          <div className="hidden md:flex items-center space-x-4 relative">
            {/* Theme Toggle Button */}
            {/* <button
              onClick={toggleTheme}
              className={`relative w-10 h-10 backdrop-blur-sm border rounded-full flex items-center justify-center transition-all duration-300 group ${
                isDark
                  ? "bg-white/5 border-white/10 hover:border-purple-500/30 hover:bg-purple-600/10"
                  : "bg-gray-900/5 border-gray-300/20 hover:border-purple-500/30 hover:bg-purple-600/10"
              }`}
            >
              {isDark ? (
                <svg
                  className="w-5 h-5 text-yellow-400 transition-transform duration-300 group-hover:rotate-180"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : (
                <svg
                  className="w-5 h-5 text-purple-400 transition-transform duration-300 group-hover:rotate-180"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                </svg>
              )}
            </button> */}

            {loading ? (
              <div className="w-8 h-8 border-2 border-purple-600/30 border-t-purple-600 rounded-full animate-spin"></div>
            ) : user ? (
              <>
                {/* Profile Button */}
                <button
                  onClick={toggleProfile}
                  className="profile-button relative flex items-center space-x-3 bg-gradient-to-r from-purple-600/20 to-purple-800/20 backdrop-blur-sm border border-purple-500/30 text-white px-4 py-2 rounded-full transition-all duration-300 text-sm font-medium shadow-lg hover:border-purple-400/50 group font-body"
                >
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                    {user.user_metadata?.full_name?.[0] ||
                      user.email?.[0] ||
                      "U"}
                  </div>
                  <span className="hidden lg:block">
                    {user.user_metadata?.full_name?.split(" ")[0] || "User"}
                  </span>
                  <svg
                    className={`w-4 h-4 transition-transform duration-300 ${
                      isProfileOpen ? "rotate-180" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {/* Profile Dropdown */}
                {isProfileOpen && (
                  <div className="profile-dropdown absolute top-full right-0 mt-2 w-64 bg-black/90 backdrop-blur-md border border-purple-500/40 rounded-2xl shadow-2xl shadow-purple-500/25 py-2 z-50">
                    <div className="px-4 py-3 border-b border-purple-500/20">
                      <p className="text-white font-medium">
                        {user.user_metadata?.full_name || "User"}
                      </p>
                      <p className="text-gray-400 text-sm">{user.email}</p>
                    </div>
                    <div className="py-2">
                      <Link
                        href="/workspace"
                        onClick={() => setIsProfileOpen(false)}
                        className="flex items-center px-4 py-2 text-gray-300 hover:text-white hover:bg-purple-600/20 transition-all duration-200"
                      >
                        <svg
                          className="w-4 h-4 mr-3"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                          />
                        </svg>
                        Workspace
                      </Link>
                      <Link
                        href="/settings"
                        onClick={() => setIsProfileOpen(false)}
                        className="flex items-center px-4 py-2 text-gray-300 hover:text-white hover:bg-purple-600/20 transition-all duration-200"
                      >
                        <svg
                          className="w-4 h-4 mr-3"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                        Settings
                      </Link>
                      <button
                        onClick={handleSignOut}
                        className="flex items-center w-full px-4 py-2 text-gray-300 hover:text-white hover:bg-red-600/20 transition-all duration-200"
                      >
                        <svg
                          className="w-4 h-4 mr-3"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                          />
                        </svg>
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <Link
                href="/auth"
                className="relative overflow-hidden bg-gradient-to-r from-purple-600 to-purple-800 text-white px-6 py-2 rounded-full transition-all duration-300 text-sm font-medium shadow-lg shadow-purple-600/30 hover:shadow-purple-500/50 group font-body"
              >
                <div className="relative overflow-hidden z-10">
                  <span className="block transition-transform duration-300 ease-out group-hover:-translate-y-full">
                    Log In
                  </span>
                  <span className="absolute top-full left-0 transition-transform duration-300 ease-out group-hover:-translate-y-full">
                    Log In
                  </span>
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-purple-400 to-purple-500 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out rounded-full"></div>
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={toggleMobileMenu}
            className="md:hidden text-white/80 hover:text-white transition-all duration-300 p-2 relative z-50"
            aria-label="Toggle mobile menu"
          >
            <div className="w-6 h-6 relative">
              {/* Hamburger Icon */}
              <span
                className={`block absolute h-0.5 w-6 bg-current transform transition-all duration-300 ease-out ${
                  isMobileMenuOpen ? "rotate-45 top-3" : "top-1"
                }`}
              ></span>
              <span
                className={`block absolute h-0.5 w-6 bg-current transform transition-all duration-300 ease-out top-3 ${
                  isMobileMenuOpen ? "opacity-0" : "opacity-100"
                }`}
              ></span>
              <span
                className={`block absolute h-0.5 w-6 bg-current transform transition-all duration-300 ease-out ${
                  isMobileMenuOpen ? "-rotate-45 top-3" : "top-5"
                }`}
              ></span>
            </div>
          </button>
        </div>

        <style jsx>{`
          .glow-effect {
            box-shadow:
              0 0 20px rgba(147, 51, 234, 0.3),
              0 0 40px rgba(147, 51, 234, 0.2),
              0 0 80px rgba(147, 51, 234, 0.1);
          }
        `}</style>
      </nav>

      {/* Mobile Menu Overlay */}
      <div
        className={`fixed inset-0 z-40 md:hidden transition-all duration-300 ease-out ${
          isMobileMenuOpen ? "opacity-100 visible" : "opacity-0 invisible"
        }`}
      >
        {/* Backdrop */}
        <div
          className={`absolute inset-0 bg-black/80 backdrop-blur-sm transition-all duration-300 ease-out ${
            isMobileMenuOpen ? "opacity-100" : "opacity-0"
          }`}
          onClick={closeMobileMenu}
        ></div>

        {/* Mobile Menu Content */}
        <div
          className={`absolute top-24 left-1/2 transform -translate-x-1/2 w-[80%] max-w-md backdrop-blur-md border border-purple-500/40 rounded-3xl shadow-2xl shadow-purple-500/25 transition-all duration-500 ease-out ${
            isDark ? "bg-black/90" : "bg-white/90"
          } ${
            isMobileMenuOpen
              ? "translate-y-0 opacity-100 scale-100"
              : "-translate-y-8 opacity-0 scale-95"
          }`}
        >
          <div className="p-6 space-y-4">
            {/* Mobile Navigation Links */}
            <Link
              href="/"
              onClick={closeMobileMenu}
              className={`block px-6 py-4 rounded-2xl transition-all duration-300 text-lg font-medium font-body hover:bg-purple-600/20 border border-transparent hover:border-purple-500/30 ${
                isDark
                  ? "text-white/80 hover:text-white"
                  : "text-gray-700/80 hover:text-gray-900"
              }`}
            >
              Home
            </Link>
            <button
              onClick={() => {
                closeMobileMenu();
                const pricingSection =
                  document.getElementById("pricing-section");
                if (pricingSection) {
                  const offset = 100; // Offset for fixed navbar
                  const elementPosition =
                    pricingSection.getBoundingClientRect().top;
                  const offsetPosition =
                    elementPosition + window.pageYOffset - offset;

                  window.scrollTo({
                    top: offsetPosition,
                    behavior: "smooth",
                  });
                }
              }}
              className={`block w-full text-left px-6 py-4 rounded-2xl transition-all duration-300 text-lg font-medium font-body hover:bg-purple-600/20 border border-transparent hover:border-purple-500/30 ${
                isDark
                  ? "text-white/80 hover:text-white"
                  : "text-gray-700/80 hover:text-gray-900"
              }`}
            >
              Pricing
            </button>
            <Link
              href="/contact"
              onClick={closeMobileMenu}
              className={`block px-6 py-4 rounded-2xl transition-all duration-300 text-lg font-medium font-body hover:bg-purple-600/20 border border-transparent hover:border-purple-500/30 ${
                isDark
                  ? "text-white/80 hover:text-white"
                  : "text-gray-700/80 hover:text-gray-900"
              }`}
            >
              Contact Us
            </Link>

            {/* Mobile Theme Toggle */}
            <button
              onClick={toggleTheme}
              className={`w-full flex items-center justify-between px-6 py-4 rounded-2xl transition-all duration-300 text-lg font-medium font-body hover:bg-purple-600/20 border border-transparent hover:border-purple-500/30 ${
                isDark
                  ? "text-white/80 hover:text-white"
                  : "text-gray-700/80 hover:text-gray-900"
              }`}
            >
              <span>Theme</span>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-400">
                  {isDark ? "Dark" : "Light"}
                </span>
                <div
                  className={`w-8 h-8 backdrop-blur-sm border rounded-full flex items-center justify-center ${
                    isDark
                      ? "bg-white/5 border-white/10"
                      : "bg-gray-900/5 border-gray-300/20"
                  }`}
                >
                  {isDark ? (
                    <svg
                      className="w-4 h-4 text-yellow-400"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="w-4 h-4 text-purple-400"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                    </svg>
                  )}
                </div>
              </div>
            </button>

            {/* Mobile Login/Profile Section */}
            <div className="pt-4 border-t border-purple-500/20">
              {user ? (
                <>
                  {/* User Info */}
                  <div className="flex items-center space-x-3 px-6 py-4 mb-4 bg-purple-600/10 rounded-2xl">
                    <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                      {user.user_metadata?.full_name?.[0] ||
                        user.email?.[0] ||
                        "U"}
                    </div>
                    <div>
                      <p className="text-white font-medium">
                        {user.user_metadata?.full_name || "User"}
                      </p>
                      <p className="text-gray-400 text-sm">{user.email}</p>
                    </div>
                  </div>

                  {/* Mobile Profile Links */}
                  <Link
                    href="/workspace"
                    onClick={closeMobileMenu}
                    className="block text-white/80 hover:text-white px-6 py-4 rounded-2xl transition-all duration-300 text-lg font-medium font-body hover:bg-purple-600/20 border border-transparent hover:border-purple-500/30 mb-2"
                  >
                    🏠 Workspace
                  </Link>

                  <button
                    onClick={() => {
                      handleSignOut();
                      closeMobileMenu();
                    }}
                    className="block w-full text-left text-white/80 hover:text-white px-6 py-4 rounded-2xl transition-all duration-300 text-lg font-medium font-body hover:bg-red-600/20 border border-transparent hover:border-red-500/30"
                  >
                    🚪 Sign Out
                  </button>
                </>
              ) : (
                <Link
                  href="/auth"
                  onClick={closeMobileMenu}
                  className="block bg-gradient-to-r from-purple-600 to-purple-800 text-white px-6 py-4 rounded-2xl transition-all duration-300 text-lg font-medium shadow-lg shadow-purple-600/30 hover:shadow-purple-500/50 font-body text-center hover:from-purple-500 hover:to-purple-700"
                >
                  Log In
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default FloatingNavbar;
