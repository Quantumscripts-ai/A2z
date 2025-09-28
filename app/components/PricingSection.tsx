"use client";

import { useState } from "react";

const PricingSection = () => {
  const [isAnnual, setIsAnnual] = useState(false);

  const plans = [
    {
      name: "Starter",
      price: isAnnual ? 25 : 29,
      featured: false,
      features: [
        "Video transcription",
        "Basic subtitle editing",
        "SRT export format",
        "5 videos per month",
      ],
    },
    {
      name: "Pro",
      price: isAnnual ? 69 : 79,
      featured: true,
      features: [
        "Unlimited transcription",
        "Advanced timing editor",
        "Multiple export formats",
        "Auto-sync capabilities",
        "Custom styling options",
        "Priority processing",
      ],
    },
    {
      name: "Business",
      price: isAnnual ? 129 : 149,
      featured: false,
      features: [
        "Enterprise transcription",
        "Team collaboration tools",
        "Brand customization",
        "Bulk processing",
        "Advanced analytics",
        "White-label options",
        "Multi-user workspace",
        "API integration",
      ],
    },
  ];

  return (
    <section
      id="pricing-section"
      className="relative bg-radial-purple py-20 px-6 overflow-hidden"
    >
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-16 w-32 h-32 bg-purple-600/10 rounded-full blur-3xl animate-pulse"></div>
        <div
          className="absolute top-40 right-20 w-24 h-24 bg-blue-600/8 rounded-full blur-2xl animate-pulse"
          style={{ animationDelay: "1.5s" }}
        ></div>
        <div
          className="absolute bottom-32 left-1/3 w-40 h-40 bg-purple-500/8 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "3s" }}
        ></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 font-heading">
            Pricing
          </h2>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-8 font-body">
            Choose the right plan to meet your subtitle needs and start creating
            today.
          </p>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4 mb-12">
            <span
              className={`text-sm font-medium transition-colors duration-300 font-body ${
                !isAnnual ? "text-white" : "text-gray-400"
              }`}
            >
              Monthly
            </span>
            <button
              onClick={() => setIsAnnual(!isAnnual)}
              className="relative w-14 h-7 bg-gray-700 rounded-full transition-all duration-300 hover:bg-gray-600"
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
                isAnnual ? "text-white" : "text-gray-400"
              }`}
            >
              Annual
              <span className="ml-2 text-xs bg-purple-600 text-white px-2 py-1 rounded-full">
                Save 20%
              </span>
            </span>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative group transition-all duration-500 ease-out ${
                plan.featured ? "md:-translate-y-4" : ""
              }`}
            >
              {/* Featured Badge */}
              {plan.featured && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                  <div className="bg-gradient-to-r from-purple-600 to-purple-800 text-white px-4 py-2 rounded-full text-sm font-medium font-body shadow-lg">
                    Most Popular
                  </div>
                </div>
              )}

              {/* Card */}
              <div
                className={`relative h-full bg-black/40 backdrop-blur-sm rounded-2xl p-8 transition-all duration-500 group-hover:bg-black/60 flex flex-col ${
                  plan.featured
                    ? "border-2 border-purple-500/50 shadow-2xl shadow-purple-500/25"
                    : "border border-gray-700/50 hover:border-gray-600/50"
                }`}
              >
                {/* Plan Header */}
                <div className="mb-8">
                  <h3 className="text-2xl font-bold text-white mb-2 font-heading">
                    {plan.name}
                  </h3>
                  <div className="flex items-baseline">
                    <span className="text-4xl font-bold text-white font-heading">
                      ${plan.price}
                    </span>
                    <span className="text-gray-400 ml-1 font-body">/mo</span>
                  </div>
                  {isAnnual && (
                    <p className="text-sm text-purple-400 mt-2 font-body">
                      Billed annually
                    </p>
                  )}
                </div>

                {/* Features List */}
                <ul className="space-y-4 mb-8 flex-grow">
                  {plan.features.map((feature, featureIndex) => (
                    <li
                      key={featureIndex}
                      className="flex items-center text-gray-300 font-body"
                      style={{
                        animation: `fadeInUp 0.6s ease-out ${
                          featureIndex * 0.1
                        }s both`,
                      }}
                    >
                      <div className="w-5 h-5 bg-purple-600 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                        <svg
                          className="w-3 h-3 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={3}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </div>
                      <span className="group-hover:text-gray-200 transition-colors duration-300">
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* CTA Button */}
                <button
                  className={`w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-300 font-body ${
                    plan.featured
                      ? "bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-500 hover:to-purple-700 text-white shadow-lg shadow-purple-600/30 hover:shadow-purple-500/50 hover:scale-105"
                      : "bg-gray-800 hover:bg-gray-700 text-white border border-gray-700 hover:border-gray-600"
                  }`}
                >
                  Join waitlist
                </button>
              </div>

              {/* Glow Effect for Featured Card */}
              {plan.featured && (
                <div className="absolute inset-0 bg-gradient-radial from-purple-600/30 via-purple-800/20 to-black rounded-2xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity duration-500 -z-10"></div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Custom Animations */}
      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .bg-gradient-radial {
          background: radial-gradient(
            circle,
            rgba(147, 51, 234, 0.3) 0%,
            rgba(126, 34, 206, 0.2) 50%,
            rgba(0, 0, 0, 1) 100%
          );
        }

        .bg-radial-purple {
          background: radial-gradient(
            ellipse at center,
            rgba(147, 51, 234, 0.4) 0%,
            rgba(126, 34, 206, 0.3) 15%,
            rgba(88, 28, 135, 0.1) 30%,
            rgba(0, 0, 0, 1) 60%,
            rgb(0, 0, 0) 100%
          );
        }
      `}</style>
    </section>
  );
};

export default PricingSection;
