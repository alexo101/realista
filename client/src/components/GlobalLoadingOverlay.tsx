import { PropertySkeleton } from './PropertySkeleton';
import { useGlobalLoading } from '@/hooks/useGlobalLoading';
import { useLocation } from 'wouter';

export function GlobalLoadingOverlay() {
  try {
    const { isLoading } = useGlobalLoading();
    const [location] = useLocation();

    // Temporarily disable loading overlay for debugging
    if (!isLoading || true) {
      return null;
    }

    // Determine the type of skeleton to show based on the route
    const getSkeletonContent = () => {
      // Property detail page
      if (location.includes('/property/')) {
        return (
          <div className="container mx-auto px-4 py-8">
            <div className="max-w-6xl mx-auto">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                  <div className="space-y-6">
                    <div className="bg-gray-100 animate-pulse h-96 rounded-lg" />
                    <div className="space-y-4">
                      <div className="h-8 bg-gray-100 animate-pulse rounded w-3/4" />
                      <div className="h-6 bg-gray-100 animate-pulse rounded w-1/2" />
                      <div className="h-4 bg-gray-100 animate-pulse rounded w-full" />
                      <div className="h-4 bg-gray-100 animate-pulse rounded w-2/3" />
                    </div>
                  </div>
                </div>
                
                <div className="space-y-6">
                  <div className="bg-white p-6 rounded-lg shadow-md">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 bg-gray-100 animate-pulse rounded-full" />
                      <div className="space-y-2">
                        <div className="h-4 bg-gray-100 animate-pulse rounded w-24" />
                        <div className="h-3 bg-gray-100 animate-pulse rounded w-16" />
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="h-10 bg-gray-100 animate-pulse rounded" />
                      <div className="h-10 bg-gray-100 animate-pulse rounded" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      }

      // Agent or agency profile pages
      if (location.includes('/agent/') || location.includes('/agency/')) {
        return (
          <div className="container mx-auto px-4 py-8">
            <div className="max-w-6xl mx-auto">
              <div className="flex flex-col md:flex-row gap-8 mb-8">
                <div className="w-36 h-36 bg-gray-100 animate-pulse rounded-lg" />
                <div className="flex-1 space-y-4">
                  <div className="h-10 bg-gray-100 animate-pulse rounded w-64" />
                  <div className="h-6 bg-gray-100 animate-pulse rounded w-48" />
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-100 animate-pulse rounded w-full" />
                    <div className="h-4 bg-gray-100 animate-pulse rounded w-3/4" />
                  </div>
                </div>
              </div>
              
              <PropertySkeleton count={6} />
            </div>
          </div>
        );
      }

      // Search or listing pages
      if (location.includes('/search') || location.includes('/properties') || location.includes('/neighborhood')) {
        return (
          <div className="container mx-auto px-4 py-8">
            <div className="max-w-6xl mx-auto">
              <div className="mb-8 space-y-4">
                <div className="flex gap-4">
                  <div className="h-10 bg-gray-100 animate-pulse rounded flex-1" />
                  <div className="h-10 bg-gray-100 animate-pulse rounded w-32" />
                </div>
                <div className="flex gap-2 flex-wrap">
                  {Array(5).fill(0).map((_, i) => (
                    <div key={i} className="h-8 bg-gray-100 animate-pulse rounded w-20" />
                  ))}
                </div>
              </div>
              
              <PropertySkeleton count={9} />
            </div>
          </div>
        );
      }

      // Manage pages
      if (location.includes('/manage')) {
        return (
          <div className="container mx-auto px-4 py-8">
            <div className="max-w-6xl mx-auto">
              <div className="flex gap-4 mb-8">
                {Array(4).fill(0).map((_, i) => (
                  <div key={i} className="h-10 bg-gray-100 animate-pulse rounded w-32" />
                ))}
              </div>
              
              <PropertySkeleton count={6} />
            </div>
          </div>
        );
      }

      // Default skeleton for other pages
      return (
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto space-y-8">
            <div className="h-12 bg-gray-100 animate-pulse rounded w-1/2" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Array(4).fill(0).map((_, i) => (
                <div key={i} className="space-y-4">
                  <div className="h-6 bg-gray-100 animate-pulse rounded w-3/4" />
                  <div className="h-32 bg-gray-100 animate-pulse rounded" />
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-100 animate-pulse rounded w-full" />
                    <div className="h-4 bg-gray-100 animate-pulse rounded w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    };

    return (
      <div className="fixed inset-0 bg-white z-50 overflow-auto">
        {getSkeletonContent()}
      </div>
    );
  } catch (error) {
    console.warn('GlobalLoadingOverlay error:', error);
    return null;
  }
}