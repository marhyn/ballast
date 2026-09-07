<script setup lang="ts">
import { authClient } from "~/lib/auth-client";

definePageMeta({ middleware: "auth" });

const name = ref("");
const slug = ref("");
const slugEdited = ref(false);
const submitting = ref(false);
const errorMessage = ref<string | null>(null);

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

watch(name, (value) => {
  if (!slugEdited.value) {
    slug.value = slugify(value);
  }
});

async function submit() {
  submitting.value = true;
  errorMessage.value = null;

  const { data: org, error } = await authClient.organization.create({
    name: name.value,
    slug: slug.value,
  });

  if (error) {
    submitting.value = false;
    errorMessage.value = error.message ?? "Couldn't create that organization. Try a different slug.";
    return;
  }

  await authClient.organization.setActive({ organizationId: org.id });
  await navigateTo("/");
}
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-background p-4">
    <Card class="w-full max-w-sm">
      <CardContent class="p-8">
        <div class="mb-7 text-lg font-bold">Ballast</div>
        <h1 class="mb-2.5 text-xl font-semibold">Create your organization</h1>
        <p class="mb-6 text-sm leading-relaxed text-muted-foreground">
          This is your workspace — you can invite teammates to it once it's set up.
        </p>

        <div
          v-if="errorMessage"
          class="mb-5 rounded-md border border-destructive/40 bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive"
        >
          {{ errorMessage }}
        </div>

        <form class="flex flex-col gap-4" @submit.prevent="submit">
          <div class="flex flex-col gap-1.5">
            <Label for="name">Organization name</Label>
            <Input id="name" v-model="name" type="text" placeholder="Acme Inc" required />
          </div>
          <div class="flex flex-col gap-1.5">
            <Label for="slug">URL slug</Label>
            <div class="flex items-center overflow-hidden rounded-md border border-input bg-background">
              <span class="pl-3 text-sm text-muted-foreground">ballast.app/</span>
              <input
                id="slug"
                v-model="slug"
                type="text"
                required
                class="flex-1 border-none bg-transparent py-2 pr-3 text-sm text-foreground outline-none"
                @input="slugEdited = true"
              />
            </div>
            <div class="text-xs text-muted-foreground">Derived from the name — edit if you'd like something else.</div>
          </div>
          <Button type="submit" :disabled="submitting" class="mt-1.5">Create organization</Button>
        </form>
      </CardContent>
    </Card>
  </div>
</template>
