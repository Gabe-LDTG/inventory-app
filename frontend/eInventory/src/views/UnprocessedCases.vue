<template>
    <div>
        <div class="card">
            <div class="card-header">
                <h4>
                    Cases
                    <RouterLink to="/cases/create" class="btn btn-primary float-end">
                        Add Case
                    </RouterLink>
                </h4>
            </div>
            <div class="card-body">
  
                <table class="table table-table-bordered">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Name</th>
                            <th>Units Per Case</th>
                            <th>Quantity</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="(c, index) in this.cases" :key="index">
                            <td>{{ c.id }}</td>
                            <td>{{ c.name }}</td>
                            <td>{{ c.units_per_case }}</td>
                            <td>{{ c.qty }}</td>
                        </tr>   
                    </tbody>
                </table>
            </div>
        </div>
    </div>
  </template>
  <script lang="ts">
  // import { assertExpressionStatement } from '@babel/types';
  import axios from "axios";
  
  export default {
    data() {
        return {
            cases: []
        }
    },
  
    mounted() {
        console.log('on mounted');
        this.getCases();
    },
  
    methods: {
        getCases(){
            
            axios.get("http://localhost:5000/cases/unprocessed").then(res => {
                this.cases = res.data
                console.log(this.cases);
            })
        }
    },
  }
  </script>
  <style lang="">
  
  </style>