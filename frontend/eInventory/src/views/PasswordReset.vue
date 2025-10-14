<template lang="">
    <div>
        <Toast />
        <Dialog v-model:visible="showDialog" name="password-reset-form" class="" header="Password Reset">
      <div class="field">
        <label for="password">Password: </label> <br>
        <Password id="password" v-model="newPassword" toggleMask/>
        <small class="p-error" v-if="submitted && !newPassword">Please enter password.</small>
      </div>
      <div class="field">
        <label for="password">Retype Password: </label> <br>
        <Password id="password" v-model="retypedNewPassword" toggleMask/>
        <small class="p-error" v-if="submitted && newPassword && !retypedNewPassword">Please reenter password.</small>
        <small class="p-error" v-if="submitted && newPassword != retypedNewPassword && retypedNewPassword">Passwords do not match.</small> 
      </div>
      <Button class="btn btn-outline-dark" type="submit" @click="onPasswordReset()">
        Reset Password
      </Button>
    </Dialog>
    </div>
</template>
<script setup lang="ts">
import { ref } from "vue";
import { supabase } from "../clients/supabase"
import { useToast } from "primevue/usetoast";
import { useRouter, useRoute } from "vue-router";

const toast = useToast();
const router = useRouter();
const route = useRoute();

// const {data: user} = await supabase.auth.getUser();
let newPassword = ref("");
let retypedNewPassword = ref("");
let errMSG = ref("");
let showDialog = ref(true);
let submitted = ref(false);
async function onPasswordReset() {
  try {
    console.log("onPasswordReset");
    // console.log(user);
    submitted.value = true;

    // console.log(email.value, firstName.value, lastName.value, password.value, retypedPassword.value)

    if(newPassword.value && retypedNewPassword.value && newPassword.value == retypedNewPassword.value){
      // console.log(email.value, firstName.value, lastName.value, password.value, retypedPassword.value)
      await passwordReset();
      newPassword.value = "";
      retypedNewPassword.value = "";
      toast.add({severity:'success', summary: 'Password Reset!', life: 3000});
    }
  } catch (error) {
    toast.add({severity:'error', summary: 'Error', detail: error, life: 3000});
  }
}

async function passwordReset() {
	const { data, error } = await supabase.auth.updateUser({
  password: newPassword.value
})
	if (error)
	{
		throw error;
	}
	else
	{
		console.log(data);
        router.push({name: 'Home'})
	}
}
</script>
<style lang="">
    
</style>