"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signUp, signIn, signInWithGoogle, supabase } from "@/lib/supabase";

// Component that uses useSearchParams - needs to be wrapped in Suspense
const AuthForm = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const router = useRouter();
  const searchParams = useSearchParams();

  // Track mouse movement for interactive effects
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth) * 100,
        y: (e.clientY / window.innerHeight) * 100,
      });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // Check for URL parameters (errors, success messages)
  useEffect(() => {
    const errorParam = searchParams.get("error");
    if (errorParam) {
      setError("Authentication failed. Please try again.");
    }
  }, [searchParams]);

  // Check if user is already authenticated
  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user) {
        // User is already authenticated, redirect to workspace
        const redirectTo = searchParams.get("redirectTo") || "/workspace";
        router.push(redirectTo);
      }
    };

    checkSession();
  }, [searchParams, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      if (isLogin) {
        // Sign in
        const { data, error } = await signIn(email, password);

        if (error) {
          setError(error.message);
        } else if (data?.user) {
          setSuccess("Successfully signed in! Redirecting...");
          setTimeout(() => {
            // Check if there's a redirect URL in search params
            const redirectTo = searchParams.get("redirectTo") || "/workspace";
            router.push(redirectTo);
          }, 1000);
        }
      } else {
        // Sign up
        if (password !== confirmPassword) {
          setError("Passwords do not match");
          return;
        }

        if (password.length < 6) {
          setError("Password must be at least 6 characters long");
          return;
        }

        const { data, error } = await signUp(email, password, name);

        if (error) {
          setError(error.message);
        } else if (data?.user) {
          setSuccess(
            "Account created! Check your email to verify your account."
          );
        }
      }
    } catch (error: unknown) {
      setError("An unexpected error occurred. Please try again.");
      console.error("Auth error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setError("");
      const { error } = await signInWithGoogle();

      if (error) {
        setError("Failed to sign in with Google. Please try again.");
        console.error("Google auth error:", error);
      }
      // The redirect will be handled automatically by Supabase
    } catch (error) {
      setError("An unexpected error occurred. Please try again.");
      console.error("Google auth error:", error);
    }
  };

  return (
    <div className="min-h-screen pt-24 bg-black relative overflow-hidden flex items-center justify-center p-6">
      {/* Dynamic Background with Mouse Interaction */}
      <div className="absolute inset-0">
        {/* Main gradient background */}
        <div
          className="absolute inset-0 opacity-60 transition-all duration-1000 ease-out"
          style={{
            background: `radial-gradient(circle at ${mousePosition.x}% ${mousePosition.y}%, rgba(147, 51, 234, 0.3) 0%, rgba(59, 130, 246, 0.2) 25%, rgba(0, 0, 0, 1) 50%)`,
          }}
        ></div>

        {/* Animated orbs */}
        <div className="absolute top-20 left-20 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl animate-pulse-gentle"></div>
        <div
          className="absolute top-40 right-32 w-80 h-80 bg-blue-600/15 rounded-full blur-3xl animate-pulse-gentle"
          style={{ animationDelay: "2s" }}
        ></div>
        <div
          className="absolute bottom-32 left-40 w-72 h-72 bg-purple-500/8 rounded-full blur-3xl animate-pulse-gentle"
          style={{ animationDelay: "4s" }}
        ></div>
        <div
          className="absolute bottom-20 right-20 w-88 h-88 bg-blue-500/12 rounded-full blur-3xl animate-pulse-gentle"
          style={{ animationDelay: "1s" }}
        ></div>

        {/* Floating elements */}
        <div className="absolute top-32 right-1/4 w-4 h-4 bg-purple-400/60 rounded-full animate-float-slow"></div>
        <div
          className="absolute bottom-40 left-1/3 w-3 h-3 bg-blue-400/60 rounded-full animate-float-slow"
          style={{ animationDelay: "1.5s" }}
        ></div>
        <div
          className="absolute top-1/2 left-1/4 w-2 h-2 bg-purple-300/60 rounded-full animate-float-slow"
          style={{ animationDelay: "3s" }}
        ></div>
        <div
          className="absolute top-1/3 right-1/3 w-5 h-5 bg-blue-300/60 rounded-full animate-float-slow"
          style={{ animationDelay: "2.5s" }}
        ></div>
      </div>

      {/* Main Content Container */}
      <div className="relative z-10 w-full max-w-5xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Side - Brand Showcase */}
          <div className="text-center lg:text-left space-y-8 order-2 lg:order-1">
            {/* Main Brand */}
            <div className="space-y-6">
              <div className="relative inline-block">
                <h1 className="text-6xl lg:text-7xl font-bold bg-gradient-to-r from-white via-purple-200 to-blue-200 bg-clip-text text-transparent font-heading animate-fade-in">
                  TranslateA2Z
                </h1>
                <div className="absolute -inset-4 bg-gradient-to-r from-purple-600/20 to-blue-600/20 blur-2xl opacity-50 animate-glow-pulse"></div>
              </div>

              <p
                className="text-xl lg:text-2xl text-gray-300 font-body leading-relaxed max-w-lg animate-slide-up"
                style={{ animationDelay: "0.3s" }}
              >
                Transform your videos into accessible content with AI-powered
                subtitle generation that understands every word.
              </p>
            </div>

            {/* Feature Icons */}
            <div
              className="flex justify-center lg:justify-start space-x-8 animate-slide-up"
              style={{ animationDelay: "0.6s" }}
            >
              {[
                { icon: "🎥", label: "Videos" },
                { icon: "✨", label: "AI Magic" },
                { icon: "📝", label: "Subtitles" },
                { icon: "🚀", label: "Export" },
              ].map((item, index) => (
                <div
                  key={index}
                  className="text-center group cursor-pointer"
                  style={{ animationDelay: `${0.8 + index * 0.2}s` }}
                >
                  <div className="text-4xl mb-2 transform group-hover:scale-125 transition-all duration-300 animate-fade-in">
                    {item.icon}
                  </div>
                  <div className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors duration-300">
                    {item.label}
                  </div>
                </div>
              ))}
            </div>

            {/* Stats */}
            <div
              className="flex justify-center lg:justify-start space-x-12 animate-slide-up"
              style={{ animationDelay: "1.2s" }}
            >
              <div className="text-center">
                <div className="text-3xl font-bold text-white font-heading">
                  10M+
                </div>
                <div className="text-sm text-gray-400">Videos Processed</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white font-heading">
                  99.9%
                </div>
                <div className="text-sm text-gray-400">Accuracy Rate</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white font-heading">
                  150+
                </div>
                <div className="text-sm text-gray-400">Languages</div>
              </div>
            </div>
          </div>

          {/* Right Side - Auth Form */}
          <div className="order-1 lg:order-2 flex justify-center">
            <div className="w-full max-w-md">
              {/* Form Container */}
              <div
                className="relative group animate-scale-in"
                style={{ animationDelay: "0.4s" }}
              >
                {/* Glowing border effect */}
                <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 via-blue-600 to-purple-600 rounded-3xl opacity-20 group-hover:opacity-40 transition-opacity duration-500 blur-sm"></div>

                {/* Main form */}
                <div className="relative bg-black/60 backdrop-blur-xl border border-gray-800/50 rounded-3xl p-6 shadow-2xl">
                  {/* Toggle Switch */}
                  <div className="flex bg-gray-900/80 rounded-2xl p-1 mb-6 relative overflow-hidden">
                    <div
                      className={`absolute top-1 bottom-1 w-1/2 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl transition-all duration-500 ease-out ${
                        isLogin ? "left-1" : "left-1/2"
                      }`}
                    ></div>
                    <button
                      onClick={() => setIsLogin(true)}
                      className="relative flex-1 py-3 px-4 rounded-xl font-medium transition-all duration-300 text-center z-10"
                    >
                      <span
                        className={`transition-colors duration-300 ${
                          isLogin
                            ? "text-white"
                            : "text-gray-400 hover:text-gray-300"
                        }`}
                      >
                        Login
                      </span>
                    </button>
                    <button
                      onClick={() => setIsLogin(false)}
                      className="relative flex-1 py-3 px-4 rounded-xl font-medium transition-all duration-300 text-center z-10"
                    >
                      <span
                        className={`transition-colors duration-300 ${
                          !isLogin
                            ? "text-white"
                            : "text-gray-400 hover:text-gray-300"
                        }`}
                      >
                        Sign Up
                      </span>
                    </button>
                  </div>

                  {/* Form Header */}
                  <div className="text-center mb-6 space-y-2">
                    <h2 className="text-3xl font-bold text-white font-heading">
                      {isLogin ? "Welcome Back!" : "Join TranslateA2Z"}
                    </h2>
                    <p className="text-gray-400 font-body">
                      {isLogin
                        ? "Continue your creative journey"
                        : "Start creating amazing subtitles"}
                    </p>
                  </div>

                  {/* Error/Success Messages */}
                  {error && (
                    <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm text-center">
                      {error}
                    </div>
                  )}
                  {success && (
                    <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400 text-sm text-center">
                      {success}
                    </div>
                  )}

                  {/* Google Login */}
                  <button
                    onClick={handleGoogleLogin}
                    className="w-full bg-white/95 hover:bg-white text-gray-900 font-medium py-3 px-5 rounded-2xl transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center space-x-3 group mb-5"
                  >
                    <svg
                      className="w-5 h-5 group-hover:scale-110 transition-transform duration-300"
                      viewBox="0 0 24 24"
                    >
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    <span>Continue with Google</span>
                  </button>

                  {/* Divider */}
                  <div className="relative mb-5">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-700"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-4 text-gray-400 bg-black/60">
                        or continue with email
                      </span>
                    </div>
                  </div>

                  {/* Form Fields */}
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {!isLogin && (
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Full Name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="w-full bg-gray-900/60 border border-gray-700/50 rounded-2xl py-3 px-5 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500/70 focus:bg-gray-900/80 transition-all duration-300 hover:border-gray-600/50"
                          required={!isLogin}
                        />
                        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-600/10 to-blue-600/10 opacity-0 focus-within:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                      </div>
                    )}

                    <div className="relative">
                      <input
                        type="email"
                        placeholder="Email Address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-gray-900/60 border border-gray-700/50 rounded-2xl py-3 px-5 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500/70 focus:bg-gray-900/80 transition-all duration-300 hover:border-gray-600/50"
                        required
                      />
                      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-600/10 to-blue-600/10 opacity-0 focus-within:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                    </div>

                    <div className="relative">
                      <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-gray-900/60 border border-gray-700/50 rounded-2xl py-3 px-5 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500/70 focus:bg-gray-900/80 transition-all duration-300 hover:border-gray-600/50"
                        required
                      />
                      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-600/10 to-blue-600/10 opacity-0 focus-within:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                    </div>

                    {!isLogin && (
                      <div className="relative">
                        <input
                          type="password"
                          placeholder="Confirm Password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="w-full bg-gray-900/60 border border-gray-700/50 rounded-2xl py-3 px-5 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500/70 focus:bg-gray-900/80 transition-all duration-300 hover:border-gray-600/50"
                          required={!isLogin}
                        />
                        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-600/10 to-blue-600/10 opacity-0 focus-within:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                      </div>
                    )}

                    {isLogin && (
                      <div className="flex items-center justify-between text-sm">
                        {/* <label className="flex items-center cursor-pointer group">
                          <input
                            type="checkbox"
                            className="w-4 h-4 rounded border-gray-600 text-purple-600 focus:ring-purple-500 focus:ring-offset-0 bg-gray-800"
                          />
                          <span className="ml-2 text-gray-400 group-hover:text-gray-300 transition-colors duration-300">
                            Remember me
                          </span>
                        </label> */}
                        <Link
                          href="#"
                          className="text-purple-400 hover:text-purple-300 transition-colors duration-300"
                        >
                          Forgot password?
                        </Link>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 disabled:from-gray-600 disabled:to-gray-600 text-white font-medium py-3 px-5 rounded-2xl transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/25 disabled:hover:scale-100 disabled:cursor-not-allowed relative overflow-hidden group"
                    >
                      {isLoading ? (
                        <div className="flex items-center justify-center space-x-3">
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          <span>Processing...</span>
                        </div>
                      ) : (
                        <span className="relative z-10">
                          {isLogin
                            ? "Sign In to TranslateA2Z"
                            : "Create Your Account"}
                        </span>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-400/20 to-blue-400/20 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-center"></div>
                    </button>
                  </form>

                  {/* Back Link */}
                  <div className="text-center pt-4">
                    <Link
                      href="/"
                      className="text-gray-400 hover:text-white transition-all duration-300 text-sm inline-flex items-center space-x-2 group"
                    >
                      <svg
                        className="w-4 h-4 group-hover:-translate-x-1 transition-transform duration-300"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 19l-7-7 7-7"
                        />
                      </svg>
                      <span>Back to TranslateA2Z</span>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Custom animations */}
      <style jsx>{`
        @keyframes float-slow {
          0%,
          100% {
            transform: translateY(0px);
            opacity: 0.6;
          }
          50% {
            transform: translateY(-10px);
            opacity: 1;
          }
        }

        @keyframes pulse-gentle {
          0%,
          100% {
            opacity: 0.2;
            transform: scale(1);
          }
          50% {
            opacity: 0.4;
            transform: scale(1.02);
          }
        }

        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes scale-in {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes glow-pulse {
          0%,
          100% {
            opacity: 0.3;
          }
          50% {
            opacity: 0.8;
          }
        }

        .animate-float-slow {
          animation: float-slow 4s ease-in-out infinite;
        }

        .animate-pulse-gentle {
          animation: pulse-gentle 6s ease-in-out infinite;
        }

        .animate-fade-in {
          animation: fade-in 1s ease-out forwards;
          opacity: 0;
        }

        .animate-slide-up {
          animation: slide-up 1s ease-out forwards;
          opacity: 0;
        }

        .animate-scale-in {
          animation: scale-in 0.8s ease-out forwards;
          opacity: 0;
        }

        .animate-glow-pulse {
          animation: glow-pulse 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

// Main component that wraps AuthForm in Suspense
const AuthPage = () => {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-black flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-gray-300 text-lg">Loading...</p>
          </div>
        </div>
      }
    >
      <AuthForm />
    </Suspense>
  );
};

export default AuthPage;
