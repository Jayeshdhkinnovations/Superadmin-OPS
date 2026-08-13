import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { superAdminService } from "../services/superadmin";
import Button from "../components/ui/Button";
import EmptyState from "../components/ui/EmptyState";
import ErrorState from "../components/ui/ErrorState";
import { SkeletonRow } from "../components/ui/Skeleton";
import { formatDate } from "../lib/format";
import { toast } from "../store/toastStore";

export default function SubAdmins() {
  const queryClient = useQueryClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [creating, setCreating] = useState(false);
  const [busyId, setBusyId] = useState(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["subAdmins"],
    queryFn: () => superAdminService.getSubAdmins(),
    staleTime: 15_000,
  });

  const subAdmins = data ?? [];

  async function handleCreate(e) {
    e.preventDefault();
    if (!email || !password) return;
    setCreating(true);
    try {
      await superAdminService.createSubAdmin(email, password);
      toast.success(`${email} can now sign in to the console.`);
      setEmail("");
      setPassword("");
      queryClient.invalidateQueries({ queryKey: ["subAdmins"] });
    } catch (err) {
      toast.error(err?.message || "Failed to create sub-admin.");
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(sub) {
    setBusyId(sub.id);
    try {
      await superAdminService.deleteSubAdmin(sub.id);
      toast.success(`${sub.email} removed.`);
      queryClient.invalidateQueries({ queryKey: ["subAdmins"] });
    } catch (err) {
      toast.error(err?.message || "Failed to remove sub-admin.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-xl font-semibold text-base-content">Sub-Admins</h2>
        <p className="mt-1 text-sm text-base-content/60">
          Give someone else full console access under their own login. Set their email and password here, then share the password with them directly.
        </p>
      </div>

      <form
        onSubmit={handleCreate}
        className="flex flex-col gap-3 rounded-3xl border border-base-300 bg-base-100 p-5 shadow-sm sm:flex-row sm:items-end"
      >
        <div className="flex-1">
          <label className="mb-1 block text-xs font-semibold text-base-content/60" htmlFor="sub-email">
            Email
          </label>
          <input
            id="sub-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="teammate@toowix.com"
            className="w-full rounded-full border border-base-300 bg-base-100 px-4 py-2.5 text-sm text-base-content focus:border-[#0B3D73] focus:outline-none focus:ring-2 focus:ring-[#0B3D73]/15"
          />
        </div>
        <div className="flex-1">
          <label className="mb-1 block text-xs font-semibold text-base-content/60" htmlFor="sub-password">
            Password
          </label>
          <input
            id="sub-password"
            type="text"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 8 characters"
            className="w-full rounded-full border border-base-300 bg-base-100 px-4 py-2.5 text-sm text-base-content focus:border-[#0B3D73] focus:outline-none focus:ring-2 focus:ring-[#0B3D73]/15"
          />
        </div>
        <Button type="submit" disabled={creating}>
          {creating ? "Creating..." : "Create sub-admin"}
        </Button>
      </form>

      {isError ? (
        <div className="rounded-3xl border border-base-300 bg-base-100 shadow-sm">
          <ErrorState message="Couldn't load sub-admins." onRetry={refetch} />
        </div>
      ) : !isLoading && subAdmins.length === 0 ? (
        <div className="rounded-3xl border border-base-300 bg-base-100 shadow-sm">
          <EmptyState title="No sub-admins yet" />
        </div>
      ) : (
        <div className="overflow-x-auto rounded-3xl border border-base-300 bg-base-100 shadow-sm">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-base-300 bg-base-200/60">
                {["Email", "Added", ""].map((h) => (
                  <th key={h} className="px-4 py-3 text-xs font-semibold tracking-wide text-base-content/60 uppercase">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-base-300">
              {isLoading
                ? Array.from({ length: 3 }).map((_, i) => <SkeletonRow key={i} columns={3} />)
                : subAdmins.map((sub) => (
                    <tr key={sub.id} className="hover:bg-base-200">
                      <td className="px-4 py-3 font-medium text-base-content">{sub.email}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-base-content/70">
                        {formatDate(sub.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <Button
                          size="sm"
                          variant="destructive"
                          disabled={busyId === sub.id}
                          onClick={() => handleDelete(sub)}
                        >
                          Remove
                        </Button>
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
