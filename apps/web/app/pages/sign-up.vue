<script setup lang="ts">
import { authClient } from "~/lib/auth-client";

const name = ref("");
const email = ref("");
const password = ref("");
const submitting = ref(false);
const errorMessage = ref<string | null>(null);
const emailTaken = ref(false);

async function submit() {
  submitting.value = true;
  errorMessage.value = null;
  emailTaken.value = false;
  const { error } = await authClient.signUp.email({ name: name.value, email: email.value, password: password.value });
  submitting.value = false;
  if (error) {
    if (error.code === "USER_ALREADY_EXISTS") {
      emailTaken.value = true;
      errorMessage.value = "An account with this email already exists.";
    } else {
      errorMessage.value = error.message ?? "Something went wrong. Try again.";
    }
    return;
  }
  await navigateTo("/");
}
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-background p-4">
    <Card class="w-full max-w-sm">
      <CardContent class="p-8">
        <div class="mb-7 text-lg font-bold">Ballast</div>
        <h1 class="mb-6 text-xl font-semibold">Create an account</h1>

        <div
          v-if="errorMessage"
          class="mb-5 rounded-md border border-destructive/40 bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive"
        >
          {{ errorMessage }}
          <NuxtLink v-if="emailTaken" to="/sign-in" class="underline">Sign in instead</NuxtLink>
        </div>

        <form class="flex flex-col gap-4" @submit.prevent="submit">
          <div class="flex flex-col gap-1.5">
            <Label for="name">Name</Label>
            <Input id="name" v-model="name" type="text" placeholder="Jamie Rivera" required autocomplete="name" />
          </div>
          <div class="flex flex-col gap-1.5">
            <Label for="email">Email</Label>
            <Input id="email" v-model="email" type="email" placeholder="you@company.com" required autocomplete="email" />
          </div>
          <div class="flex flex-col gap-1.5">
            <Label for="password">Password</Label>
            <Input
              id="password"
              v-model="password"
              type="password"
              placeholder="••••••••"
              minlength="8"
              required
              autocomplete="new-password"
            />
            <div class="text-xs text-muted-foreground">At least 8 characters</div>
          </div>
          <Button type="submit" :disabled="submitting" class="mt-1">Create account</Button>
        </form>

        <div class="mt-6 text-center text-sm text-muted-foreground">
          Already have an account? <NuxtLink to="/sign-in" class="text-primary">Sign in</NuxtLink>
        </div>
      </CardContent>
    </Card>
  </div>
</template>
