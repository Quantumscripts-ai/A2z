"use client";

import { Mail, Clock, MapPin } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { APP_CONFIG } from "@/constants";

interface ContactInfoCardProps {
  className?: string;
}

const ContactInfoCard = ({ className = "" }: ContactInfoCardProps) => {
  const { isDark } = useTheme();

  const infoItems = [
    {
      icon: <Mail className="w-5 h-5" />,
      label: "Email",
      value: APP_CONFIG.SUPPORT_EMAIL,
    },
    {
      icon: <Clock className="w-5 h-5" />,
      label: "Hours",
      value: "Mon–Fri, 9:00–18:00 (UTC)",
    },
    {
      icon: <MapPin className="w-5 h-5" />,
      label: "Office",
      value: "Remote-first, Global",
    },
  ];

  return (
    <div
      className={`rounded-3xl border backdrop-blur-sm p-6 md:p-8 transition-all duration-300 ${
        isDark
          ? "bg-black/50 border-gray-800 hover:border-purple-500/30"
          : "bg-white/50 border-gray-200 hover:border-purple-300/50"
      } ${className}`}
    >
      <h3
        className={`text-2xl font-bold mb-2 ${
          isDark ? "text-white" : "text-gray-900"
        }`}
      >
        Contact Information
      </h3>
      <p className={`${isDark ? "text-gray-400" : "text-gray-600"} mb-6`}>
        We’d love to hear from you. Reach out through any of the channels below.
      </p>

      <div className="space-y-4">
        {infoItems.map((item) => (
          <div
            key={item.label}
            className={`flex items-start gap-4 p-4 rounded-2xl border transition-all duration-300 ${
              isDark
                ? "bg-gray-900/30 border-gray-700/50"
                : "bg-gray-50/50 border-gray-200/50"
            }`}
          >
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                isDark
                  ? "bg-purple-600/20 text-purple-300"
                  : "bg-purple-100 text-purple-700"
              }`}
            >
              {item.icon}
            </div>
            <div>
              <p
                className={`text-sm font-medium ${
                  isDark ? "text-white" : "text-gray-900"
                }`}
              >
                {item.label}
              </p>
              <p
                className={`text-sm ${
                  isDark ? "text-gray-400" : "text-gray-600"
                }`}
              >
                {item.value}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ContactInfoCard;
