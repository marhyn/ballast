<script setup lang="ts">
import { plans } from "@ballast/billing/plans";
import { orpc } from "~/lib/orpc";

definePageMeta({ middleware: "admin", layout: "app" });

type Organization = Awaited<ReturnType<typeof orpc.admin.organizations>>[number];
type AdminUser = Awaited<ReturnType<typeof orpc.admin.users>>[number];
type Subscription = Awaited<ReturnType<typeof orpc.admin.subscriptions>>[number];

const loaded = ref(false);
const organizations = ref<Organization[]>([]);
const users = ref<AdminUser[]>([]);
const subscriptions = ref<Subscription[]>([]);

function planName(planId: string | null) {
  if (!planId) return "Free";
  return plans.find((plan) => plan.id === planId)?.name ?? "Unknown";
}

function isPastDueOrCanceled(status: string) {
  return status === "past_due" || status === "canceled";
}

const statusLabel: Record<string, string> = {
  active: "Active",
  trialing: "Trialing",
  past_due: "Past due",
  canceled: "Canceled",
};

function formatDate(value: string | Date | null) {
  return value
    ? new Date(value).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })
    : "—";
}

async function refresh() {
  const [orgs, userList, subs] = await Promise.all([
    orpc.admin.organizations(),
    orpc.admin.users(),
    orpc.admin.subscriptions(),
  ]);
  organizations.value = orgs;
  users.value = userList;
  subscriptions.value = subs;
  loaded.value = true;
}

onMounted(refresh);
</script>

<template>
  <div class="mx-auto flex max-w-[1000px] flex-col gap-6 px-6 py-10">
    <div>
      <h1 class="text-2xl font-semibold">Admin</h1>
      <p class="text-sm text-muted-foreground">Platform-wide oversight — organizations, users, and subscriptions across Ballast.</p>
    </div>

    <template v-if="loaded">
      <Card>
        <CardHeader class="flex-row items-center justify-between space-y-0">
          <CardTitle>Organizations</CardTitle>
          <span class="text-sm text-muted-foreground">{{ organizations.length }} total</span>
        </CardHeader>
        <CardContent class="px-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead class="pl-4">Name</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Members</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead class="pr-4">Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableEmpty v-if="!organizations.length" :colspan="6">No organizations yet.</TableEmpty>
              <TableRow v-for="org in organizations" :key="org.id">
                <TableCell class="pl-4 font-medium">{{ org.name }}</TableCell>
                <TableCell class="font-mono text-xs text-muted-foreground">{{ org.slug }}</TableCell>
                <TableCell>{{ org.memberCount }}</TableCell>
                <TableCell>
                  <Badge v-if="org.planId" variant="outline" class="text-primary">{{ planName(org.planId) }}</Badge>
                  <Badge v-else variant="secondary">Free</Badge>
                </TableCell>
                <TableCell>
                  <Badge
                    v-if="org.subscriptionStatus"
                    :variant="isPastDueOrCanceled(org.subscriptionStatus) ? 'destructive' : 'outline'"
                    :class="{ 'text-primary': !isPastDueOrCanceled(org.subscriptionStatus) }"
                  >
                    {{ statusLabel[org.subscriptionStatus] ?? org.subscriptionStatus }}
                  </Badge>
                  <span v-else class="text-sm text-muted-foreground">—</span>
                </TableCell>
                <TableCell class="pr-4 text-muted-foreground">{{ formatDate(org.createdAt) }}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="flex-row items-center justify-between space-y-0">
          <CardTitle>Users</CardTitle>
          <span class="text-sm text-muted-foreground">{{ users.length }} total</span>
        </CardHeader>
        <CardContent class="px-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead class="pl-4">Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Verified</TableHead>
                <TableHead>Organizations</TableHead>
                <TableHead>Platform admin</TableHead>
                <TableHead class="pr-4">Joined</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableEmpty v-if="!users.length" :colspan="6">No users yet.</TableEmpty>
              <TableRow v-for="u in users" :key="u.id">
                <TableCell class="pl-4 font-medium">{{ u.name }}</TableCell>
                <TableCell class="text-muted-foreground">{{ u.email }}</TableCell>
                <TableCell>
                  <span v-if="u.emailVerified" class="inline-flex items-center gap-1 text-sm text-muted-foreground">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-primary">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Verified
                  </span>
                  <span v-else class="text-sm text-muted-foreground">Unverified</span>
                </TableCell>
                <TableCell>{{ u.organizationCount }}</TableCell>
                <TableCell>
                  <Badge v-if="u.platformAdmin" variant="outline" class="text-primary">Admin</Badge>
                </TableCell>
                <TableCell class="pr-4 text-muted-foreground">{{ formatDate(u.createdAt) }}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="flex-row items-center justify-between space-y-0">
          <CardTitle>Subscriptions</CardTitle>
          <span class="text-sm text-muted-foreground">{{ subscriptions.length }} total</span>
        </CardHeader>
        <CardContent class="px-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead class="pl-4">Organization</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Provider</TableHead>
                <TableHead class="pr-4">Renews</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableEmpty v-if="!subscriptions.length" :colspan="5">No subscriptions yet.</TableEmpty>
              <TableRow v-for="sub in subscriptions" :key="sub.id">
                <TableCell class="pl-4 font-medium">{{ sub.organizationName }}</TableCell>
                <TableCell>{{ planName(sub.planId) }}</TableCell>
                <TableCell>
                  <Badge :variant="isPastDueOrCanceled(sub.status) ? 'destructive' : 'outline'" :class="{ 'text-primary': !isPastDueOrCanceled(sub.status) }">
                    {{ statusLabel[sub.status] ?? sub.status }}
                  </Badge>
                </TableCell>
                <TableCell class="text-muted-foreground capitalize">{{ sub.provider }}</TableCell>
                <TableCell class="pr-4 text-muted-foreground">{{ formatDate(sub.currentPeriodEnd) }}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </template>
  </div>
</template>
