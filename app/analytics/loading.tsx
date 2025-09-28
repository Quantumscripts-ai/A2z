export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header Skeleton */}
        <div className="animate-pulse mb-8">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>

        {/* Time Range Selector Skeleton */}
        <div className="animate-pulse mb-6">
          <div className="flex space-x-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-10 w-20 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>

        {/* Stats Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-24"></div>
                  <div className="h-8 bg-gray-200 rounded w-16"></div>
                </div>
                <div className="p-3 bg-gray-200 rounded-lg w-12 h-12"></div>
              </div>
            </div>
          ))}
        </div>

        {/* Charts Grid Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="h-6 bg-gray-200 rounded w-48 mb-4"></div>
              <div className="h-80 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>

        {/* Hours Translated Chart Skeleton */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-8">
          <div className="h-6 bg-gray-200 rounded w-48 mb-4"></div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>

        {/* Summary Stats Skeleton */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="h-6 bg-gray-200 rounded w-24 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="text-center space-y-2">
                <div className="h-8 bg-gray-200 rounded w-16 mx-auto"></div>
                <div className="h-4 bg-gray-200 rounded w-32 mx-auto"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
