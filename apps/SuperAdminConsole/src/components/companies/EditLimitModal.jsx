import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Modal from "../ui/Modal";
import Field from "../ui/Field";
import Select from "../ui/Select";
import Button from "../ui/Button";
import { seatOptionsIncluding, seatLabel } from "../../lib/seats";
import { superAdminService } from "../../services/superadmin";
import { toast } from "../../store/toastStore";

export default function EditLimitModal({ open, onClose, company }) {
  if (!company) return null;

  return (
    <Modal open={open} onClose={onClose} title={`Edit User Limit — ${company.companyName}`} size="sm">
      <EditLimitForm key={company.objectId} company={company} onClose={onClose} />
    </Modal>
  );
}

function EditLimitForm({ company, onClose }) {
  const queryClient = useQueryClient();
  const [maxUsers, setMaxUsers] = useState(String(company.maxUsers));
  const [error, setError] = useState("");

  const mutation = useMutation({
    mutationFn: () => superAdminService.updateCompanyLimit(company.objectId, Number(maxUsers)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      toast.success("User limit updated.");
      onClose();
    },
    onError: (err) => toast.error(err?.message || "Failed to update limit."),
  });

  function handleSubmit(e) {
    e.preventDefault();
    const value = Number(maxUsers);
    if (!Number.isInteger(value) || value <= 0) {
      setError("Max users must be a positive integer");
      return;
    }
    if (value < company.currentUserCount) {
      setError(`Can't be lower than the current user count (${company.currentUserCount})`);
      return;
    }
    setError("");
    mutation.mutate();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <p className="text-sm text-base-content/60">
        Current usage: {company.currentUserCount} / {company.maxUsers}
      </p>
      <Field label="Max Users" htmlFor="editMaxUsers" error={error}>
        <Select
          id="editMaxUsers"
          value={maxUsers}
          invalid={!!error}
          onChange={(e) => setMaxUsers(e.target.value)}
        >
          {seatOptionsIncluding(company.maxUsers).map((n) => (
            <option key={n} value={n}>
              {seatLabel(n)}
            </option>
          ))}
        </Select>
      </Field>
      <div className="mt-1 flex items-center justify-end gap-3">
        <Button type="button" variant="secondary" onClick={onClose} disabled={mutation.isPending}>
          Cancel
        </Button>
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? "Saving…" : "Save"}
        </Button>
      </div>
    </form>
  );
}
