import { Skeleton } from '@/components/ui/skeleton';

interface PropertySkeletonProps {
  count?: number;
}

export function PropertySkeleton({ count = 6 }: PropertySkeletonProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array(count)
        .fill(0)
        .map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow-md overflow-hidden">
            {/* Property Image Skeleton */}
            <Skeleton className="h-48 w-full" />
            
            {/* Property Content */}
            <div className="p-4 space-y-3">
              {/* Price */}
              <Skeleton className="h-6 w-32" />
              
              {/* Title */}
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-3/4" />
              
              {/* Location */}
              <Skeleton className="h-4 w-48" />
              
              {/* Features */}
              <div className="flex gap-4">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-16" />
              </div>
              
              {/* Agent Info */}
              <div className="flex items-center gap-3 mt-4">
                <Skeleton className="h-8 w-8 rounded-full" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
          </div>
        ))}
    </div>
  );
}

export function PropertyListSkeleton({ count = 3 }: PropertySkeletonProps) {
  return (
    <div className="space-y-4">
      {Array(count)
        .fill(0)
        .map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="flex">
              {/* Property Image Skeleton */}
              <Skeleton className="h-32 w-48 flex-shrink-0" />
              
              {/* Property Content */}
              <div className="p-4 flex-1 space-y-2">
                {/* Price and Title */}
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
                
                {/* Location and Features */}
                <div className="flex gap-4 mt-3">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            </div>
          </div>
        ))}
    </div>
  );
}