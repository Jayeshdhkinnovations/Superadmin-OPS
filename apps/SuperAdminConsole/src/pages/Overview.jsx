import { useQuery } from "@tanstack/react-query";
import { superAdminService } from "../services/superadmin";
import StatBar from "../components/overview/StatBar";
import RecentSignupsList from "../components/overview/RecentSignupsList";
import ErrorCard from "../components/overview/ErrorCard";
import PendingApprovalsCard from "../components/overview/PendingApprovalsCard";
import { SkeletonCard, SkeletonLine } from "../components/ui/Skeleton";
import ErrorState from "../components/ui/ErrorState";
import { formatBytes, formatNumber } from "../lib/format";

export default function Overview() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["stats"],
    queryFn: superAdminService.getStats,
    staleTime: 60_000,
  });

  // Same query key the Approval page uses, so approving there refreshes
  // this card too rather than leaving a stale count on the dashboard.
  const { data: approvals, isLoading: approvalsLoading } = useQuery({
    queryKey: ["approvalRequests"],
    queryFn: () => superAdminService.getApprovalRequests({ status: "pending" }),
    staleTime: 15_000,
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-semibold text-base-content">Overview</h2>
        <p className="mt-1 text-sm text-base-content/60">Platform-wide health at a glance.</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : isError ? (
        <div className="rounded-3xl border border-base-300 bg-base-100 shadow-sm">
          <ErrorState message="Couldn't load platform stats." onRetry={refetch} />
        </div>
      ) : (
        <StatBar
          items={[
            {
              label: "Total Companies",
              value: formatNumber(data.totalCompanies),
              sublabel: `${data.suspendedCompanies} suspended`,
            },
            { label: "Total Users", value: formatNumber(data.totalUsers) },
            { label: "Documents Signed", value: formatNumber(data.totalDocumentsSigned) },
            { label: "Templates Count", value: formatNumber(data.totalTemplates) },
            { label: "Storage Used", value: formatBytes(data.totalStorageBytes) },
          ]}
        />
      )}

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
        <div className="rounded-3xl border border-base-300 bg-base-100 p-5 shadow-sm lg:col-span-2">
          <h3 className="mb-1 text-base font-semibold text-base-content">Recent Signups</h3>
          {isLoading ? (
            <div className="flex flex-col gap-3 py-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <SkeletonLine key={i} className="h-10" />
              ))}
            </div>
          ) : isError ? (
            <ErrorState message="Couldn't load recent signups." onRetry={refetch} />
          ) : (
            <RecentSignupsList signups={data.recentSignups} />
          )}
        </div>

        <div className="flex flex-col gap-6">
          <PendingApprovalsCard
            requests={approvals?.requests ?? []}
            isLoading={approvalsLoading}
          />
          {isLoading ? (
            <SkeletonCard />
          ) : isError ? (
            <div className="rounded-3xl border border-base-300 bg-base-100 shadow-sm">
              <ErrorState message="Couldn't load error count." onRetry={refetch} />
            </div>
          ) : (
            <ErrorCard count={data.errorCountLast24h} />
          )}
        </div>
      </div>
    </div>
  );
}
