<template>
    <div>
        <div class="card">
            <div class="card-header">
                <h4>
                    Products

                    <button onclick="window.dialog.showModal();">Add Product</button>

                    <dialog id="dialog">
                        <form action="">

                            <label for="type"> Name: </label><br>
                            <input class="form-control" v-model="name" required/><br>

                            <label for="type"> ASIN: </label><br>
                            <input class="form-control" v-model="asin"/><br>

                            <label for="type"> FNSKU: </label><br>
                            <input class="form-control" v-model="fnsku"/><br>

                            <label for="type"> UPC: </label><br>
                            <input class="form-control" v-model="upc"/><br>

                            <label for="type">Notes: </label><br>
                            <input class="form-control" placeholder="Notes" v-model="notes"/><br>

                        </form>
                    <form method="dialog">
                        <button>Close</button>

                        <button class="btn btn-primary" @click="addProduct">Add</button>
                    </form>

                    </dialog>

                </h4>
            </div>
            <div class="card-body">

                <table class="table table-table-bordered">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>ASIN</th>
                            <th>FNSKU</th>
                            <th>UPC</th>
                            <th>Notes</th>
                        </tr>
                    </thead>
                    <tbody>
                        <template v-for="(product, index) in this.products" :key="index">

                        <tr>
                            <template v-if="this.editId === product.id">
                                <td> <input class="form-control" v-model="displayProducts[index].name" required/><br> </td>

                                <td> <input class="form-control" v-model="displayProducts[index].asin"/><br> </td>

                                <td><input class="form-control" v-model="displayProducts[index].fnsku"/><br> </td>

                                <td><input class="form-control" v-model="displayProducts[index].upc"/><br> </td>

                                <td><input class="form-control" v-model="displayProducts[index].notes"/></td>

                                <td><button type="button" @click="this.editId = '';">Cancel</button></td>
                                <td><button type="button" @click="editProduct(product.id, displayProducts[index].name, displayProducts[index].asin, displayProducts[index].fnsku, displayProducts[index].upc, displayProducts[index].notes)">Submit</button></td>
                            </template>

                            <template v-else>
                            <td>{{ product.name }}</td>
                            <td>{{ product.asin }}</td>
                            <td>{{ product.fnsku }}</td>
                            <td>{{ product.upc }}</td>
                            <td>{{ product.notes }}</td>

                            <td><button @click="toggleEdit(product.id);">Edit</button></td>

                            <td><button class="btn btn-primary" @click="deleteProduct(product.id)">Delete</button></td>
                            </template>
                        </tr>

                    </template>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</template>
<script lang="ts">
// import { assertExpressionStatement } from '@babel/types';
import axios from "axios";
import ProductCreateDialog from '../components/ProductCreateDialog.vue'
import ProductEditDialog from '../components/ProductEditDialog.vue'
import useVuelidate from '@vuelidate/core'
import {required} from '@vuelidate/validators'
import { reactive } from "vue";

const formData = reactive({
    asin: "",
    fnsku: "",
    upc: "",
    notes: "",
    name: "",
})

const rules = {
    asin: {},
    fnsku: {},
    upc: {},
    notes: {},
    name: { required },
}

const v$ = useVuelidate(rules, formData);

const submitForm = async () => {
    const result = await v$.value.$validate();
    alert("Success, form submitted!!");


}

export default {
    components :{
        ProductCreateDialog,
        ProductEditDialog,
    },
    data() {
        return {
            products: [],
            displayProducts: [],
            specificProduct: [],
            editId: "",
            asin: "",
            fnsku: "",
            upc: "",
            notes: "",
            name: "",
            interval: '',

            //displayCreate: false,
            //displayEdit: false,
            
        }
    },

/*     created () {
    this.interval = setInterval(this.refreshData, 1000)
    }, */

    mounted() {
        console.log('on mounted');
        this.getProducts();
    },

/*     updated () {
    this.interval = setInterval(this.refreshData, 1000)
    }, */

    methods: {
        getProducts(){
            
            axios.get("http://localhost:5000/products").then(res => {
                this.products = res.data;
                this.displayProducts = this.products;
                console.log(this.products);
            })
        },
        addProduct(){
            axios.post("http://localhost:5000/products/create", {
                name: this.name,
                asin: this.asin,
                fnsku: this.fnsku,
                upc: this.upc,
                notes: this.notes,

            }).then((res) => {
                //location.reload();
                this.interval = setInterval(this.refreshData, 1000);
            }).catch(error => {
                console.log(error);
            });
        },
        deleteProduct(id: string){
            console.log(id);
            if(confirm("Do you really want to delete?")){
                axios.delete("http://localhost:5000/products/"+id)
                .catch(error => {
                    console.log(error);
                })
            }
            //location.reload();
            this.interval = setInterval(this.refreshData, 1000)
        },
        getProductById(id: string){
            //console.log(id);
            axios.get("http://localhost:5000/products/"+id)
            .then(res => {
                this.specificProduct = res.data,
                console.log(this.specificProduct);
            })
            .catch(error => {
                console.log(error);
            })
        },
        editProduct(id: string, name: string, asin: string, fnsku: string, upc: string, notes: string){

            axios.put("http://localhost:5000/products/"+id, {
                name: name,
                asin: asin,
                fnsku: fnsku,
                upc: upc,
                notes: notes,

            }).then((res) => {
                //location.reload();
                this.refreshData;
                this.editId = '';
            }).catch(error => {
                console.log(error);
            });
        },
        toggleEdit(id: string){
            this.editId = id;
            //console.log(this.editId);
        },
        refreshData () {
        // fetch data
        axios.get("http://localhost:5000/products")
        .then(response => {
            this.products = response.data
        })

  }
        /* onCancel(index: string){
            this.displayProducts[index].name = this.products[index].name;
            this.displayProducts[index].asin = this.products[index].asin;
            this.displayProducts[index].fnsku = this.products[index].fnsku;
            this.displayProducts[index].upc = this.products[index].upc;
            this.displayProducts[index].notes = this.products[index].notes;
        }, */
    },
}
</script>
<style lang="">

</style>