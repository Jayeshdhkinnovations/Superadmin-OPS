import { useMutation, useQueryClient } from "@tanstack/react-query";
import { PauseCircle, PlayCircle } from "lucide-react";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import { superAdminService } from "../../services/superadmin";
import { toast } from "../../store/toastStore";

export default function SuspendDialog({ open, onClose, company }) {
  const queryClient = useQueryClient();

  const isSuspending = company?.status === "active";

  const mutation = useMutation({
    mutationFn: () =>
      isSuspending
        ? superAdminService.suspendCompany(company.objectId)
        : superAdminService.reactivateCompany(company.objectId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
      toast.success(isSuspending ? "Company suspended." : "Company reactivated.");
      onClose();
    },
    onError: (err) =>
      toast.error(err?.message || `Failed to ${isSuspending ? "suspend" : "reactivate"} company.`),
  });

  if (!company) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isSuspending ? "Suspend company?" : "Reactivate company?"}
      size="sm"
    >
      <div className="flex flex-col gap-4">
        <div className="flex items-start gap-3">
          <div
            className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${
              isSuspending ? "bg-warning/20 text-warning" : "bg-success/20 text-success"
            }`}
          >
            {isSuspending ? <PauseCircle size={20} /> : <PlayCircle size={20} />}
          </div>
          <p className="text-sm text-base-content/70">
            {isSuspending ? (
              <>
                <strong className="text-base-content">{company.companyName}</strong>'s running instance
                will be stopped and its subdomain will show a "this account is suspended" page. Its
                database is left fully intact.
              </>
            ) : (
              <>
                <strong className="text-base-content">{company.companyName}</strong>'s instance will be
                restarted and its subdomain route restored.
              </>
            )}
          </p>
        </div>
        <div className="flex items-center justify-end gap-3">
          <Button variant="secondary" onClick={onClose} disabled={mutation.isPending}>
            Cancel
          </Button>
          <Button
            variant={isSuspending ? "destructive" : "primary"}
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? "Working…" : isSuspending ? "Suspend" : "Reactivate"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
