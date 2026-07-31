import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle } from "lucide-react";
import Modal from "../ui/Modal";
import Input from "../ui/Input";
import Button from "../ui/Button";
import { superAdminService } from "../../services/superadmin";
import { toast } from "../../store/toastStore";

export default function DeleteDialog({ open, onClose, company }) {
  const queryClient = useQueryClient();
  const [confirmText, setConfirmText] = useState("");

  const mutation = useMutation({
    mutationFn: () => superAdminService.deleteCompany(company.objectId, confirmText),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
      toast.success("Company permanently deleted.");
      handleClose();
    },
    onError: (err) => toast.error(err?.message || "Company name confirmation did not match."),
  });

  function handleClose() {
    if (mutation.isPending) return;
    setConfirmText("");
    mutation.reset();
    onClose();
  }

  if (!company) return null;

  const isMatch = confirmText === company.companyName;

  return (
    <Modal open={open} onClose={handleClose} title="Permanently delete this company?" size="md">
      <div className="flex flex-col gap-4">
        <div className="flex items-start gap-3 rounded-xl bg-error/5 p-4">
          <AlertTriangle size={20} className="mt-0.5 shrink-0 text-error" />
          <div className="text-sm text-base-content/80">
            <p className="font-medium text-base-content">This will permanently:</p>
            <ul className="mt-2 list-disc space-y-1 pl-4">
              <li>Stop and remove their running instance</li>
              <li>Delete their entire database</li>
              <li>Delete all {company.documentCount} documents and files</li>
              <li>Remove their subdomain ({company.subdomain})</li>
            </ul>
            <p className="mt-2 font-medium text-error">This action cannot be undone.</p>
          </div>
        </div>

        <div>
          <label htmlFor="confirmName" className="text-sm font-medium text-base-content">
            Type "{company.companyName}" to confirm:
          </label>
          <Input
            id="confirmName"
            className="mt-2"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder={company.companyName}
            autoComplete="off"
          />
        </div>

        <div className="flex items-center justify-end gap-3">
          <Button variant="secondary" onClick={handleClose} disabled={mutation.isPending}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            disabled={!isMatch || mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending ? "Deleting…" : "Delete permanently"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
