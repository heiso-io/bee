"use client";
import { Skeleton } from "@heiso-io/bee/components/ui/skeleton";
import { useSite } from "@heiso-io/bee/providers/site";

export function LayoutSkeleton() {
  const { site } = useSite();
  return (
    <div className="h-screen flex items-center justify-center">
      {site?.assets?.logo?.length ? (
        <img
          className="w-48 animate-pulse"
          src={site.assets.logo}
          alt="Loading"
        />
      ) : (
        <Skeleton className="h-12 w-48 rounded-lg" />
      )}
    </div>
  );
}
