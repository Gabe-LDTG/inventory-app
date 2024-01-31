<template>
    <Dialog v-model:visible="showDialog" name="login-form" class="" header="Login">
      <div class="field" >
        <label for="username">Username: </label>
        <InputText id="username" v-model="input.username" rows="3" cols="20" />
      </div>
    <div class="field">
       <label for="password">Password: </label> <br>
       <Password id="password" v-model="input.password" toggleMask />
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
}
},
methods:{
login(){
  //make sure username OR password are not empty
  /* if(this.input.username != "" || this.input.password != ""){
    console.log("authenticated")
    this.$router.push('/Home')
  }else{
    console.log("Username and Password can not be empty")
  } */

  action.validatePassword(this.input);
},
onSignUp(){
  console.log(this.input);
  action.addUser(this.input);
}
},
}
</script>
<style lang="">
    
</style>