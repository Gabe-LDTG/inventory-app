<template>
	<Toast position="bottom-left" />

	<Card class="flex justify-content-center w-16rem m-3 border-round">
        <template #title>Login</template>
        <template #content>
			<div class="flex justify-content-center flex-wrap pb-5" >
				<label for="username">Email: </label>
				<InputText id="email" v-model="email" rows="3" cols="20"/>
				<!-- <small class="p-error" v-if="">Please enter name.</small>
				<small class="p-error" v-if="">Username not found.</small> -->
				</div>
			<div class="flex justify-content-center flex-wrap pb-2">
				<label for="password">Password: </label> <br>
				<Password id="password" v-model="password" toggleMask v-on:keyup.enter="login()" :feedback="false" />
				<!-- <small class="p-error" v-if="">Please enter password.</small>
				<small class="p-error" v-if="">Incorrect password.</small> -->
			</div>
			<div class="flex justify-content-center flex-wrap py-5">
				<Button text @click="onForgotPassword"> Forgot Password? </Button>
			</div>
			<div class="flex justify-content-center flex-wrap py-5">
				<Button @click="login"> Login </Button>
			</div>
        </template>
    </Card>
	<Dialog v-model:visible="forgotPasswordDialog" name="forgot-password-form" class="" header="Forgot Password">
		<div class="field">
			<label for="email">Email: </label>
			<InputText id="email" v-model="email" rows="3" cols="20"/>
		</div>
		<div class="flex justify-content-center flex-wrap py-5">
			<Button @click="forgotPassword"> Reset Password </Button>
		</div>
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
let firstName = ref("");
let errMSG = ref("");
let forgotPasswordDialog = ref(false);

async function createAccount() {
	const { data:{user}, error } = await supabase.auth.signUp({
		email: email.value,
		password: password.value,
		options: {
			data: {
				first_name: firstName.value
			}
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

async function login() {
	console.log("run")
	const { data, error } = await supabase.auth.signInWithPassword({
		email: email.value,
		password: password.value
	})
	if (error)
	{
		console.log(error);
		toast.add({ severity: 'error', summary: 'Login Failed', detail: error });
	}
	else
	{
		console.log(data);
		toast.add({ severity: 'success', summary: 'Login Successful', detail: 'Welcome '+ data.user.user_metadata.first_name+'!', life: 3000 });
		router.push('/');
	}
}

async function seeUser() {
	const localUser = await supabase.auth.getSession();
	console.log(localUser.data.session)
}

async function logout() {
	const { error } = await supabase.auth.signOut();

	if (error) {
		console.log(error);
	}
	else {
		console.log("Sign out success")
	}
}

function onForgotPassword() {
	forgotPasswordDialog.value = true;
	email.value = "";
	password.value = "";
}

async function forgotPassword(){
	const url = import.meta.env.VITE_WEBSITE_URL;
	const test = import.meta.env.VITE_SUPABASE_URL;
	console.log("TEST: " + test);
	console.log("URL: " + url);
	const { data, error } = await supabase.auth.resetPasswordForEmail(email.value, {
		redirectTo: url + '/passwordreset'
	});
	if (error) {
		console.log(error);
	}
	else {
		console.log("Password reset email sent to " + email.value + " with redirect to " + import.meta.env.VITE_WEBSITE_URL + '/passwordreset');
	}
}
</script>

<style scoped>
.inputContainer {
	display: flex;
	flex-direction: column;
}

input {
	font-size: 1.5em;
}
.buttonContainer {
	display: flex;
	flex-direction: column;
	margin-top: 1em;
}

button {
	margin-bottom: 1em;
	padding: 1em 2em 1em 2em;
}
</style>