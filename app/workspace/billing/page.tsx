"use client";

import { useState, useEffect } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import WithAuth from "@/app/components/WithAuth";
import WorkspaceSidebar from "@/app/components/WorkspaceSidebar";
import WorkspaceNavbar from "@/app/components/WorkspaceNavbar";
import { STORAGE_KEYS, SUBSCRIPTION_PLANS } from "@/constants";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/hooks/useSubscription";
import Link from "next/link";

type PlanType = keyof typeof SUBSCRIPTION_PLANS;

interface BasePlanDetails {
  name: string;
  price: number | null;
  videos_per_month: number | null;
  storage_mb: number | null;
  features: string[];
}

interface RegularPlanDetails extends BasePlanDetails {
  monthlyUrl: string;
  yearlyUrl: string;
  customUrl?: never;
}

interface CustomPlanDetails extends BasePlanDetails {
  customUrl: string;
  monthlyUrl?: never;
  yearlyUrl?: never;
}

type PlanDetails = RegularPlanDetails | CustomPlanDetails;

const BillingPage = () => {
  const { isDark } = useTheme();
  const { user } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAnnual, setIsAnnual] = useState(false);
  const {
    subscriptionData,
    isLoading,
    error: subscriptionError,
  } = useSubscription(user?.id);

  const [currentPlan, setCurrentPlan] = useState<PlanType>("NA"); // Default to NA plan

  const handleSubscription = (plan: PlanType) => {
    const planDetails = SUBSCRIPTION_PLANS[plan];
    if (!planDetails) return;

    let checkoutUrl = "";
    if ("customUrl" in planDetails) {
      checkoutUrl = planDetails.customUrl;
    } else if ("monthlyUrl" in planDetails && "yearlyUrl" in planDetails) {
      checkoutUrl = isAnnual ? planDetails.yearlyUrl : planDetails.monthlyUrl;
    }

    if (checkoutUrl) {
      window.location.href = checkoutUrl;
    }
  };

  // Update currentPlan when subscription data changes
  useEffect(() => {
    if (subscriptionData?.subscriptionStatus) {
      setCurrentPlan(subscriptionData.subscriptionStatus as PlanType);
    }
  }, [subscriptionData]);

  // User data derived from subscription data
  const userData = subscriptionData
    ? {
        fullName: user?.user_metadata?.full_name || "",
        email: user?.email || "",
        tokenBalance: subscriptionData.tokenBalance || 0,
        totalTokensPurchased: subscriptionData.totalTokensPurchased || 0,
        totalVideosProcessed: subscriptionData.totalVideosProcessed || 0,
        subscriptionStatus: subscriptionData.subscriptionStatus as PlanType,
        nextBillingDate: subscriptionData.nextBillingDate,
        credits: subscriptionData.credits || 0,
        latestPayment: { amount: 0, date: "", status: "" }, // Placeholder for latest payment
        billingPeriod:
          subscriptionData.subscriptionStartDate &&
          subscriptionData.subscriptionEndDate
            ? {
                start: subscriptionData.subscriptionStartDate,
                end: subscriptionData.subscriptionEndDate,
              }
            : undefined,
      }
    : null;

  // Payment gateway URL
  const PAYMENT_GATEWAY_URL =
    "https://labs.jayasim.com/web/checkout/68b4047f69c893d428a2d6c4"; // Your payment gateway URL

  // Update current plan whenever subscription data changes
  useEffect(() => {
    if (subscriptionData?.subscriptionStatus) {
      setCurrentPlan(subscriptionData.subscriptionStatus as PlanType);
    }
  }, [subscriptionData]);

  // Persist sidebar state to localStorage
  useEffect(() => {
    const savedState = localStorage.getItem(STORAGE_KEYS.SIDEBAR_COLLAPSED);
    if (savedState !== null) {
      setSidebarCollapsed(JSON.parse(savedState));
    }
  }, []);

  return (
    <div
      className={`min-h-screen transition-colors duration-500 ${
        isDark ? "bg-black" : "bg-white"
      }`}
    >
      {/* Sidebar */}
      <WorkspaceSidebar
        isCollapsed={sidebarCollapsed}
        setIsCollapsed={setSidebarCollapsed}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
      />

      {/* Workspace Navbar */}
      <WorkspaceNavbar
        sidebarCollapsed={sidebarCollapsed}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
      />

      {/* Main Content */}
      <div
        className={`transition-all duration-300 ${
          sidebarCollapsed ? "ml-0 md:ml-16" : "ml-0 md:ml-64"
        } pt-24 md:pt-20 relative overflow-hidden`}
      >
        {/* Dynamic Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div
            className={`absolute top-20 left-10 w-32 h-32 rounded-full blur-3xl animate-pulse ${
              isDark ? "bg-purple-600/10" : "bg-purple-600/5"
            }`}
          ></div>
          <div
            className={`absolute bottom-32 right-16 w-24 h-24 rounded-full blur-2xl animate-pulse ${
              isDark ? "bg-blue-600/8" : "bg-blue-600/4"
            }`}
            style={{ animationDelay: "3s" }}
          ></div>
        </div>

        {/* Page Header */}
        <div className="relative z-10 px-4 md:px-8 pb-6 md:pb-8">
          <div className="max-w-6xl mx-auto">
            <h1
              className={`text-2xl md:text-3xl font-bold mb-2 transition-colors duration-300 ${
                isDark ? "text-white" : "text-gray-900"
              }`}
            >
              Billing & Subscription
            </h1>
            <p
              className={`text-sm md:text-base transition-colors duration-300 ${
                isDark ? "text-gray-400" : "text-gray-600"
              }`}
            >
              Manage your subscription plan and billing details
            </p>
          </div>
        </div>

        {/* Billing Content */}
        <div className="relative z-10 px-4 md:px-8 pb-8 md:pb-12">
          <div className="max-w-6xl mx-auto space-y-6 md:space-y-8">
            {/* Current Plan */}
            <div
              className={`rounded-2xl md:rounded-3xl border backdrop-blur-sm p-6 md:p-8 transition-all duration-300 ${
                isDark
                  ? "bg-black/50 border-gray-800"
                  : "bg-white/50 border-gray-200"
              }`}
            >
              {isLoading ? (
                <div className="w-full flex justify-center py-12">
                  <div
                    className={`h-10 w-10 rounded-full border-4 border-t-transparent animate-spin ${
                      isDark ? "border-purple-500" : "border-purple-600"
                    }`}
                  ></div>
                </div>
              ) : (
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                  <div>
                    <h2
                      className={`text-lg md:text-xl font-bold mb-2 transition-colors duration-300 ${
                        isDark ? "text-white" : "text-gray-900"
                      }`}
                    >
                      Current Plan:{" "}
                      {SUBSCRIPTION_PLANS[currentPlan]?.name || "No Plan"}
                    </h2>
                    <p
                      className={`text-sm md:text-base mb-4 transition-colors duration-300 ${
                        isDark ? "text-gray-400" : "text-gray-600"
                      }`}
                    >
                      $
                      {isAnnual
                        ? (SUBSCRIPTION_PLANS[currentPlan]?.price || 0) * 0.8
                        : SUBSCRIPTION_PLANS[currentPlan]?.price || 0}
                      /{isAnnual ? "year" : "month"} • Billed $
                      {isAnnual ? "annually" : "monthly"} • Next billing: $
                      {new Date(
                        new Date().setMonth(
                          new Date().getMonth() + (isAnnual ? 12 : 1)
                        )
                      ).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                    <div className="flex flex-wrap gap-2 mb-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          isDark
                            ? "bg-green-900/30 text-green-400"
                            : "bg-green-100 text-green-700"
                        }`}
                      >
                        Active
                      </span>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          isDark
                            ? "bg-purple-900/30 text-purple-400"
                            : "bg-purple-100 text-purple-700"
                        }`}
                      >
                        Auto-renewal ON
                      </span>
                    </div>

                    {/* Credits Display */}
                    <div className="mt-4">
                      <h3
                        className={`text-base font-semibold mb-2 ${
                          isDark ? "text-white" : "text-gray-900"
                        }`}
                      >
                        Credits Balance:
                      </h3>
                      <div
                        className={`inline-flex items-center px-4 py-2 rounded-lg ${
                          isDark
                            ? "bg-purple-900/30 border border-purple-700"
                            : "bg-purple-50 border border-purple-200"
                        }`}
                      >
                        <svg
                          className="w-5 h-5 mr-2 text-purple-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                          />
                        </svg>
                        <span
                          className={`font-bold text-lg ${
                            isDark ? "text-white" : "text-gray-900"
                          }`}
                        >
                          {userData?.credits || 0} Credits
                        </span>
                      </div>
                      <p
                        className={`text-xs mt-1 ${
                          isDark ? "text-gray-400" : "text-gray-600"
                        }`}
                      >
                        1 credit = 1 minute of video processing
                      </p>
                    </div>

                    <div className="mt-4">
                      <h3
                        className={`text-base font-semibold mb-2 ${
                          isDark ? "text-white" : "text-gray-900"
                        }`}
                      >
                        Plan Features:
                      </h3>
                      <ul className="space-y-2">
                        {SUBSCRIPTION_PLANS[currentPlan]?.features?.map?.(
                          (feature, index) => (
                            <li key={index} className="flex items-start">
                              <span
                                className={`flex-shrink-0 mr-2 text-lg ${
                                  isDark ? "text-green-400" : "text-green-600"
                                }`}
                              >
                                ✓
                              </span>
                              <span
                                className={
                                  isDark ? "text-gray-300" : "text-gray-700"
                                }
                              >
                                {feature}
                              </span>
                            </li>
                          )
                        )}
                      </ul>
                    </div>
                  </div>
                  {/* <div className="flex flex-col sm:flex-row gap-3">
                    <Link
                      href={PAYMENT_GATEWAY_URL}
                      target="_blank"
                      className={`px-4 md:px-6 py-2 md:py-3 rounded-xl text-center font-medium transition-all duration-300 whitespace-nowrap ${
                        isDark
                          ? "bg-purple-600 hover:bg-purple-700 text-white"
                          : "bg-purple-600 hover:bg-purple-500 text-white"
                      }`}
                    >
                      Manage Billing
                    </Link>
                    <button
                      className={`px-4 md:px-6 py-2 md:py-3 rounded-xl font-medium transition-all duration-300 whitespace-nowrap ${
                        isDark
                          ? "border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
                          : "border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-gray-900 border"
                      }`}
                      onClick={() => setIsAnnual(!isAnnual)}
                    >
                      Switch to {isAnnual ? "Monthly" : "Annual"} Billing
                    </button>
                  </div> */}
                </div>
              )}
            </div>

            {/* Usage Statistics */}
            {/* <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              {[
                {
                  label: "Videos Processed",
                  value: userData?.totalVideosProcessed?.toString() || "0",
                  limit: (
                    SUBSCRIPTION_PLANS[currentPlan]?.videos_per_month || 0
                  ).toString(),
                  percentage: userData?.totalVideosProcessed
                    ? Math.min(
                        Math.round(
                          (userData.totalVideosProcessed /
                            (SUBSCRIPTION_PLANS[currentPlan]
                              ?.videos_per_month || 0) || 0) * 100
                        ),
                        100
                      )
                    : 0,
                  color: "purple",
                },
                {
                  label: "Token Balance",
                  value: userData?.tokenBalance?.toLocaleString() || "0",
                  limit: "Available",
                  percentage: 100,
                  color: "blue",
                },
                {
                  label: "Total Tokens Purchased",
                  value:
                    userData?.totalTokensPurchased?.toLocaleString() || "0",
                  limit: "Lifetime",
                  percentage: 100,
                  color: "green",
                },
                {
                  label: "Subscription Type",
                  value: SUBSCRIPTION_PLANS[currentPlan]?.name || "No Plan",
                  limit: userData?.latestPayment
                    ? isAnnual
                      ? "Yearly"
                      : "Monthly"
                    : "N/A",
                  percentage:
                    currentPlan === "BUSINESS"
                      ? 100
                      : currentPlan === "PRO"
                        ? 66
                        : 33,
                  color: "orange",
                },
              ].map((stat, index) => (
                <div
                  key={index}
                  className={`p-4 md:p-6 rounded-2xl border backdrop-blur-sm transition-all duration-300 hover:scale-105 ${
                    isDark
                      ? "bg-black/50 border-gray-800"
                      : "bg-white/50 border-gray-200"
                  }`}
                >
                  <h3
                    className={`text-xs md:text-sm font-medium mb-2 transition-colors duration-300 ${
                      isDark ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    {stat.label}
                  </h3>
                  <div className="flex items-baseline space-x-2 mb-3">
                    <span
                      className={`text-xl md:text-2xl font-bold transition-colors duration-300 ${
                        isDark ? "text-white" : "text-gray-900"
                      }`}
                    >
                      {stat.value}
                    </span>
                    <span
                      className={`text-xs transition-colors duration-300 ${
                        isDark ? "text-gray-500" : "text-gray-500"
                      }`}
                    >
                      / {stat.limit}
                    </span>
                  </div>
                  <div
                    className={`w-full h-2 rounded-full ${
                      isDark ? "bg-gray-800" : "bg-gray-200"
                    }`}
                  >
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        stat.color === "purple"
                          ? "bg-purple-600"
                          : stat.color === "blue"
                            ? "bg-blue-600"
                            : stat.color === "green"
                              ? "bg-green-600"
                              : "bg-orange-600"
                      }`}
                      style={{ width: `${stat.percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div> */}

            {/* Available Plans Section */}
            <div
              className={`rounded-2xl md:rounded-3xl border backdrop-blur-sm p-6 md:p-8 transition-all duration-300 ${
                isDark
                  ? "bg-black/50 border-gray-800"
                  : "bg-white/50 border-gray-200"
              }`}
            >
              <div className="mb-8">
                <h2
                  className={`text-lg md:text-xl font-bold mb-2 transition-colors duration-300 ${
                    isDark ? "text-white" : "text-gray-900"
                  }`}
                >
                  Available Subscription Plans
                </h2>
                <p
                  className={`text-sm md:text-base transition-colors duration-300 ${
                    isDark ? "text-gray-400" : "text-gray-600"
                  }`}
                >
                  Choose the right plan for your needs
                </p>

                {/* Billing Toggle */}
                <div className="flex items-center gap-4 mt-6">
                  <span
                    className={`text-sm font-medium transition-colors duration-300 font-body ${
                      !isAnnual
                        ? isDark
                          ? "text-white"
                          : "text-gray-900"
                        : isDark
                          ? "text-gray-400"
                          : "text-gray-500"
                    }`}
                  >
                    Monthly
                  </span>
                  <button
                    onClick={() => setIsAnnual(!isAnnual)}
                    className={`relative w-14 h-7 rounded-full transition-all duration-300 ${
                      isDark
                        ? "bg-gray-700 hover:bg-gray-600"
                        : "bg-gray-300 hover:bg-gray-400"
                    }`}
                  >
                    <div
                      className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform duration-300 ease-out ${
                        isAnnual
                          ? "transform translate-x-7 bg-purple-500"
                          : "transform translate-x-1"
                      }`}
                    ></div>
                  </button>
                  <span
                    className={`text-sm font-medium transition-colors duration-300 font-body ${
                      isAnnual
                        ? isDark
                          ? "text-white"
                          : "text-gray-900"
                        : isDark
                          ? "text-gray-400"
                          : "text-gray-500"
                    }`}
                  >
                    Annual
                    <span
                      className={`ml-2 text-xs px-2 py-1 rounded-full ${
                        isDark
                          ? "bg-purple-600/50 text-white"
                          : "bg-purple-100 text-purple-700"
                      }`}
                    >
                      Save 20%
                    </span>
                  </span>
                </div>
              </div>

              {/* Plans Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {Object.entries(SUBSCRIPTION_PLANS).map(([key, plan]) => {
                  const planKey = key as PlanType;
                  const isCurrent = currentPlan === planKey;
                  const planPrice =
                    plan.price === null
                      ? null
                      : isAnnual
                        ? (plan.price * 0.8).toFixed(2)
                        : plan.price;

                  return (
                    <div
                      key={key}
                      className={`relative rounded-xl p-6 transition-all duration-300 ${
                        isDark
                          ? `${
                              isCurrent
                                ? "bg-purple-900/30 border-2 border-purple-500"
                                : "bg-black/40 border border-gray-700 hover:border-gray-600"
                            }`
                          : `${
                              isCurrent
                                ? "bg-purple-50 border-2 border-purple-500"
                                : "bg-white/40 border border-gray-200 hover:border-gray-300"
                            }`
                      }`}
                    >
                      {isCurrent && (
                        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                          <span
                            className={`text-xs font-medium px-3 py-1 rounded-full ${
                              isDark
                                ? "bg-purple-600 text-white"
                                : "bg-purple-100 text-purple-700"
                            }`}
                          >
                            Current Plan
                          </span>
                        </div>
                      )}

                      <h3
                        className={`text-xl font-bold mb-2 ${
                          isDark ? "text-white" : "text-gray-900"
                        }`}
                      >
                        {plan.name}
                      </h3>

                      <div className="mb-4">
                        <div className="flex items-baseline">
                          <span
                            className={`text-3xl font-bold ${
                              isDark ? "text-white" : "text-gray-900"
                            }`}
                          >
                            ${planPrice}
                          </span>
                          <span
                            className={`text-sm ml-1 ${
                              isDark ? "text-gray-400" : "text-gray-600"
                            }`}
                          >
                            /{isAnnual ? "year" : "month"}
                          </span>
                        </div>
                        {planPrice !== null &&
                          typeof planPrice === "number" &&
                          planPrice > 0 &&
                          isAnnual && (
                            <p
                              className={`text-sm mt-1 ${
                                isDark ? "text-purple-400" : "text-purple-600"
                              }`}
                            >
                              Billed annually
                            </p>
                          )}
                      </div>

                      <div className="space-y-3 mb-6">
                        <div
                          className={`flex items-center ${
                            isDark ? "text-gray-300" : "text-gray-700"
                          }`}
                        >
                          <svg
                            className="w-5 h-5 mr-2 text-green-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            ></path>
                          </svg>
                          <span>
                            {plan.videos_per_month === null
                              ? "Custom video limit"
                              : `${plan.videos_per_month} videos per month`}
                          </span>
                        </div>
                        <div
                          className={`flex items-center ${
                            isDark ? "text-gray-300" : "text-gray-700"
                          }`}
                        >
                          <svg
                            className="w-5 h-5 mr-2 text-green-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            ></path>
                          </svg>
                          <span>
                            {plan.storage_mb === null
                              ? "Custom"
                              : `${(plan.storage_mb / 1000).toFixed(
                                  1
                                )} GB`}{" "}
                            storage
                          </span>
                        </div>

                        <div
                          className={`flex items-center ${
                            isDark ? "text-gray-300" : "text-gray-700"
                          }`}
                        >
                          <svg
                            className="w-5 h-5 mr-2 text-green-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            ></path>
                          </svg>
                          <span>
                            {plan.credits === null
                              ? "Custom credits"
                              : `${plan.credits} credits included`}
                          </span>
                        </div>

                        {plan.features.map((feature, idx) => (
                          <div
                            key={idx}
                            className={`flex items-center ${
                              isDark ? "text-gray-300" : "text-gray-700"
                            }`}
                          >
                            <svg
                              className="w-5 h-5 mr-2 text-green-500"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 13l4 4L19 7"
                              ></path>
                            </svg>
                            <span>{feature}</span>
                          </div>
                        ))}
                      </div>

                      {isCurrent ? (
                        <button
                          className={`w-full py-2 rounded-lg font-medium ${
                            isDark
                              ? "bg-gray-800 text-gray-300 cursor-default"
                              : "bg-gray-200 text-gray-500 cursor-default"
                          }`}
                          disabled
                        >
                          Current Plan
                        </button>
                      ) : (
                        <button
                          onClick={() => handleSubscription(planKey)}
                          className={`block w-full py-2 rounded-lg font-medium text-center ${
                            isDark
                              ? "bg-purple-600 hover:bg-purple-700 text-white"
                              : "bg-purple-600 hover:bg-purple-500 text-white"
                          }`}
                        >
                          {planKey === "CUSTOM"
                            ? "Select Plan"
                            : planPrice === 0
                              ? "Select Plan"
                              : "Select Plan"}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Payment Methods */}
            {/* <div
              className={`rounded-2xl md:rounded-3xl border backdrop-blur-sm p-6 md:p-8 transition-all duration-300 ${
                isDark
                  ? "bg-black/50 border-gray-800"
                  : "bg-white/50 border-gray-200"
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <h2
                  className={`text-lg md:text-xl font-bold transition-colors duration-300 ${
                    isDark ? "text-white" : "text-gray-900"
                  }`}
                >
                  Payment Methods
                </h2>
                <button
                  className={`px-4 md:px-6 py-2 md:py-3 rounded-xl border font-medium transition-all duration-300 whitespace-nowrap ${
                    isDark
                      ? "border-purple-600 text-purple-400 hover:bg-purple-600/10"
                      : "border-purple-600 text-purple-600 hover:bg-purple-50"
                  }`}
                >
                  Add Payment Method
                </button>
              </div> */}

            {/* Payment Method Card */}
            {/* <div
                className={`p-4 md:p-6 rounded-xl border transition-all duration-300 ${
                  isDark
                    ? "bg-gray-900/50 border-gray-700"
                    : "bg-gray-50/50 border-gray-200"
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-center space-x-4">
                    <div
                      className={`w-12 h-8 rounded-lg flex items-center justify-center ${
                        isDark ? "bg-blue-600" : "bg-blue-500"
                      }`}
                    >
                      <span className="text-white font-bold text-xs">VISA</span>
                    </div>
                    <div>
                      <p
                        className={`font-medium text-sm md:text-base transition-colors duration-300 ${
                          isDark ? "text-white" : "text-gray-900"
                        }`}
                      >
                        •••• •••• •••• 4242
                      </p>
                      <p
                        className={`text-xs md:text-sm transition-colors duration-300 ${
                          isDark ? "text-gray-400" : "text-gray-600"
                        }`}
                      >
                        Expires 12/2026 • Default
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      className={`px-3 py-1 text-xs rounded-lg transition-colors duration-300 ${
                        isDark
                          ? "text-gray-400 hover:text-white hover:bg-gray-800"
                          : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                      }`}
                    >
                      Edit
                    </button>
                    <button
                      className={`px-3 py-1 text-xs rounded-lg transition-colors duration-300 ${
                        isDark
                          ? "text-red-400 hover:bg-red-900/20"
                          : "text-red-600 hover:bg-red-100"
                      }`}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            </div> */}

            {/* Billing History */}
            <div
              className={`rounded-2xl md:rounded-3xl border backdrop-blur-sm p-6 md:p-8 transition-all duration-300 ${
                isDark
                  ? "bg-black/50 border-gray-800"
                  : "bg-white/50 border-gray-200"
              }`}
            >
              <h2
                className={`text-lg md:text-xl font-bold mb-6 transition-colors duration-300 ${
                  isDark ? "text-white" : "text-gray-900"
                }`}
              >
                Billing History
              </h2>

              {isLoading ? (
                <div className="w-full flex justify-center py-12">
                  <div
                    className={`h-10 w-10 rounded-full border-4 border-t-transparent animate-spin ${
                      isDark ? "border-purple-500" : "border-purple-600"
                    }`}
                  ></div>
                </div>
              ) : subscriptionError ? (
                <div className="text-center py-8">
                  <p className={`text-red-500`}>
                    Failed to load billing history: {subscriptionError}
                  </p>
                </div>
              ) : !subscriptionData?.billingHistory?.length ? (
                <div className="text-center py-8">
                  <p className={isDark ? "text-gray-400" : "text-gray-600"}>
                    No billing history available.
                  </p>
                </div>
              ) : (
                <>
                  {/* Mobile Card Layout */}
                  <div className="block md:hidden space-y-4">
                    {subscriptionData.billingHistory.map((invoice, index) => {
                      const date = new Date(
                        invoice.created_at
                      ).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      });

                      // Format description based on subscription type or amount
                      let description = invoice.description || "Transaction";
                      if (!description) {
                        if (invoice.amount_usd >= 99) {
                          description = "Business Plan";
                        } else if (invoice.amount_usd >= 29) {
                          description = "Pro Plan";
                        } else {
                          description = "Payment";
                        }
                      }

                      return (
                        <div
                          key={invoice.id || index}
                          className={`p-4 rounded-xl border transition-all duration-300 ${
                            isDark
                              ? "bg-gray-900/50 border-gray-700"
                              : "bg-gray-50/50 border-gray-200"
                          }`}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <p
                                className={`font-medium text-sm transition-colors duration-300 ${
                                  isDark ? "text-white" : "text-gray-900"
                                }`}
                              >
                                {description}
                              </p>
                              <p
                                className={`text-xs transition-colors duration-300 ${
                                  isDark ? "text-gray-400" : "text-gray-600"
                                }`}
                              >
                                {date}
                              </p>
                            </div>
                            <span
                              className={`px-2 py-1 text-xs font-medium rounded-full ${
                                invoice.payment_status === "completed" ||
                                invoice.payment_status === "paid"
                                  ? isDark
                                    ? "bg-green-900/30 text-green-400"
                                    : "bg-green-100 text-green-700"
                                  : isDark
                                    ? "bg-yellow-900/30 text-yellow-400"
                                    : "bg-yellow-100 text-yellow-700"
                              }`}
                            >
                              {invoice.payment_status === "completed"
                                ? "Paid"
                                : invoice.payment_status}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span
                              className={`font-bold text-sm transition-colors duration-300 ${
                                isDark ? "text-white" : "text-gray-900"
                              }`}
                            >
                              ${invoice.amount_usd?.toFixed(2) || "0.00"}
                            </span>
                            {invoice.invoice_url && (
                              <a
                                href={invoice.invoice_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`text-xs px-3 py-1 rounded-lg transition-colors duration-300 ${
                                  isDark
                                    ? "text-purple-400 hover:bg-purple-600/20"
                                    : "text-purple-600 hover:bg-purple-100"
                                }`}
                              >
                                Download
                              </a>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Desktop Table Layout */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr
                          className={`border-b transition-colors duration-300 ${
                            isDark ? "border-gray-700" : "border-gray-200"
                          }`}
                        >
                          <th
                            className={`text-left py-3 px-4 font-medium text-sm transition-colors duration-300 ${
                              isDark ? "text-gray-300" : "text-gray-700"
                            }`}
                          >
                            Date
                          </th>
                          <th
                            className={`text-left py-3 px-4 font-medium text-sm transition-colors duration-300 ${
                              isDark ? "text-gray-300" : "text-gray-700"
                            }`}
                          >
                            Description
                          </th>
                          <th
                            className={`text-left py-3 px-4 font-medium text-sm transition-colors duration-300 ${
                              isDark ? "text-gray-300" : "text-gray-700"
                            }`}
                          >
                            Amount
                          </th>
                          <th
                            className={`text-left py-3 px-4 font-medium text-sm transition-colors duration-300 ${
                              isDark ? "text-gray-300" : "text-gray-700"
                            }`}
                          >
                            Status
                          </th>
                          <th className="w-24"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {subscriptionData.billingHistory.map(
                          (invoice, index) => {
                            const date = new Date(
                              invoice.created_at
                            ).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            });

                            // Format description based on subscription type or amount
                            let description =
                              invoice.description || "Transaction";
                            if (!description) {
                              if (invoice.amount_usd >= 99) {
                                description = "Business Plan";
                              } else if (invoice.amount_usd >= 29) {
                                description = "Pro Plan";
                              } else {
                                description = "Payment";
                              }
                            }

                            return (
                              <tr
                                key={invoice.id || index}
                                className={`border-b transition-colors duration-300 ${
                                  isDark ? "border-gray-800" : "border-gray-100"
                                }`}
                              >
                                <td
                                  className={`py-4 px-4 text-sm transition-colors duration-300 ${
                                    isDark ? "text-gray-400" : "text-gray-600"
                                  }`}
                                >
                                  {date}
                                </td>
                                <td
                                  className={`py-4 px-4 font-medium text-sm transition-colors duration-300 ${
                                    isDark ? "text-white" : "text-gray-900"
                                  }`}
                                >
                                  {description}
                                </td>
                                <td
                                  className={`py-4 px-4 font-bold text-sm transition-colors duration-300 ${
                                    isDark ? "text-white" : "text-gray-900"
                                  }`}
                                >
                                  ${invoice.amount_usd?.toFixed(2) || "0.00"}
                                </td>
                                <td className="py-4 px-4">
                                  <span
                                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                                      invoice.payment_status === "completed" ||
                                      invoice.payment_status === "paid"
                                        ? isDark
                                          ? "bg-green-900/30 text-green-400"
                                          : "bg-green-100 text-green-700"
                                        : isDark
                                          ? "bg-yellow-900/30 text-yellow-400"
                                          : "bg-yellow-100 text-yellow-700"
                                    }`}
                                  >
                                    {invoice.payment_status === "completed"
                                      ? "Paid"
                                      : invoice.payment_status}
                                  </span>
                                </td>
                                <td className="py-4 px-4">
                                  {invoice.invoice_url && (
                                    <a
                                      href={invoice.invoice_url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className={`text-xs px-3 py-1 rounded-lg transition-colors duration-300 ${
                                        isDark
                                          ? "text-purple-400 hover:bg-purple-600/20"
                                          : "text-purple-600 hover:bg-purple-100"
                                      }`}
                                    >
                                      Download
                                    </a>
                                  )}
                                </td>
                              </tr>
                            );
                          }
                        )}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ProtectedBillingPage = () => {
  return (
    <WithAuth>
      <BillingPage />
    </WithAuth>
  );
};

export default ProtectedBillingPage;
