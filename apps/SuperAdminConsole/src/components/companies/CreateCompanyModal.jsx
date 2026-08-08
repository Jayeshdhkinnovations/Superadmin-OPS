import { useEffect, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import Modal from "../ui/Modal";
import Field from "../ui/Field";
import Input from "../ui/Input";
import Select from "../ui/Select";
import Button from "../ui/Button";
import { SEAT_TIERS } from "../../lib/seats";
import { superAdminService } from "../../services/superadmin";
import { toast } from "../../store/toastStore";

const schema = z.object({
  companyName: z.string().trim().min(1, "Company name is required"),
  adminName: z.string().trim().min(1, "Admin name is required"),
  adminEmail: z.string().trim().email("Enter a valid email"),
  maxUsers: z
    .number({ invalid_type_error: "Max users must be a number" })
    .int("Max users must be a whole number")
    .positive("Max users must be a positive integer"),
});

const PROGRESS_STEPS = [
  "Creating database",
  "Setting up structure",
  "Starting instance",
  "Registering domain",
];

const EMPTY_FORM = { companyName: "", adminName: "", adminEmail: "", maxUsers: "" };

export default function CreateCompanyModal({ open, onClose }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [progressIndex, setProgressIndex] = useState(-1);
  const [credentials, setCredentials] = useState(null);
  const [copied, setCopied] = useState(false);
  const timerRef = useRef(null);

  const mutation = useMutation({
    mutationFn: (payload) => superAdminService.createCompany(payload),
    onSuccess: (result) => {
      clearInterval(timerRef.current);
      setProgressIndex(PROGRESS_STEPS.length);
      setCredentials(result);
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
      toast.success("Company created successfully.");
      // Stays open now - the admin's one-time password is shown below and
      // only disappears once you explicitly close this dialog.
    },
    onError: (err) => {
      clearInterval(timerRef.current);
      setProgressIndex(-1);
      toast.error(err?.message || "Failed to create company.");
    },
  });

  useEffect(() => () => clearInterval(timerRef.current), []);

  function handleClose() {
    if (mutation.isPending) return;
    setForm(EMPTY_FORM);
    setErrors({});
    setProgressIndex(-1);
    setCredentials(null);
    setCopied(false);
    mutation.reset();
    onClose();
  }

  function handleCopyCredentials() {
    if (!credentials) return;
    const text = `Company: ${credentials.companyName}\nLogin URL: ${credentials.loginUrl}\nEmail: ${credentials.adminEmail}\nTemporary password: ${credentials.adminTempPassword}`;
    navigator.clipboard?.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleChange(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    const parsed = schema.safeParse({ ...form, maxUsers: Number(form.maxUsers) });
    if (!parsed.success) {
      const fieldErrors = {};
      for (const issue of parsed.error.issues) fieldErrors[issue.path[0]] = issue.message;
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    setProgressIndex(0);
    timerRef.current = setInterval(() => {
      setProgressIndex((i) => (i < PROGRESS_STEPS.length - 1 ? i + 1 : i));
    }, 650);
    mutation.mutate(parsed.data);
  }

  const showProgress = progressIndex >= 0;
  const isComplete = progressIndex >= PROGRESS_STEPS.length;

  return (
    <Modal open={open} onClose={handleClose} title="Create New Company" size="md">
      {showProgress ? (
        <div className="flex flex-col gap-3 py-2">
          {PROGRESS_STEPS.map((step, i) => {
            const done = i < progressIndex || isComplete;
            const active = i === progressIndex && !isComplete;
            return (
              <div key={step} className="flex items-center gap-3 text-sm">
                <span
                  className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs font-semibold ${
                    done
                      ? "bg-success/20 text-success"
                      : active
                        ? "animate-pulse bg-primary/20 text-primary"
                        : "bg-base-300 text-base-content/40"
                  }`}
                >
                  {done ? "✓" : i + 1}
                </span>
                <span className={done || active ? "text-base-content" : "text-base-content/40"}>
                  {step}…
                </span>
              </div>
            );
          })}
          {isComplete && credentials && (
            <div className="mt-2 flex flex-col gap-3">
              <p className="text-sm font-medium text-success">Company is live.</p>
              <div className="rounded-lg border border-base-300 bg-base-200 p-4 text-sm">
                <p className="mb-2 font-medium text-base-content">
                  Give these to {credentials.companyName}&rsquo;s admin — shown only this once:
                </p>
                <dl className="flex flex-col gap-1.5">
                  <div className="flex justify-between gap-3">
                    <dt className="text-base-content/60">Login URL</dt>
                    <dd className="font-mono text-xs">
                      <a
                        href={credentials.loginUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary underline"
                      >
                        {credentials.loginUrl}
                      </a>
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-base-content/60">Email</dt>
                    <dd className="font-mono text-xs text-base-content">{credentials.adminEmail}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-base-content/60">Temporary password</dt>
                    <dd className="font-mono text-xs font-semibold text-base-content">
                      {credentials.adminTempPassword}
                    </dd>
                  </div>
                </dl>
                <p className="mt-3 text-xs text-base-content/50">
                  They can change this themselves via "Forgot password" after logging in.
                </p>
              </div>
              <div className="flex justify-end gap-3">
                <Button type="button" variant="secondary" onClick={handleCopyCredentials}>
                  {copied ? "Copied" : "Copy credentials"}
                </Button>
                <Button type="button" onClick={handleClose}>
                  Done
                </Button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Field label="Company Name" htmlFor="companyName" error={errors.companyName}>
            <Input
              id="companyName"
              value={form.companyName}
              onChange={(e) => handleChange("companyName", e.target.value)}
              invalid={!!errors.companyName}
              placeholder="Acme Corp"
            />
          </Field>
          <Field label="Admin Name" htmlFor="adminName" error={errors.adminName}>
            <Input
              id="adminName"
              value={form.adminName}
              onChange={(e) => handleChange("adminName", e.target.value)}
              invalid={!!errors.adminName}
              placeholder="Jane Doe"
            />
          </Field>
          <Field label="Admin Email" htmlFor="adminEmail" error={errors.adminEmail}>
            <Input
              id="adminEmail"
              type="email"
              value={form.adminEmail}
              onChange={(e) => handleChange("adminEmail", e.target.value)}
              invalid={!!errors.adminEmail}
              placeholder="admin@acme.com"
            />
          </Field>
          <Field label="Max Users" htmlFor="maxUsers" error={errors.maxUsers}>
            <Select
              id="maxUsers"
              value={form.maxUsers}
              onChange={(e) => handleChange("maxUsers", e.target.value)}
              invalid={!!errors.maxUsers}
            >
              <option value="" disabled>
                Select seats…
              </option>
              {SEAT_TIERS.map((tier) => (
                <option key={tier.value} value={tier.value}>
                  {tier.label} Users
                </option>
              ))}
            </Select>
          </Field>

          <div className="mt-2 flex items-center justify-end gap-3">
            <Button type="button" variant="secondary" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit">Create</Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
