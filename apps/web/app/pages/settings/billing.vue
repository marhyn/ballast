<script setup lang="ts">
import { plans } from "@ballast/billing/plans";
import { orpc } from "~/lib/orpc";

definePageMeta({ middleware: "organization", layout: "app" });

const route = useRoute();
const checkoutResult = computed(() => (typeof route.query.checkout === "string" ? route.query.checkout : null));

type CurrentPlan = Awaited<ReturnType<typeof orpc.billing.current>>;

const loaded = ref(false);
const current = ref<CurrentPlan>({ subscription: null, planId: null });
const startingCheckout = ref<string | null>(null);
const checkoutError = ref<string | null>(null);
const openingPortal = ref(false);
const portalError = ref<string | null>(null);

async function refresh() {
  current.value = await orpc.billing.current();
  loaded.value = true;
}

async function choosePlan(planId: string) {
  startingCheckout.value = planId;
  checkoutError.value = null;
  try {
    const { url } = await orpc.billing.checkout({ planId });
    window.location.href = url;
  } catch {
    checkoutError.value = "Couldn't start checkout. Try again in a moment.";
  } finally {
    startingCheckout.value = null;
  }
}

async function manageBilling() {
  openingPortal.value = true;
  portalError.value = null;
  try {
    const { url } = await orpc.billing.portal();
    window.location.href = url;
  } catch {
    portalError.value = "Couldn't open the billing portal. Try again in a moment.";
  } finally {
    openingPortal.value = false;
  }
}

const statusLabel: Record<string, string> = {
  active: "Active",
  trialing: "Trialing",
  past_due: "Past due",
  canceled: "Canceled",
};

onMounted(refresh);
</script>

<template>
  <div class="mx-auto flex max-w-2xl flex-col gap-6 px-6 py-10">
    <h1 class="text-2xl font-semibold">Billing</h1>

    <div
      v-if="checkoutResult === 'success'"
      class="rounded-md border border-primary/30 bg-primary/10 px-3.5 py-2.5 text-sm text-primary"
    >
      Subscription updated. It may take a moment to appear below.
    </div>
    <div
      v-else-if="checkoutResult === 'cancelled'"
      class="rounded-md border border-border bg-muted px-3.5 py-2.5 text-sm text-muted-foreground"
    >
      Checkout was cancelled — no changes were made.
    </div>

    <template v-if="loaded">
      <div
        v-if="current.subscription?.status === 'past_due'"
        class="flex items-center gap-2.5 rounded-md border border-destructive/30 bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="shrink-0">
          <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
        <span class="flex-1">Your last payment failed. Update your payment method to keep your plan active.</span>
        <Button variant="destructive" size="sm" :disabled="openingPortal" @click="manageBilling">Update payment method</Button>
      </div>

      <Card v-if="current.subscription">
        <CardHeader class="flex-row items-center justify-between space-y-0">
          <CardTitle>Current plan</CardTitle>
          <Badge :variant="current.subscription.status === 'past_due' ? 'destructive' : 'outline'" :class="{ 'text-primary': current.subscription.status !== 'past_due' }">
            {{ statusLabel[current.subscription.status] ?? current.subscription.status }}
          </Badge>
        </CardHeader>
        <CardContent class="flex flex-col gap-3">
          <div>
            <div class="text-[15px] font-medium">
              {{ plans.find((plan) => plan.id === current.planId)?.name ?? "Custom plan" }}
              <template v-if="current.planId">— ${{ plans.find((plan) => plan.id === current.planId)?.priceMonthly }}/mo</template>
            </div>
            <div v-if="current.subscription.currentPeriodEnd" class="text-sm text-muted-foreground">
              Renews {{ new Date(current.subscription.currentPeriodEnd).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" }) }}
            </div>
          </div>
          <div v-if="portalError" class="text-sm text-destructive">{{ portalError }}</div>
          <div>
            <Button variant="outline" :disabled="openingPortal" @click="manageBilling">Manage billing</Button>
          </div>
        </CardContent>
      </Card>
      <p v-else class="text-sm text-muted-foreground">
        You're on the Starter plan. Upgrade any time — no long-term commitment.
      </p>

      <div v-if="checkoutError" class="rounded-md border border-destructive/30 bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive">
        {{ checkoutError }}
      </div>

      <div class="grid grid-cols-3 gap-4">
        <Card v-for="plan in plans" :key="plan.id" :class="{ 'ring-2 ring-primary': plan.id === current.planId }">
          <CardHeader>
            <CardTitle>{{ plan.name }}</CardTitle>
            <div class="mt-0.5 flex items-baseline gap-1">
              <span class="text-xl font-semibold">${{ plan.priceMonthly }}</span>
              <span class="text-sm text-muted-foreground">/mo</span>
            </div>
            <p class="mt-1.5 text-sm text-muted-foreground">{{ plan.description }}</p>
          </CardHeader>
          <CardContent class="flex flex-col gap-3.5">
            <div class="border-t border-border pt-3.5">
              <ul class="flex flex-col gap-2">
                <li v-for="feature in plan.features" :key="feature" class="flex items-start gap-2 text-sm">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mt-0.5 shrink-0 text-primary">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span>{{ feature }}</span>
                </li>
              </ul>
            </div>

            <Button v-if="plan.id === current.planId" variant="outline" disabled class="w-full">Current plan</Button>
            <Button
              v-else-if="plan.priceIds"
              :disabled="startingCheckout === plan.id"
              class="w-full"
              @click="choosePlan(plan.id)"
            >
              {{ current.subscription ? "Switch plan" : "Choose plan" }}
            </Button>
            <p v-else class="text-center text-sm text-muted-foreground">Included at no cost</p>
          </CardContent>
        </Card>
      </div>
    </template>
  </div>
</template>
