<script setup lang="ts">
import { authClient } from "~/lib/auth-client";

const route = useRoute();
const invitationId = route.params.id as string;

type Status = "loading" | "signed-out" | "wrong-recipient" | "valid" | "error";

const status = ref<Status>("loading");
const invitation = ref<{ organizationName: string; inviterEmail: string; role: string } | null>(null);
const responding = ref(false);

async function load() {
  const { data: session } = await authClient.getSession();
  if (!session) {
    status.value = "signed-out";
    return;
  }

  const { data, error } = await authClient.organization.getInvitation({ query: { id: invitationId } });

  if (error?.code === "YOU_ARE_NOT_THE_RECIPIENT_OF_THE_INVITATION") {
    status.value = "wrong-recipient";
    return;
  }
  if (error || !data) {
    status.value = "error";
    return;
  }

  invitation.value = {
    organizationName: data.organizationName,
    inviterEmail: data.inviterEmail,
    role: data.role,
  };
  status.value = "valid";
}

async function accept() {
  responding.value = true;
  const { data } = await authClient.organization.acceptInvitation({ invitationId });
  if (data) {
    await authClient.organization.setActive({ organizationId: data.invitation.organizationId });
  }
  await navigateTo("/");
}

async function decline() {
  responding.value = true;
  await authClient.organization.rejectInvitation({ invitationId });
  await navigateTo("/");
}

async function signOutAndRetry() {
  await authClient.signOut();
  status.value = "signed-out";
}

onMounted(load);
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-background p-4">
    <Card class="w-full max-w-sm">
      <CardContent class="p-8">
        <div class="mb-7 text-lg font-bold">Ballast</div>

        <template v-if="status === 'signed-out'">
          <h1 class="mb-2.5 text-xl font-semibold">Sign in to accept this invitation</h1>
          <p class="mb-6 text-sm leading-relaxed text-muted-foreground">
            You've been invited to join an organization on Ballast. Sign in or create an account to continue.
          </p>
          <div class="flex flex-col gap-2.5">
            <Button as-child>
              <NuxtLink :to="`/sign-in?redirect=${encodeURIComponent(route.fullPath)}`">Sign in</NuxtLink>
            </Button>
            <Button as-child variant="outline">
              <NuxtLink :to="`/sign-up?redirect=${encodeURIComponent(route.fullPath)}`">Create an account</NuxtLink>
            </Button>
          </div>
        </template>

        <template v-else-if="status === 'wrong-recipient'">
          <h1 class="mb-2.5 text-xl font-semibold">This invitation isn't for your account</h1>
          <p class="mb-6 text-sm leading-relaxed text-muted-foreground">
            You're signed in, but this invitation was sent to a different email address. Sign out and sign in with the
            email it was sent to.
          </p>
          <button class="text-sm text-primary" @click="signOutAndRetry">Sign out</button>
        </template>

        <template v-else-if="status === 'valid' && invitation">
          <h1 class="mb-2.5 text-xl font-semibold">Join {{ invitation.organizationName }}</h1>
          <p class="mb-6 text-sm leading-relaxed text-muted-foreground">
            {{ invitation.inviterEmail }} invited you to join
            <strong class="text-foreground">{{ invitation.organizationName }}</strong> as a {{ invitation.role }}.
          </p>
          <div class="flex gap-2.5">
            <Button class="flex-1" :disabled="responding" @click="accept">Accept</Button>
            <Button class="flex-1" variant="outline" :disabled="responding" @click="decline">Decline</Button>
          </div>
        </template>

        <template v-else-if="status === 'error'">
          <h1 class="mb-2.5 text-xl font-semibold">This invitation isn't valid</h1>
          <p class="text-sm leading-relaxed text-muted-foreground">
            It may have expired or already been used. Ask whoever invited you to send a new one.
          </p>
        </template>
      </CardContent>
    </Card>
  </div>
</template>
