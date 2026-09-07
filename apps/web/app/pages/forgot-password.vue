<script setup lang="ts">
import { authClient } from "~/lib/auth-client";

const email = ref("");
const submitting = ref(false);
const sent = ref(false);

async function submit() {
  submitting.value = true;
  // Deliberately doesn't distinguish "no such account" from success — that
  // would let a visitor enumerate registered emails.
  await authClient.requestPasswordReset({ email: email.value, redirectTo: "/reset-password" });
  submitting.value = false;
  sent.value = true;
}
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-background p-4">
    <Card class="w-full max-w-sm">
      <CardContent class="p-8">
        <div class="mb-7 text-lg font-bold">Ballast</div>
        <h1 class="mb-4 text-xl font-semibold">Reset your password</h1>

        <template v-if="sent">
          <p class="text-sm leading-relaxed text-muted-foreground">
            Check your email — we sent a link to reset your password.
          </p>
        </template>
        <template v-else>
          <p class="mb-5 text-sm leading-relaxed text-muted-foreground">
            Enter your email and we'll send you a link to reset your password.
          </p>
          <form class="flex flex-col gap-4" @submit.prevent="submit">
            <div class="flex flex-col gap-1.5">
              <Label for="email">Email</Label>
              <Input id="email" v-model="email" type="email" placeholder="you@company.com" required autocomplete="email" />
            </div>
            <Button type="submit" :disabled="submitting" class="mt-1">Send reset link</Button>
          </form>
        </template>

        <div class="mt-6 text-center text-sm text-muted-foreground">
          <NuxtLink to="/sign-in" class="text-primary">Back to sign in</NuxtLink>
        </div>
      </CardContent>
    </Card>
  </div>
</template>
