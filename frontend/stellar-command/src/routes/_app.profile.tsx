import { createFileRoute } from "@tanstack/react-router";
import { motion } from "motion/react";
import { Settings, Bell, Shield, Key, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { FadeIn } from "@/components/ui-bits";
import { useAuth } from "@/contexts/auth-context";
import { useFavorites } from "@/hooks/use-favorites";

export const Route = createFileRoute("/_app/profile")({
  head: () => ({ meta: [{ title: "Profile — Space Today" }] }),
  component: ProfilePage,
});

function getInitials(name: string): string {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

function ProfilePage() {
  const { user } = useAuth();
  const { data: favorites } = useFavorites();

  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : "—";

  const stats = [
    { label: "Favorites", value: favorites?.total ?? "—" },
    { label: "Member since", value: memberSince },
    { label: "Status", value: "Active" },
  ];

  return (
    <div className="space-y-8 p-4 md:p-8">
      <FadeIn>
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">Commander profile</p>
          <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight md:text-4xl">Your account</h1>
        </div>
      </FadeIn>

      <div className="grid gap-6 md:grid-cols-3">
        <FadeIn delay={0.04}>
          <div className="flex flex-col items-center rounded-3xl border border-border bg-card p-8 text-center">
            <motion.div whileHover={{ scale: 1.05 }} className="relative">
              <Avatar className="h-24 w-24 ring-4 ring-primary/20">
                <AvatarFallback className="bg-primary/10 text-primary text-2xl font-display">
                  {user ? getInitials(user.name) : "??"}
                </AvatarFallback>
              </Avatar>
              <span className="absolute bottom-1 right-1 h-4 w-4 rounded-full border-2 border-card bg-success" />
            </motion.div>
            <p className="mt-4 font-display text-xl font-semibold">{user?.name ?? "Loading…"}</p>
            <p className="mt-1 text-sm text-muted-foreground">{user?.email ?? ""}</p>
            <div className="mt-6 grid w-full divide-x divide-border grid-cols-3 rounded-xl border border-border bg-surface px-2 py-3">
              {stats.map((s) => (
                <div key={s.label} className="flex flex-col items-center px-2">
                  <p className="font-display text-lg font-semibold">{s.value}</p>
                  <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{s.label}</p>
                </div>
              ))}
            </div>
            <Button variant="outline" className="mt-4 w-full">Edit avatar</Button>
          </div>
        </FadeIn>

        <FadeIn delay={0.06}>
          <div className="md:col-span-2 space-y-4">
            <div className="rounded-3xl border border-border bg-card p-6">
              <div className="flex items-center gap-2 mb-4">
                <Settings className="h-4 w-4 text-muted-foreground" />
                <span className="font-semibold text-sm">Account information</span>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="profile-name">Full name</Label>
                  <Input id="profile-name" defaultValue={user?.name ?? ""} placeholder="Your full name" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="profile-email">Email address</Label>
                  <Input id="profile-email" type="email" defaultValue={user?.email ?? ""} disabled className="opacity-70" />
                  <p className="text-xs text-muted-foreground">Email cannot be changed at this time.</p>
                </div>
              </div>
              <Button className="mt-4">Save changes</Button>
            </div>

            <div className="rounded-3xl border border-border bg-card p-6">
              <div className="flex items-center gap-2 mb-4">
                <Key className="h-4 w-4 text-muted-foreground" />
                <span className="font-semibold text-sm">Security</span>
              </div>
              <div className="space-y-3">
                {[
                  { label: "Change password", icon: Key, desc: "Update your login credentials" },
                  { label: "Two-factor authentication", icon: Shield, desc: "Add an extra layer of security" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between rounded-xl border border-border px-4 py-3">
                    <div className="flex items-center gap-3">
                      <item.icon className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">{item.label}</p>
                        <p className="text-xs text-muted-foreground">{item.desc}</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">Configure <ExternalLink className="ml-1.5 h-3.5 w-3.5" /></Button>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-border bg-card p-6">
              <div className="flex items-center gap-2 mb-4">
                <Bell className="h-4 w-4 text-muted-foreground" />
                <span className="font-semibold text-sm">Notifications</span>
              </div>
              <p className="text-sm text-muted-foreground">Notification preferences coming soon.</p>
            </div>
          </div>
        </FadeIn>
      </div>
    </div>
  );
}
