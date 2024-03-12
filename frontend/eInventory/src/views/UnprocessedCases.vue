<template>
    <!-- <div>
        <div class="card">
            <div class="card-header">
                <h4>
                    Unprocessed Cases

                    <button onclick="window.dialog.showModal();">Add Case</button>

                    <dialog id="dialog">
                        <form action="">

                            <label for="type">Product: </label><br>
                            <select v-model="product">
                                <option disabled value="">Please select one</option>
                                <option v-for="p in this.products" :value="p.id">{{p.name}} - {{ p.upc }}</option>
                            </select><br>

                            <label for="type">Date received: </label><br>
                            <input type="date" class="form-control" v-model="datereceived"/><br>

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
                            <th>Units Per Box</th>
                            <th>Date received</th>
                            <th>Notes</th>
                        </tr>
                    </thead>
                    <tbody>
                        <template v-for="(c, index) in this.cases" :key="index">
                            <tr>
                                <template v-if="!c.EDIT">
                                    <td>{{ c.name }}</td>
                                    <td>{{ c.units_per_case }}</td>
                                    <td>{{ c.date_received }}</td>
                                    <td>{{ c.notes }}</td>

                                    <td><button @click="c.EDIT = true; console.log(c.name)">Edit</button></td>

                                    <td><button class="btn btn-primary" @click="deleteCase(c.id)">Delete</button></td>
                                </template>

                                <template v-else>
                                    <td><select v-model="this.displayCases[index].product_id">
                                        <option v-for="p in this.products" :value="p.id">{{p.name}} - {{ p.upc }}</option>
                                    </select><br></td>

                                    <td><input type="number" class="form-control" v-model="this.displayCases[index].units_per_case"/><br></td>

                                    <td><input type="date" class="form-control" v-model="this.displayCases[index].date_received"/><br></td>

                                    <td><input class="form-control" v-model="this.displayCases[index].notes"/><br></td>

                                    <td><button type="button" @click="c.EDIT = false">Cancel</button></td>
                                    <td><button type="button" @click="editCase(c.id, this.displayCases[index].product_id, this.displayCases[index].units_per_case, this.displayCases[index].notes, this.displayCases[index].date_received)">Submit</button></td>
                                </template>
                            </tr>   
                        </template>
                    </tbody>
                </table>
            </div>
        </div>
    </div> -->
    <CaseList display-value="unprocessed"/>
</template>
<script lang="ts">
// import { assertExpressionStatement } from '@babel/types';
import { ref } from "vue";
import axios from "axios";
import CaseList from '../components/CasesList.vue'

//Want to work on making the dialog box its own vue file for more organization
//import ProcessedDialog from "@/components/ProcessedDialog.vue";

export default {
    components: {
        //ComponentA,
        CaseList
    },
    /* data() {
        return {
            cases: [],
            displayCases: [],
            products: [],
            selected: "",
            product: "",
            unitspc: "",
            note: "",
            datereceived: new Date(),
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
                this.cases = res.data;
                this.displayCases = this.cases;

                for (let i = 0; i < this.cases.length; i++) {
                this.cases[i].EDIT = false;
                }
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
                date_received: this.datereceived,
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
        },
        editCase(id: string, product_id: string, units_per_case: string, notes: string, date_received: string){

            axios.put("http://localhost:5000/cases/"+id, {
                product_id: product_id,
                units_per_case: units_per_case,
                notes: notes,
                date_received: date_received,

            }).then((res) => {
                //console.log(product_id);
                location.reload();
            }).catch(error => {
                console.log(error);
            });
        },
    }, */
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
</style>