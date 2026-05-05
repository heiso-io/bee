import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { Skeleton } from "@heiso-io/bee/components/ui/skeleton";
import { DevList } from "./_components/dev-list";
import { getDevs } from "./_server/dev.service";

export default async function DevsPage() {
  const dev = await getDevs();

  return (
    <div className="flex w-full h-full bg-sub-background">
      <div className="main-section-item grow w-full overflow-hidden">
        <Suspense fallback={<div className="p-6 space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>}>
          <DevList data={dev} />
        </Suspense>
      </div>
    </div>
  );
}
