import { PageHeader } from "@/components/page-header";
import { Skeleton } from "@/components/ui/skeleton";

export default function TasksLoading() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Execution desk"
        title="Task Manager"
        description="Keep follow-ups, internal work, and client delivery in one clean execution queue with real task ownership and due dates."
      />

      <div className="grid gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="card rounded-[2rem] p-5">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="mt-4 h-10 w-20" />
            <Skeleton className="mt-3 h-4 w-full" />
          </div>
        ))}
      </div>

      <div className="card rounded-[2rem] p-5">
        <div className="grid gap-3 xl:grid-cols-[minmax(0,1.5fr)_220px_220px_220px_auto_auto]">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-11 w-full" />
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="card rounded-[2rem] p-5">
            <Skeleton className="h-6 w-52" />
            <Skeleton className="mt-3 h-4 w-80 max-w-full" />
            <Skeleton className="mt-2 h-4 w-64 max-w-full" />
            <Skeleton className="mt-6 h-10 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
