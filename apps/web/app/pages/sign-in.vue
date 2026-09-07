<script setup lang="ts">
import { authClient } from "~/lib/auth-client";

const route = useRoute();
const email = ref("");
const password = ref("");
const submitting = ref(false);
const errorMessage = ref<string | null>(null);

// Only follow same-origin, relative redirects — a raw query-param redirect
// is a classic open-redirect vector.
function safeRedirect(): string {
  const target = route.query.redirect;
  if (typeof target === "string" && target.startsWith("/") && !target.startsWith("//")) {
    return target;
  }
  return "/";
}

async function submit() {
  submitting.value = true;
  errorMessage.value = null;
  const { error } = await authClient.signIn.email({ email: email.value, password: password.value });
  submitting.value = false;
  if (error) {
    errorMessage.value = "That email and password don't match.";
    return;
  }
  await navigateTo(safeRedirect());
}
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-background p-4">
    <Card class="w-full max-w-sm">
      <CardContent class="p-8">
        <div class="mb-7 text-lg font-bold">Ballast</div>
        <h1 class="mb-6 text-xl font-semibold">Sign in</h1>

        <div
          v-if="errorMessage"
          class="mb-5 rounded-md border border-destructive/40 bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive"
        >
          {{ errorMessage }}
        </div>

        <form class="flex flex-col gap-4" @submit.prevent="submit">
          <div class="flex flex-col gap-1.5">
            <Label for="email">Email</Label>
            <Input id="email" v-model="email" type="email" placeholder="you@company.com" required autocomplete="email" />
          </div>
          <div class="flex flex-col gap-1.5">
            <div class="flex items-baseline justify-between">
              <Label for="password">Password</Label>
              <NuxtLink to="/forgot-password" class="text-sm text-primary">Forgot password?</NuxtLink>
            </div>
            <Input id="password" v-model="password" type="password" placeholder="••••••••" required autocomplete="current-password" />
          </div>
          <Button type="submit" :disabled="submitting" class="mt-1">Sign in</Button>
        </form>

        <div class="mt-6 text-center text-sm text-muted-foreground">
          New here? <NuxtLink to="/sign-up" class="text-primary">Create an account</NuxtLink>
        </div>
      </CardContent>
    </Card>
  </div>
</template>
