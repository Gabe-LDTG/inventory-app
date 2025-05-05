<template>
  <Toast />
    <Card class="flex justify-content-center w-16rem m-3 border-round">
        <template #title>Logout or Add User</template>
        <template #content>
            <Button class="btn btn-outline-dark" type="submit" @click="logout()">
                Logout
            </Button> <br><br>
            <Button class="btn btn-outline-dark" type="submit" @click="seeUser()">
                Get User
            </Button> <br><br>
            <Button class="btn btn-outline-dark" type="submit" @click="showDialog = true">
                Add User
            </Button>

        </template>
    </Card>

    <Dialog v-model:visible="showDialog" name="add-user-form" class="" header="Add User">
      <div class="field" >
        <label for="email">Email: </label>
        <InputText id="email" v-model="email" rows="3" cols="20"/>
        <!-- <small class="p-error" v-if="submitted && !input.email">Please enter name.</small> -->
      </div>
      <div class="field" >
        <label for="firstName">First Name: </label>
        <InputText id="firstName" v-model="firstName" rows="3" cols="20"/>
        <!-- <small class="p-error" v-if="submitted && !input.email">Please enter name.</small> -->
      </div>
      <div class="field" >
        <label for="lastName">Last Name: </label>
        <InputText id="lastName" v-model="lastName" rows="3" cols="20"/>
        <!-- <small class="p-error" v-if="submitted && !input.email">Please enter name.</small> -->
      </div>
      <div class="field">
        <label for="password">Password: </label> <br>
        <Password id="password" v-model="password" toggleMask/>
        <!-- <small class="p-error" v-if="submitted && !input.password">Please enter password.</small> -->
      </div>
      <div class="field">
        <label for="password">Retype Password: </label> <br>
        <Password id="password" v-model="retypedPassword" toggleMask/>
        <!-- <small class="p-error" v-if="submitted && !input.retypedPassword">Please reenter password.</small>
        <small class="p-error" v-if="submitted && input.password != input.retypedPassword && input.retypedPassword">Passwords do not match.</small> -->
      </div>
      <Button class="btn btn-outline-dark" type="submit" @click="showDialog = false">
        Cancel
      </Button>
      <Button class="btn btn-outline-dark" type="submit" @click="onSignUp()">
        Sign Up
      </Button>
    </Dialog>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { supabase } from "../clients/supabase"
import { useToast } from "primevue/usetoast";
import { useRouter, useRoute } from "vue-router";

const toast = useToast();
const router = useRouter();
const route = useRoute();

let email = ref("");
let password = ref("");
let retypedPassword = ref("");
let firstName = ref("");
let lastName = ref("");
let errMSG = ref("");
let showDialog = ref(false);
let submitted = ref(false);

async function onSignUp() {
  try {
    submitted = ref(true);

    // console.log(email.value, firstName.value, lastName.value, password.value, retypedPassword.value)

    if(email.value && firstName.value && lastName.value && password.value && retypedPassword.value && password.value == retypedPassword.value){
      // console.log(email.value, firstName.value, lastName.value, password.value, retypedPassword.value)
      await createAccount();
      password.value = "";
      email.value = "";
      firstName.value = "";
      lastName.value = "";
      retypedPassword.value = "";
      toast.add({severity:'success', summary: 'Confirmation Email Sent!', life: 3000});
      showDialog = ref(false);
      submitted = ref(false);
    }
  } catch (error) {
    console.log(error);
  }
}

async function createAccount() {
	const { data:{user}, error } = await supabase.auth.signUp({
		email: email.value,
		password: password.value,
		options: {
			data: {
				first_name: firstName.value,
        last_name: lastName.value,
			},
      emailRedirectTo: 'https://einventory.netlify.app/'
		}
	})
	if (error)
	{
		console.log(error);
	}
	else
	{
		console.log(user);
	}
}

async function seeUser() {
	const localUser = await supabase.auth.getSession();
	console.log(localUser.data.session)
  // console.log(route);
}

async function logout() {
	const { error } = await supabase.auth.signOut();

	if (error) {
		console.log(error);
	}
	else {
		console.log("Sign out success")
    router.push({name: 'Login'})
	}
}
</script>

<!-- <script lang="ts">
import action from "../components/utils/axiosUtils";
export default {
data(){
    return{
        input:{
            email: "",
            password: "",
            retypedPassword: "",
        },
        showDialog: false,
        submitted: false,
    }
},
methods:{
    async logout(){
        try {
            location.reload();
            await action.logOut();
            
        } catch (error) {
            console.log(error);
        }
    },
    async onSignUp(){
        try {
            this.submitted = true;

            if(this.input.email && this.input.password && this.input.retypedPassword && this.input.password == this.input.retypedPassword){
                console.log(this.input);

                action.addUser(this.input);
                this.input.password = "";
                this.input.email = "";
                this.input.retypedPassword = "";
                this.$toast.add({severity:'success', summary: 'User Added!', life: 3000});
                this.showDialog = false;
                this.submitted = false;
            }
        } catch (error) {
            console.log(error);
        }
    },
  },
}
</script> -->

<style>
@media (min-width: 1024px) {
  .about {
    min-height: 100vh;
    display: flex;
    align-items: center;
  }
}
</style>
