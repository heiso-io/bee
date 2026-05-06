import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { Skeleton } from "@heiso-io/bee/components/ui/skeleton";
import { StaffList } from "./_components/staff-list";
import { getStaff } from "./_server/staff.service";

export default async function StaffPage() {
  const staff = await getStaff();

  return (
    <div className="flex w-full h-full bg-sub-background">
      <div className="main-section-item grow w-full overflow-hidden">
        <Suspense fallback={<div className="p-6 space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>}>
          <StaffList data={staff} />
        </Suspense>
      </div>
    </div>
  );
}
