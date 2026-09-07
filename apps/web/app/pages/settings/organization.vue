<script setup lang="ts">
import { authClient } from "~/lib/auth-client";

definePageMeta({ middleware: "organization", layout: "app" });

const { data: session } = await authClient.useSession(useFetch);
const organizationId = computed(() => session.value?.session.activeOrganizationId ?? "");

const name = ref("");
const slug = ref("");
const savingOrg = ref(false);
const orgSaved = ref(false);

type FullOrganization = NonNullable<
  Awaited<ReturnType<typeof authClient.organization.getFullOrganization>>["data"]
>;

const members = ref<FullOrganization["members"]>([]);
const invitations = ref<FullOrganization["invitations"]>([]);

const inviteEmail = ref("");
const inviteRole = ref<"member" | "admin">("member");
const inviting = ref(false);
const inviteError = ref<string | null>(null);

// getFullOrganization already nests members and invitations — one call
// covers everything this page shows.
async function loadOrganization() {
  const { data } = await authClient.organization.getFullOrganization({
    query: { organizationId: organizationId.value },
  });
  if (data) {
    name.value = data.name;
    slug.value = data.slug;
    members.value = data.members;
    invitations.value = data.invitations.filter((invitation) => invitation.status === "pending");
  }
}

async function saveOrganization() {
  savingOrg.value = true;
  orgSaved.value = false;
  await authClient.organization.update({
    organizationId: organizationId.value,
    data: { name: name.value, slug: slug.value },
  });
  savingOrg.value = false;
  orgSaved.value = true;
}

async function removeMember(email: string) {
  await authClient.organization.removeMember({ memberIdOrEmail: email, organizationId: organizationId.value });
  await loadOrganization();
}

async function sendInvite() {
  inviting.value = true;
  inviteError.value = null;
  const { error } = await authClient.organization.inviteMember({
    email: inviteEmail.value,
    role: inviteRole.value,
    organizationId: organizationId.value,
  });
  inviting.value = false;
  if (error) {
    inviteError.value = error.message ?? "Couldn't send that invitation.";
    return;
  }
  inviteEmail.value = "";
  await loadOrganization();
}

async function cancelInvitation(invitationId: string) {
  await authClient.organization.cancelInvitation({ invitationId });
  await loadOrganization();
}

onMounted(loadOrganization);
</script>

<template>
  <div class="mx-auto flex max-w-2xl flex-col gap-6 px-6 py-10">
    <h1 class="text-2xl font-semibold">Organization settings</h1>

    <Card>
      <CardHeader>
        <CardTitle>Organization</CardTitle>
      </CardHeader>
      <CardContent class="flex flex-col gap-3.5">
        <div class="flex flex-col gap-1.5">
          <Label for="org-name">Name</Label>
          <Input id="org-name" v-model="name" type="text" />
        </div>
        <div class="flex flex-col gap-1.5">
          <Label for="org-slug">URL slug</Label>
          <Input id="org-slug" v-model="slug" type="text" />
        </div>
        <div class="mt-1 flex items-center gap-3">
          <Button :disabled="savingOrg" @click="saveOrganization">Save changes</Button>
          <span v-if="orgSaved" class="text-sm text-muted-foreground">Saved.</span>
        </div>
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle>Members</CardTitle>
      </CardHeader>
      <CardContent class="flex flex-col">
        <div
          v-for="(member, index) in members"
          :key="member.id"
          class="flex items-center justify-between py-2.5"
          :class="{ 'border-b border-border': index < members.length - 1 }"
        >
          <div>
            <div class="text-sm">{{ member.user.name }}</div>
            <div class="text-sm text-muted-foreground">{{ member.user.email }}</div>
          </div>
          <div class="flex items-center gap-2.5">
            <Badge variant="outline" class="capitalize">{{ member.role }}</Badge>
            <button
              v-if="member.role !== 'owner'"
              class="text-sm text-destructive"
              @click="removeMember(member.user.email)"
            >
              Remove
            </button>
          </div>
        </div>
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle>Invite a member</CardTitle>
      </CardHeader>
      <CardContent>
        <div
          v-if="inviteError"
          class="mb-3.5 rounded-md border border-destructive/40 bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive"
        >
          {{ inviteError }}
        </div>
        <form class="flex items-end gap-2.5" @submit.prevent="sendInvite">
          <div class="flex flex-1 flex-col gap-1.5">
            <Label for="invite-email">Email</Label>
            <Input id="invite-email" v-model="inviteEmail" type="email" placeholder="teammate@company.com" required />
          </div>
          <div class="flex w-36 flex-col gap-1.5">
            <Label for="invite-role">Role</Label>
            <Select v-model="inviteRole">
              <SelectTrigger id="invite-role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="member">Member</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" :disabled="inviting">Send invite</Button>
        </form>
      </CardContent>
    </Card>

    <Card v-if="invitations.length">
      <CardHeader>
        <CardTitle>Pending invitations</CardTitle>
      </CardHeader>
      <CardContent class="flex flex-col">
        <div
          v-for="(invitation, index) in invitations"
          :key="invitation.id"
          class="flex items-center justify-between py-2.5"
          :class="{ 'border-b border-border': index < invitations.length - 1 }"
        >
          <div>
            <div class="text-sm">{{ invitation.email }}</div>
            <div class="text-sm text-muted-foreground capitalize">Invited as {{ invitation.role }}</div>
          </div>
          <div class="flex items-center gap-2.5">
            <Badge variant="outline" class="text-primary">Pending</Badge>
            <button class="text-sm text-destructive" @click="cancelInvitation(invitation.id)">Cancel</button>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
</template>
