<template>
  <Toast />
    <Card class="flex justify-content-center w-16rem m-3 border-round">
        <template #title>Login</template>
        <template #content>
          <div class="flex justify-content-center flex-wrap pb-5" >
          <label for="username">Username: </label>
          <InputText id="username" v-model="input.username" rows="3" cols="20" :class="{'p-invalid': (submitted && usernameErr) || (submitted && !input.username)}"/>
          <small class="p-error" v-if="submitted && !input.username">Please enter name.</small>
          <small class="p-error" v-if="submitted && usernameErr && input.username">Username not found.</small>
        </div>
      <div class="flex justify-content-center flex-wrap pb-2">
        <label for="password">Password: </label> <br>
        <Password id="password" v-model="input.password" toggleMask v-on:keyup.enter="login()" :feedback="false" :class="{'p-invalid': (submitted && passErr) || (submitted && !input.password)}"/>
        <small class="p-error" v-if="submitted && !input.password">Please enter password.</small>
        <small class="p-error" v-if="submitted && passErr && input.password">Incorrect password.</small>
      </div>
      <div class="flex justify-content-center flex-wrap py-5">
        <Button class="btn btn-outline-dark" type="submit" v-on:click.prevent = "login()">
          Login
        </Button>
      </div>
        </template>
    </Card>
</template>

<script lang="ts">
import action from "../components/utils/axiosUtils";
export default {
name: 'LoginView',
data(){
return{
    input:{
        username: "",
        password: ""
    },
    showDialog: true,

    submitted: false,
    usernameErr: false,
    passErr: false,
}
},
methods:{
async login(){
  try {
    this.submitted = true;

    const sessionUser = await action.validatePassword(this.input);
    console.log("SESSION USER: ",sessionUser);
    if(sessionUser){
      //this.$router.push('/Home');
      await action.getSessionUser();
      this.$toast.add({severity:'success', summary: 'Login Successful!', detail: 'Login Successful!', life: 3000});
      location.reload();
    }
  
  } catch (error) {
    console.log(error);
    if(error == 'Username not found'){
      this.usernameErr = true;
      console.log(this.usernameErr);
    }
    else if(error == 'Incorrect password'){
      this.passErr = true;
      this.usernameErr = false;
    }
  }


  //document.cookie = sessionId;
},
},
}
</script>
<style lang="">
    
</style>