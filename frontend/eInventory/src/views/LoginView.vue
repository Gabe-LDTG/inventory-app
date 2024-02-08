<template>
    <Dialog v-model:visible="showDialog" name="login-form" class="" header="Login">
      <div class="field" >
        <label for="username">Username: </label>
        <InputText id="username" v-model="input.username" rows="3" cols="20" :class="{'p-invalid': (submitted && usernameErr) || (submitted && !input.username)}"/>
        <small class="p-error" v-if="submitted && !input.username">Please enter name.</small>
        <small class="p-error" v-if="submitted && usernameErr && input.username">Username not found.</small>
      </div>
    <div class="field">
       <label for="password">Password: </label> <br>
       <Password id="password" v-model="input.password" toggleMask :class="{'p-invalid': (submitted && passErr) || (submitted && !input.password)}"/>
       <small class="p-error" v-if="submitted && !input.password">Please enter password.</small>
       <small class="p-error" v-if="submitted && passErr && input.password">Incorrect password.</small>
    </div>
      <Button class="btn btn-outline-dark" type="submit" v-on:click.prevent = "login()">
        Login
      </Button>
      <Button class="btn btn-outline-dark" type="submit" v-on:click.prevent = "onSignUp()">
        Sign Up
      </Button>
    </Dialog>
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
    console.log(sessionUser);
    if(sessionUser){
      this.$router.push('/Home');
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
onSignUp(){
  console.log(this.input);
  action.addUser(this.input);
  this.input.password = "";
  this.input.username = "";
}
},
}
</script>
<style lang="">
    
</style>