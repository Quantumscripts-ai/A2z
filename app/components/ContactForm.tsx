"use client";

import { useState } from "react";
import { useTheme } from "@/contexts/ThemeContext";

interface ContactFormProps {
  onSubmit?: (payload: {
    name: string;
    email: string;
    subject: string;
    message: string;
  }) => Promise<void> | void;
  className?: string;
}

// Initial form state

const initialState = { name: "", email: "", subject: "", message: "" };

const ContactForm = ({ onSubmit, className = "" }: ContactFormProps) => {
  const { isDark } = useTheme();
  const [formData, setFormData] = useState(initialState);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const validate = (): boolean => {
    const nextErrors: Record<string, string> = {};
    if (!formData.name.trim()) nextErrors.name = "Please enter your name";
    if (!formData.email.trim()) nextErrors.email = "Please enter your email";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
      nextErrors.email = "Enter a valid email";
    if (!formData.subject.trim()) nextErrors.subject = "Please enter a subject";
    if (!formData.message.trim() || formData.message.trim().length < 10)
      nextErrors.message = "Message should be at least 10 characters";

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await onSubmit?.(formData);
      setSubmitted(true);
      setFormData(initialState);
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputBase = `w-full px-4 py-3 rounded-xl border transition-all duration-300 focus:outline-none ${
    isDark
      ? "bg-gray-900/50 border-gray-700 text-white placeholder-gray-500 focus:border-purple-500"
      : "bg-white/70 border-gray-300 text-gray-900 placeholder-gray-500 focus:border-purple-500"
  }`;

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
        Get in touch
      </h3>
      <p className={`${isDark ? "text-gray-400" : "text-gray-600"} mb-6`}>
        Have questions or need help? Send us a message and we’ll respond
        shortly.
      </p>

      {submitted && (
        <div
          className={`mb-6 rounded-xl border px-4 py-3 ${
            isDark
              ? "bg-green-900/20 border-green-700 text-green-300"
              : "bg-green-50 border-green-200 text-green-700"
          }`}
        >
          Thank you! Your message has been sent.
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              className={`block text-sm font-medium mb-2 ${
                isDark ? "text-gray-300" : "text-gray-700"
              }`}
            >
              Name
            </label>
            <input
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Your full name"
              className={`${inputBase} ${errors.name ? "border-red-500" : ""}`}
            />
            {errors.name && (
              <p className="text-xs text-red-500 mt-1">{errors.name}</p>
            )}
          </div>
          <div>
            <label
              className={`block text-sm font-medium mb-2 ${
                isDark ? "text-gray-300" : "text-gray-700"
              }`}
            >
              Email
            </label>
            <input
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="you@example.com"
              className={`${inputBase} ${errors.email ? "border-red-500" : ""}`}
            />
            {errors.email && (
              <p className="text-xs text-red-500 mt-1">{errors.email}</p>
            )}
          </div>
        </div>

        <div>
          <label
            className={`block text-sm font-medium mb-2 ${
              isDark ? "text-gray-300" : "text-gray-700"
            }`}
          >
            Subject
          </label>
          <input
            name="subject"
            value={formData.subject}
            onChange={handleChange}
            placeholder="How can we help?"
            className={`${inputBase} ${errors.subject ? "border-red-500" : ""}`}
          />
          {errors.subject && (
            <p className="text-xs text-red-500 mt-1">{errors.subject}</p>
          )}
        </div>

        <div>
          <label
            className={`block text-sm font-medium mb-2 ${
              isDark ? "text-gray-300" : "text-gray-700"
            }`}
          >
            Message
          </label>
          <textarea
            name="message"
            value={formData.message}
            onChange={handleChange}
            placeholder="Tell us a bit more about your request..."
            rows={6}
            className={`${inputBase} ${errors.message ? "border-red-500" : ""}`}
          />
          {errors.message && (
            <p className="text-xs text-red-500 mt-1">{errors.message}</p>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <p
            className={`text-xs ${isDark ? "text-gray-500" : "text-gray-500"}`}
          >
            We’ll get back within 24–48 hours.
          </p>
          <button
            type="submit"
            disabled={isSubmitting}
            className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 hover:scale-[1.02] disabled:opacity-60 disabled:cursor-not-allowed text-white bg-purple-600 hover:bg-purple-700`}
          >
            {isSubmitting ? "Sending..." : "Send Message"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ContactForm;
