<template>
    <div>
        <div class="card">
            <div class="card-header">
                <h4>
                    Unprocessed Cases

                    <button onclick="window.dialog.showModal();">Add Case</button>

                    <dialog id="dialog">
                        <form action="">

                            <label for="type">Product: </label><br>
                            <select v-model="product">
                                <option v-for="p in this.products" :value="p.id">{{p.name}} - {{ p.upc }}</option>
                            </select><br>

                            <label for="type">Date Recieved: </label><br>
                            <input type="date" class="form-control" v-model="daterecieved"/><br>

                            <label for="type">Notes: </label><br>
                            <input class="form-control" placeholder="Notes" v-model="note"/><br>

                            <label for="type">Units Per Case: </label><br>
                            <input type="number" class="form-control" placeholder="Number" v-model="unitspc"/><br>
                        </form>
                    <form method="dialog">
                        <button>Close</button>

                        <button class="btn btn-primary" @click="addCase">Add</button>
                    </form>
                    </dialog>

                </h4>
            </div>
            <div class="card-body">

                <table class="table table-table-bordered">
                    <thead>
                        <tr>
                            <th>Product Name</th>
                            <th>Units Per Case</th>
                            <th>Date Recieved</th>
                            <th>Notes</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="(c, index) in this.cases" :key="index">
                            <td>{{ c.name }}</td>
                            <td>{{ c.units_per_case }}</td>
                            <td>{{ c.date_recieved }}</td>
                            <td>{{ c.notes }}</td>
                            <td><button class="btn btn-primary" @click="deleteCase(c.id)">Delete</button></td>
                        </tr>   
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</template>
<script lang="ts">
// import { assertExpressionStatement } from '@babel/types';
import { ref } from "vue";
import axios from "axios";

//Want to work on making the dialog box its own vue file for more organization
//import UnprocessedDialog from "@/components/UnprocessedDialog.vue";

//const selected = ref('A')

export default {
    data() {
        return {
            cases: [],
            products: [],
            selected: "",
            product: [],
            unitspc: "",
            note: "",
            daterecieved: Date(),
            id: "",

        }
    },

    mounted() {
        console.log('on mounted');
        this.getCases();
        this.getProducts();
    },

    methods: {
        getCases(){
            
            axios.get("http://localhost:5000/cases/unprocessed").then(res => {
                this.cases = res.data
                console.log(this.cases);
            })
        },
        getProducts(){
            axios.get("http://localhost:5000/products/unprocessed").then(res => {
                this.products = res.data
                console.log(this.products);
            })
        },
        addCase(){
            //console.log(this.product);
            axios.post("http://localhost:5000/cases/create", {
                product_id: this.product,
                units_per_case: this.unitspc,
                notes: this.note,
                date_recieved: this.daterecieved,

            }).then((res) => {
                location.reload();
            }).catch(error => {
                console.log(error);
            });
        },
        deleteCase(id: string){
            console.log(id);
            if(confirm("Do you really want to delete?")){
                axios.delete("http://localhost:5000/cases/"+id)
                .catch(error => {
                    console.log(error);
                })
            }
            location.reload();
        }
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
table, .table-table-bordered, tr, th, td{
    border: 1px;
}

tr{
    border: 1px;
}

button {
    text-align: right;
}

.enter {
    display: flex;
    align-content: center;
}
</style>