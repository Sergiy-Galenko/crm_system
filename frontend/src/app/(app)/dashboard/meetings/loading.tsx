import { PageHeader } from "@/components/page-header";
import { Skeleton } from "@/components/ui/skeleton";

export default function MeetingsLoading() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Calendar"
        title="Meetings"
        description="Keep live calls, demos, and follow-ups in one cleaner schedule view with faster actions and less clutter."
      />

      <div className="grid gap-4 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="card rounded-[2rem] p-5">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="mt-4 h-10 w-28" />
            <Skeleton className="mt-3 h-4 w-full" />
          </div>
        ))}
      </div>

      <div className="card rounded-[2rem] p-5">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="mt-3 h-4 w-72 max-w-full" />
        <div className="mt-5 flex flex-wrap gap-2">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-11 w-32" />
          ))}
        </div>
      </div>

      <div className="grid gap-6 2xl:grid-cols-[minmax(0,1fr)_22.5rem]">
        <div className="space-y-6">
          {Array.from({ length: 2 }).map((_, sectionIndex) => (
            <div key={sectionIndex} className="card rounded-[2rem] p-5">
              <Skeleton className="h-6 w-44" />
              <Skeleton className="mt-2 h-4 w-80 max-w-full" />
              <div className="mt-5 space-y-4">
                {Array.from({ length: 2 }).map((__, cardIndex) => (
                  <div key={cardIndex} className="rounded-[1.75rem] border border-slate-200 p-4">
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="mt-3 h-6 w-56 max-w-full" />
                    <Skeleton className="mt-2 h-4 w-full" />
                    <Skeleton className="mt-4 h-24 w-full" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-6">
          <div className="card rounded-[2rem] p-5">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="mt-4 h-8 w-44" />
            <Skeleton className="mt-3 h-4 w-full" />
            <Skeleton className="mt-5 h-32 w-full" />
          </div>
          <div className="card rounded-[2rem] p-5">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="mt-2 h-4 w-60 max-w-full" />
            <Skeleton className="mt-5 h-[22rem] w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
