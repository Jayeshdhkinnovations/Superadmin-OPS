import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { superAdminService } from "../services/superadmin";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
import EmptyState from "../components/ui/EmptyState";
import ErrorState from "../components/ui/ErrorState";
import { SkeletonRow } from "../components/ui/Skeleton";
import { formatDate } from "../lib/format";
import { toast } from "../store/toastStore";

const STATUS_LABEL = { pending: "Pending", approved: "Approved", rejected: "Rejected" };

export default function Approval() {
  const queryClient = useQueryClient();
  const [maxUsersByRow, setMaxUsersByRow] = useState({});
  const [busyId, setBusyId] = useState(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["approvalRequests"],
    queryFn: () => superAdminService.getApprovalRequests({ status: "pending" }),
    staleTime: 15_000,
  });

  const requests = data?.requests ?? [];

  async function handleApprove(req) {
    const maxUsers = Number(maxUsersByRow[req.objectId] || 5);
    if (!maxUsers || maxUsers < 1) {
      toast.error("Enter a valid Max Users value first.");
      return;
    }
    setBusyId(req.objectId);
    try {
      await superAdminService.approveRequest(req.objectId, maxUsers);
      toast.success(`${req.companyName} approved and created.`);
      queryClient.invalidateQueries({ queryKey: ["approvalRequests"] });
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
    } catch (err) {
      toast.error(err?.message || "Failed to approve.");
    } finally {
      setBusyId(null);
    }
  }

  async function handleReject(req) {
    setBusyId(req.objectId);
    try {
      await superAdminService.rejectRequest(req.objectId);
      toast.success(`${req.companyName} rejected.`);
      queryClient.invalidateQueries({ queryKey: ["approvalRequests"] });
    } catch (err) {
      toast.error(err?.message || "Failed to reject.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-xl font-semibold text-base-content">Approval Requests</h2>
        <p className="mt-1 text-sm text-base-content/60">
          People who registered themselves via OpenSign - approve to create their company, or reject.
        </p>
      </div>

      {isError ? (
        <div className="rounded-3xl border border-base-300 bg-base-100 shadow-sm">
          <ErrorState message="Couldn't load approval requests." onRetry={refetch} />
        </div>
      ) : !isLoading && requests.length === 0 ? (
        <div className="rounded-3xl border border-base-300 bg-base-100 shadow-sm">
          <EmptyState title="No pending approval requests" />
        </div>
      ) : (
        <div className="overflow-x-auto rounded-3xl border border-base-300 bg-base-100 shadow-sm">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-base-300 bg-base-200/60">
                {["Name", "Email", "Company", "Job Title", "Submitted", "Status", "Max Users", ""].map((h) => (
                  <th key={h} className="px-4 py-3 text-xs font-semibold tracking-wide text-base-content/60 uppercase">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-base-300">
              {isLoading
                ? Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} columns={8} />)
                : requests.map((req) => (
                    <tr key={req.objectId} className="hover:bg-base-200">
                      <td className="px-4 py-3 font-medium text-base-content">{req.name}</td>
                      <td className="px-4 py-3 text-base-content/70">{req.email}</td>
                      <td className="px-4 py-3 text-base-content/70">{req.companyName}</td>
                      <td className="px-4 py-3 text-base-content/70">{req.jobTitle || "—"}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-base-content/70">
                        {formatDate(req.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={req.status}>{STATUS_LABEL[req.status] ?? req.status}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          min="1"
                          placeholder="5"
                          value={maxUsersByRow[req.objectId] ?? ""}
                          onChange={(e) =>
                            setMaxUsersByRow((m) => ({ ...m, [req.objectId]: e.target.value }))
                          }
                          className="h-9 w-20 rounded-lg border border-base-300 bg-base-100 px-2 text-sm"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            disabled={busyId === req.objectId}
                            onClick={() => handleApprove(req)}
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            disabled={busyId === req.objectId}
                            onClick={() => handleReject(req)}
                          >
                            Reject
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
