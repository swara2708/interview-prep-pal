import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { getProfile, updateProfile } from "@/lib/interview.functions";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "Your profile — InterviewAI" },
      { name: "description", content: "Update your name and the role you are targeting." },
      { property: "og:title", content: "Your profile — InterviewAI" },
      { property: "og:description", content: "Update your name and the role you are targeting." },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const fetchProfile = useServerFn(getProfile);
  const save = useServerFn(updateProfile);
  const { data, isPending } = useQuery({ queryKey: ["profile"], queryFn: () => fetchProfile() });

  const [fullName, setFullName] = useState("");
  const [targetRole, setTargetRole] = useState("");

  useEffect(() => {
    if (!data) return;
    setFullName(data.full_name ?? "");
    setTargetRole(data.target_role ?? "");
  }, [data]);

  const mutation = useMutation({
    mutationFn: () => save({ data: { fullName, targetRole } }),
    onSuccess: () => toast.success("Profile saved."),
    onError: (error: Error) => toast.error(error.message),
  });

  if (isPending) {
    return (
      <div className="flex h-64 items-center justify-center text-muted-foreground">
        <Loader2 strokeWidth={1.5} className="size-5 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="font-display text-4xl tracking-tight">Profile</h1>
      <section className="max-w-lg space-y-4 rounded-[24px] bg-card p-8 shadow-card">
        <label className="block text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Full name
          <input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            maxLength={80}
            className="mt-2 w-full rounded-2xl border border-border bg-surface-2 px-4 py-3 text-sm font-normal normal-case tracking-normal text-foreground outline-none focus:border-primary"
          />
        </label>
        <label className="block text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Target role
          <input
            value={targetRole}
            onChange={(e) => setTargetRole(e.target.value)}
            maxLength={80}
            placeholder="e.g. Frontend Developer"
            className="mt-2 w-full rounded-2xl border border-border bg-surface-2 px-4 py-3 text-sm font-normal normal-case tracking-normal text-foreground outline-none placeholder:text-muted-foreground focus:border-primary"
          />
        </label>
        <button
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending}
          className="rounded-full bg-hero-gradient px-6 py-3.5 text-sm font-semibold text-primary-foreground disabled:opacity-60"
        >
          {mutation.isPending ? "Saving…" : "Save profile"}
        </button>
      </section>
    </div>
  );
}