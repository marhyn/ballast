<script setup lang="ts">
// TEMPLATE EXAMPLE — see packages/db/src/schema/example.ts. Safe to delete.
import { orpc } from "~/lib/orpc";

definePageMeta({ middleware: "organization", layout: "app" });

type Note = Awaited<ReturnType<typeof orpc.example.list>>[number];

const notes = ref<Note[]>([]);
const title = ref("");
const body = ref("");
const submitting = ref(false);

async function refresh() {
  notes.value = await orpc.example.list();
}

async function createNote() {
  if (!title.value.trim()) return;
  submitting.value = true;
  try {
    await orpc.example.create({ title: title.value, body: body.value });
    title.value = "";
    body.value = "";
    await refresh();
  } finally {
    submitting.value = false;
  }
}

async function removeNote(id: string) {
  await orpc.example.delete({ id });
  await refresh();
}

onMounted(refresh);
</script>

<template>
  <div class="mx-auto max-w-2xl space-y-6 p-8">
    <div>
      <h1 class="text-2xl font-semibold">Example notes</h1>
      <p class="text-muted-foreground text-sm">
        A template example demonstrating the full pattern — schema, domain
        service, oRPC router, route guard, page. Safe to delete.
      </p>
    </div>

    <Card>
      <CardHeader>
        <CardTitle>New note</CardTitle>
      </CardHeader>
      <CardContent class="space-y-3">
        <div class="space-y-1">
          <Label for="title">Title</Label>
          <Input id="title" v-model="title" placeholder="Title" />
        </div>
        <div class="space-y-1">
          <Label for="body">Body</Label>
          <Textarea id="body" v-model="body" placeholder="Body" />
        </div>
        <Button :disabled="submitting" @click="createNote">Add note</Button>
      </CardContent>
    </Card>

    <div v-if="notes.length" class="space-y-3">
      <Card v-for="note in notes" :key="note.id">
        <CardHeader class="flex-row items-center justify-between space-y-0">
          <CardTitle>{{ note.title }}</CardTitle>
          <Button variant="ghost" size="sm" @click="removeNote(note.id)">Delete</Button>
        </CardHeader>
        <CardContent>{{ note.body }}</CardContent>
      </Card>
    </div>
    <p v-else class="text-muted-foreground text-sm">No notes yet.</p>
  </div>
</template>
