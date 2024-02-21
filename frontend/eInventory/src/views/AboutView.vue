<template>
  <Toast />
    <Card class="flex justify-content-center w-16rem m-3 border-round">
        <template #title>Logout or Add User</template>
        <template #content>
            <Button class="btn btn-outline-dark" type="submit" v-on:click.prevent = "logout()">
                Logout
            </Button> <br><br>
            <Button class="btn btn-outline-dark" type="submit" v-on:click.prevent = "showDialog = true">
                Add User
            </Button>
        </template>
    </Card>

    <Dialog v-model:visible="showDialog" name="add-user-form" class="" header="Add User">
      <div class="field" >
        <label for="username">Username: </label>
        <InputText id="username" v-model="input.username" rows="3" cols="20"/>
        <small class="p-error" v-if="submitted && !input.username">Please enter name.</small>
      </div>
    <div class="field">
       <label for="password">Password: </label> <br>
       <Password id="password" v-model="input.password" toggleMask/>
       <small class="p-error" v-if="submitted && !input.password">Please enter password.</small>
    </div>
    <div class="field">
       <label for="password">Retype Password: </label> <br>
       <Password id="password" v-model="input.retypePassword" toggleMask/>
       <small class="p-error" v-if="submitted && !input.retypePassword">Please reenter password.</small>
       <small class="p-error" v-if="submitted && input.password != input.retypePassword && input.retypePassword">Passwords do not match.</small>
    </div>
      <Button class="btn btn-outline-dark" type="submit" v-on:click.prevent = "showDialog = false">
        Cancel
      </Button>
      <Button class="btn btn-outline-dark" type="submit" v-on:click.prevent = "onSignUp()">
        Sign Up
      </Button>
    </Dialog>
</template>

<script lang="ts">
import action from "../components/utils/axiosUtils";
export default {
data(){
    return{
        input:{
            username: "",
            password: "",
            retypePassword: "",
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

            if(this.input.username && this.input.password && this.input.retypePassword && this.input.password == this.input.retypePassword){
                console.log(this.input);

                action.addUser(this.input);
                this.input.password = "";
                this.input.username = "";
                this.input.retypePassword = "";
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
