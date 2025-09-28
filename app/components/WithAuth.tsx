import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useTheme } from "@/contexts/ThemeContext";

interface WithAuthProps {
  children: React.ReactNode;
}

const WithAuth: React.FC<WithAuthProps> = ({ children }) => {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { isDark } = useTheme();

  useEffect(() => {
    if (!loading && !user) {
      // Redirect to auth page if not authenticated
      router.push("/auth");
    }
  }, [user, loading, router]);

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center ${
          isDark
            ? "bg-gradient-to-br from-gray-900 via-black to-purple-900"
            : "bg-gradient-to-br from-gray-50 via-white to-purple-50"
        }`}
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p
            className={`text-lg ${isDark ? "text-gray-300" : "text-gray-600"}`}
          >
            Loading...
          </p>
        </div>
      </div>
    );
  }

  // Show loading while redirecting if no user
  if (!user) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center ${
          isDark
            ? "bg-gradient-to-br from-gray-900 via-black to-purple-900"
            : "bg-gradient-to-br from-gray-50 via-white to-purple-50"
        }`}
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p
            className={`text-lg ${isDark ? "text-gray-300" : "text-gray-600"}`}
          >
            Redirecting to login...
          </p>
        </div>
      </div>
    );
  }

  // Render children if user is authenticated
  return <>{children}</>;
};

export default WithAuth;
