<template>
  <Toast />
  <Card class="flex justify-content-center w-16rem m-3 border-round">
    <template #title>Logout or Add User</template>
    <template #content>
      <Button class="btn btn-outline-dark" type="submit" @click="logout()">
        Logout
      </Button>
      <br><br>
      <Button class="btn btn-outline-dark" type="submit" @click="seeUser()">
        Get User
      </Button>
      <br><br>
      <Button v-if="isAdmin" class="btn btn-outline-dark" type="submit" @click="showDialog = true">
        Add User
      </Button>
    </template>
  </Card>

  <Dialog v-model:visible="showUserDialog" header="User Information">
    <div class="field">
      <label for="userEmail">Email: </label>
      <InputText id="userEmail" v-model="editedUser.email" readonly />
    </div>
    <div class="field">
      <label for="userFullName">Full Name: </label>
      <InputText id="userFullName" v-model="editedUser.fullName" />
    </div>
    <div class="field">
      <label for="userRole">Role: </label>
      <InputText id="userRole" v-model="editedUser.role" readonly />
    </div>
    <template #footer>
      <Button class="btn btn-outline-dark" type="button" @click="showUserDialog = false">
        Cancel
      </Button>
      <Button class="btn btn-outline-dark" type="submit" @click="saveUserInfo()">
        Save
      </Button>
    </template>
  </Dialog>

  <Dialog v-model:visible="showDialog" header="Add User">
    <div class="field">
      <label for="email">Email: </label>
      <InputText id="email" v-model="email" />
    </div>
    <div class="field">
      <label for="firstName">First Name: </label>
      <InputText id="firstName" v-model="firstName" />
    </div>
    <div class="field">
      <label for="lastName">Last Name: </label>
      <InputText id="lastName" v-model="lastName" />
    </div>
    <div class="field">
      <label for="password">Password: </label>
      <Password id="password" v-model="password" toggleMask />
    </div>
    <div class="field">
      <label for="retypePassword">Retype Password: </label>
      <Password id="retypePassword" v-model="retypedPassword" toggleMask />
    </div>
    <template #footer>
      <Button class="btn btn-outline-dark" type="button" @click="showDialog = false">
        Cancel
      </Button>
      <Button class="btn btn-outline-dark" type="submit" @click="onSignUp()">
        Sign Up
      </Button>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { supabase } from "../clients/supabase";
import { useToast } from "primevue/usetoast";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import { pinia } from "@/stores";

const toast = useToast();
const router = useRouter();
const authStore = useAuthStore(pinia);

const email = ref("");
const password = ref("");
const retypedPassword = ref("");
const firstName = ref("");
const lastName = ref("");
const showDialog = ref(false);
const submitted = ref(false);
const showUserDialog = ref(false);

const editedUser = ref({
  email: "",
  fullName: "",
  role: ""
});

const isAdmin = computed(() => {
  return authStore.companyRole === "Admin";
});

async function onSignUp() {
  try {
    submitted.value = true;

    if (
      email.value &&
      firstName.value &&
      lastName.value &&
      password.value &&
      retypedPassword.value &&
      password.value === retypedPassword.value
    ) {
      await createAccount();
      email.value = "";
      firstName.value = "";
      lastName.value = "";
      password.value = "";
      retypedPassword.value = "";
      toast.add({
        severity: "success",
        summary: "Confirmation Email Sent!",
        life: 3000
      });
      showDialog.value = false;
      submitted.value = false;
    }
  } catch (error) {
    console.log(error);
  }
}

async function createAccount() {
  const { data: { user }, error } = await supabase.auth.signUp({
    email: email.value,
    password: password.value,
    options: {
      data: {
        first_name: firstName.value,
        last_name: lastName.value
      },
      emailRedirectTo: "https://einventory.netlify.app/"
    }
  });

  if (error) {
    console.log(error);
  } else {
    console.log(user);
  }
}

async function seeUser() {
  if (authStore.user) {
    editedUser.value = {
      email: authStore.user.email || "",
      fullName: authStore.profile?.full_name || "",
      role: authStore.companyRole || "Unknown"
    };
    showUserDialog.value = true;
  }
}

async function saveUserInfo() {
  try {
    const userId = authStore.user?.id;
    if (!userId) {
      toast.add({
        severity: "error",
        summary: "User not found",
        life: 3000
      });
      return;
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: editedUser.value.fullName
      })
      .eq("id", userId);

    if (error) {
      console.log(error);
      toast.add({
        severity: "error",
        summary: "Error updating user",
        life: 3000
      });
    } else {
      if (authStore.profile) {
        authStore.profile = {
          ...authStore.profile,
          full_name: editedUser.value.fullName
        };
      } else {
        await authStore.fetchProfile(userId);
      }
      toast.add({
        severity: "success",
        summary: "User info updated!",
        life: 3000
      });
      showUserDialog.value = false;
    }
  } catch (error) {
    console.log(error);
    toast.add({
      severity: "error",
      summary: "Error updating user",
      life: 3000
    });
  }
}

async function logout() {
  const { error } = await supabase.auth.signOut();

  if (error) {
    console.log(error);
  } else {
    console.log("Sign out success");
    authStore.user = null;
    authStore.profile = null;
    await router.replace({ name: "Login" });
  }
}
</script>

<style>
@media (min-width: 1024px) {
  .about {
    min-height: 100vh;
    display: flex;
    align-items: center;
  }
}
</style>
