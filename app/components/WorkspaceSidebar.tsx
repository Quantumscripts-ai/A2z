"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/hooks/useSubscription";
import { APP_CONFIG, STORAGE_KEYS, ANIMATIONS } from "@/constants";
import {
  LayoutDashboard,
  Settings,
  Users,
  CreditCard,
  Link,
  ChevronLeft,
  ChevronRight,
  Crown,
  X,
} from "lucide-react";

interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  isMobileMenuOpen?: boolean;
  setIsMobileMenuOpen?: (open: boolean) => void;
}

const WorkspaceSidebar = ({
  isCollapsed,
  setIsCollapsed,
  isMobileMenuOpen = false,
  setIsMobileMenuOpen,
}: SidebarProps) => {
  const { isDark } = useTheme();
  const { user } = useAuth();
  const pathname = usePathname();
  const { subscriptionData, isLoading: subscriptionLoading } = useSubscription(
    user?.id
  );

  // Sidebar navigation items
  const sidebarItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: <LayoutDashboard className="w-5 h-5" />,
      path: "/workspace",
      active: pathname === "/workspace",
    },
    {
      id: "teams",
      label: "Teams",
      icon: <Users className="w-5 h-5" />,
      path: "/workspace/teams",
      active: pathname === "/workspace/teams",
    },
    // {
    //   id: "members",
    //   label: "Members",
    //   icon: <Users className="w-5 h-5" />,
    //   path: "/workspace/members",
    //   active: pathname === "/workspace/members",
    // },
    {
      id: "settings",
      label: "Settings",
      icon: <Settings className="w-5 h-5" />,
      path: "/workspace/settings",
      active: pathname === "/workspace/settings",
    },
    {
      id: "billing",
      label: "Billing",
      icon: <CreditCard className="w-5 h-5" />,
      path: "/workspace/billing",
      active: pathname === "/workspace/billing",
    },
    {
      id: "integrations",
      label: "Integrations",
      icon: <Link className="w-5 h-5" />,
      path: "/workspace/integrations",
      active: pathname === "/workspace/integrations",
      badge: "New",
    },
  ];

  // Handle collapse toggle
  const handleToggleCollapse = () => {
    const newCollapsed = !isCollapsed;
    setIsCollapsed(newCollapsed);
    localStorage.setItem(STORAGE_KEYS.SIDEBAR_COLLAPSED, String(newCollapsed));
  };

  // Close mobile menu when route changes
  useEffect(() => {
    if (setIsMobileMenuOpen) {
      setIsMobileMenuOpen(false);
    }
  }, [pathname, setIsMobileMenuOpen]);

  // Close mobile menu on escape key
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && setIsMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
    };

    if (isMobileMenuOpen) {
      document.addEventListener("keydown", handleEscapeKey);
      // Prevent body scroll when mobile menu is open
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.removeEventListener("keydown", handleEscapeKey);
      document.body.style.overflow = "unset";
    };
  }, [isMobileMenuOpen, setIsMobileMenuOpen]);

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 md:hidden transition-opacity duration-300"
          onClick={() => setIsMobileMenuOpen && setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed left-0 top-0 h-full z-40 transition-all duration-${
          ANIMATIONS.NORMAL
        } ease-in-out ${
          // Mobile behavior - hidden by default, show when menu open
          isMobileMenuOpen ? "w-64" : "w-0"
        } ${
          // Desktop behavior - always visible, responsive to collapse state
          isCollapsed ? "md:w-16" : "md:w-64"
        } ${
          isDark ? "bg-black/95 border-gray-800" : "bg-white/95 border-gray-200"
        } backdrop-blur-sm border-r overflow-hidden`}
      >
        {/* Header */}
        <div
          className={`p-4 border-b ${
            isDark ? "border-gray-800/50" : "border-gray-200/50"
          }`}
        >
          {/* Desktop Header Layout */}
          <div className="hidden md:block">
            {isCollapsed ? (
              /* Collapsed State - Show only toggle button */
              <div className="flex justify-center">
                <button
                  onClick={handleToggleCollapse}
                  className={`p-1.5 rounded-lg transition-all duration-${
                    ANIMATIONS.FAST
                  } ${
                    isDark
                      ? "hover:bg-gray-800 text-gray-400 hover:text-white"
                      : "hover:bg-gray-100 text-gray-600 hover:text-gray-900"
                  }`}
                  title="Expand sidebar"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            ) : (
              /* Expanded State - Show logo and toggle button */
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">S</span>
                  </div>
                  <h2
                    className={`font-bold text-lg transition-colors duration-${
                      ANIMATIONS.FAST
                    } ${isDark ? "text-white" : "text-gray-900"}`}
                  >
                    {APP_CONFIG.APP_NAME}
                  </h2>
                </div>
                <button
                  onClick={handleToggleCollapse}
                  className={`p-1.5 rounded-lg transition-all duration-${
                    ANIMATIONS.FAST
                  } ${
                    isDark
                      ? "hover:bg-gray-800 text-gray-400 hover:text-white"
                      : "hover:bg-gray-100 text-gray-600 hover:text-gray-900"
                  }`}
                  title="Collapse sidebar"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Mobile Header Layout */}
          <div className="md:hidden flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">S</span>
              </div>
              <h2
                className={`font-bold text-lg transition-colors duration-${
                  ANIMATIONS.FAST
                } ${isDark ? "text-white" : "text-gray-900"}`}
              >
                {APP_CONFIG.APP_NAME}
              </h2>
            </div>
            <button
              onClick={() => setIsMobileMenuOpen && setIsMobileMenuOpen(false)}
              className={`p-1.5 rounded-lg transition-all duration-${
                ANIMATIONS.FAST
              } ${
                isDark
                  ? "hover:bg-gray-800 text-gray-400 hover:text-white"
                  : "hover:bg-gray-100 text-gray-600 hover:text-gray-900"
              }`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {sidebarItems.map((item) => (
              <li key={item.id}>
                <a
                  href={item.path}
                  className={`group flex items-center rounded-xl transition-all duration-${
                    ANIMATIONS.FAST
                  } relative ${
                    isCollapsed && !isMobileMenuOpen
                      ? "md:justify-center md:px-3 md:py-3 px-3 py-2.5"
                      : "space-x-3 px-3 py-2.5"
                  } ${
                    item.active
                      ? isDark
                        ? "bg-purple-600/20 text-purple-300 border border-purple-600/30"
                        : "bg-purple-100 text-purple-700 border border-purple-200"
                      : isDark
                        ? "text-gray-400 hover:text-white hover:bg-gray-800/50"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                  }`}
                  title={
                    isCollapsed && !isMobileMenuOpen ? item.label : undefined
                  }
                >
                  <span className="flex-shrink-0">{item.icon}</span>

                  {/* Label and Badge Container */}
                  <div
                    className={`flex items-center justify-between flex-1 transition-all duration-${
                      ANIMATIONS.NORMAL
                    } ${
                      isCollapsed && !isMobileMenuOpen
                        ? "md:opacity-0 md:scale-0 md:w-0 md:overflow-hidden"
                        : "opacity-100 scale-100 w-auto"
                    }`}
                  >
                    <span className="font-medium">{item.label}</span>
                    {item.badge && (
                      <span className="ml-auto px-2 py-0.5 text-xs font-medium bg-purple-600 text-white rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </div>

                  {/* Tooltip for collapsed state */}
                  {isCollapsed && !isMobileMenuOpen && (
                    <div className="hidden md:block absolute left-full ml-2 top-1/2 -translate-y-1/2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                      {item.label}
                      {item.badge && (
                        <span className="ml-1 px-1 py-0.5 text-xs font-medium bg-purple-600 text-white rounded">
                          {item.badge}
                        </span>
                      )}
                    </div>
                  )}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {/* Current Plan Section */}
        <div
          className={`p-4 border-t transition-all duration-${
            ANIMATIONS.NORMAL
          } ${isDark ? "border-gray-800/50" : "border-gray-200/50"}`}
        >
          <div
            className={`rounded-xl border transition-all duration-${
              ANIMATIONS.FAST
            } ${isCollapsed && !isMobileMenuOpen ? "md:p-2 p-3" : "p-3"} ${
              isDark
                ? "bg-gradient-to-r from-purple-900/30 to-blue-900/30 border-purple-700/30"
                : "bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200/50"
            }`}
            title={
              isCollapsed && !isMobileMenuOpen
                ? "Pro Plan - Current Plan"
                : undefined
            }
          >
            <div
              className={`flex items-center ${
                isCollapsed && !isMobileMenuOpen
                  ? "md:justify-center space-x-0"
                  : "space-x-3"
              }`}
            >
              <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
                <Crown className="w-4 h-4 text-white" />
              </div>
              <div
                className={`transition-all duration-${ANIMATIONS.NORMAL} ${
                  isCollapsed && !isMobileMenuOpen
                    ? "md:opacity-0 md:scale-0 md:w-0 md:overflow-hidden"
                    : "opacity-100 scale-100 w-auto"
                }`}
              >
                <p
                  className={`font-medium text-sm ${
                    isDark ? "text-white" : "text-gray-900"
                  }`}
                >
                  {subscriptionLoading
                    ? "..."
                    : subscriptionData?.subscriptionStatus || "NA"}
                </p>
                <p
                  className={`text-xs ${
                    isDark ? "text-gray-400" : "text-gray-600"
                  }`}
                >
                  Current Plan
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default WorkspaceSidebar;
