<script setup lang="ts">
import { authClient } from "~/lib/auth-client";

const route = useRoute();
const newPassword = ref("");
const confirmPassword = ref("");
const submitting = ref(false);
const errorMessage = ref<string | null>(null);
const expired = ref(false);

const token = computed(() => (typeof route.query.token === "string" ? route.query.token : ""));

async function submit() {
  errorMessage.value = null;
  expired.value = false;

  if (newPassword.value !== confirmPassword.value) {
    errorMessage.value = "Passwords don't match.";
    return;
  }

  submitting.value = true;
  const { error } = await authClient.resetPassword({ newPassword: newPassword.value, token: token.value });
  submitting.value = false;

  if (error) {
    expired.value = true;
    errorMessage.value = "This reset link has expired.";
    return;
  }

  await navigateTo("/sign-in");
}
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-background p-4">
    <Card class="w-full max-w-sm">
      <CardContent class="p-8">
        <div class="mb-7 text-lg font-bold">Ballast</div>
        <h1 class="mb-6 text-xl font-semibold">Choose a new password</h1>

        <div
          v-if="errorMessage"
          class="mb-5 rounded-md border border-destructive/40 bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive"
        >
          {{ errorMessage }}
          <NuxtLink v-if="expired" to="/forgot-password" class="underline">Request a new one</NuxtLink>
        </div>

        <form class="flex flex-col gap-4" @submit.prevent="submit">
          <div class="flex flex-col gap-1.5">
            <Label for="new-password">New password</Label>
            <Input
              id="new-password"
              v-model="newPassword"
              type="password"
              placeholder="••••••••"
              minlength="8"
              required
              autocomplete="new-password"
            />
          </div>
          <div class="flex flex-col gap-1.5">
            <Label for="confirm-password">Confirm password</Label>
            <Input
              id="confirm-password"
              v-model="confirmPassword"
              type="password"
              placeholder="••••••••"
              required
              autocomplete="new-password"
            />
          </div>
          <Button type="submit" :disabled="submitting" class="mt-1">Update password</Button>
        </form>
      </CardContent>
    </Card>
  </div>
</template>
