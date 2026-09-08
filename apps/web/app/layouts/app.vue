<script setup lang="ts">
import { authClient } from "~/lib/auth-client";
import { orpc } from "~/lib/orpc";

const { data: session } = await authClient.useSession(useFetch);

// Client-only: the oRPC client's fetch has no SSR-side cookie forwarding
// (unlike Nuxt's own useFetch above), so a server-side call would always see
// an unauthenticated context. useAsyncData({server:false}) doesn't reliably
// fire this — plain ref + onMounted, same as apps/web/app/pages/example.
type Organization = Awaited<ReturnType<typeof orpc.tenant.list>>[number];
const organizations = ref<Organization[]>([]);

async function refreshOrganizations() {
  organizations.value = await orpc.tenant.list();
}

const currentOrganization = computed(() =>
  organizations.value.find((org) => org.id === session.value?.session.activeOrganizationId),
);

async function switchOrganization(organizationId: string) {
  await authClient.organization.setActive({ organizationId });
  window.location.reload();
}

async function signOut() {
  await authClient.signOut();
  await navigateTo("/sign-in");
}

onMounted(() => {
  refreshOrganizations();
});
</script>

<template>
  <div class="min-h-screen bg-background">
    <header class="flex h-[60px] items-center justify-between border-b border-border bg-card px-8">
      <div class="flex items-center gap-5">
        <NuxtLink to="/" class="text-base font-bold text-foreground">Ballast</NuxtLink>

        <DropdownMenu>
          <DropdownMenuTrigger class="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm text-foreground">
            {{ currentOrganization?.name ?? "Select organization" }}
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-muted-foreground">
              <path d="M6 9l6 6 6-6" />
            </svg>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuLabel>Organizations</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              v-for="org in organizations"
              :key="org.id"
              @click="switchOrganization(org.id)"
            >
              {{ org.name }}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem as-child>
              <NuxtLink to="/onboarding">Create organization</NuxtLink>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger class="flex items-center gap-1.5 text-sm text-foreground">
          {{ session?.user.name }}
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-muted-foreground">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>{{ session?.user.email }}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem as-child>
            <NuxtLink to="/settings/organization">Organization settings</NuxtLink>
          </DropdownMenuItem>
          <DropdownMenuItem as-child>
            <NuxtLink to="/settings/billing">Billing</NuxtLink>
          </DropdownMenuItem>
          <DropdownMenuItem v-if="session?.user.platformAdmin" as-child>
            <NuxtLink to="/admin">Admin</NuxtLink>
          </DropdownMenuItem>
          <DropdownMenuItem @click="signOut">Sign out</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>

    <main>
      <slot />
    </main>
  </div>
</template>
