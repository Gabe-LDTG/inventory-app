<template>

    <CaseList display-value="processed"/>
</template>
<script lang="ts">
// import { assertExpressionStatement } from '@babel/types';
import { ref } from "vue";
import axios from "axios";
//import ComponentA from './ProductList.vue'
import CaseList from '../components/CasesList.vue'

//Want to work on making the dialog box its own vue file for more organization
//import ProcessedDialog from "@/components/ProcessedDialog.vue";

export default {
    components: {
        //ComponentA,
        CaseList
    },
}
</script>
<style lang="css">
.card-header {
  border: 2px;
  border-style: solid;
  border-radius: 5px;
}
h4 {
    display: flex;
    justify-content: space-between;  
}

button {
    text-align: right;
}

.enter {
    display: flex;
    align-content: center;
}

.createForm {
  width: 400px;
  margin: 0 auto;
  position: absolute;
  top: 50px;
  z-index: 10000;
  padding: 30px;
  margin-top: 100px;
  border-radius: 20px;
  display: inline-block;
  background-color: gray;

}

input {
  border: none;
  outline: none;
  border-bottom: 1px solid #ddd;
  font-size: 1em;
  padding: 5px 0;
  margin: 10px 0 5px 0;
  width: 100%;
}

.submitButton {
  background-color: green;
  padding: 10px 20px;
  margin-top: 10px;
  border: none;
  color: white;
  border-radius: 20px;
}
</style>