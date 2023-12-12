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
                            <input class="form-control" v-model="name"/><br>

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
                <button @click="awesome = !awesome">Toggle</button>

                <h1 v-show="awesome">Vue is awesome!</h1>

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
                            <template v-if="!product.EDIT">
                            <td>{{ product.name }}</td>
                            <td>{{ product.asin }}</td>
                            <td>{{ product.fnsku }}</td>
                            <td>{{ product.upc }}</td>
                            <td>{{ product.notes }}</td>

                            <td><button @click="product.EDIT = true;">Edit</button></td>

                            <td><button class="btn btn-primary" @click="deleteProduct(product.id)">Delete</button></td>
                            </template>

                            <template v-else>
                                <td> <input class="form-control" v-model="product.name"/><br> </td>

                                <td> <input class="form-control" v-model="product.asin"/><br> </td>

                                <td><input class="form-control" v-model="product.fnsku"/><br> </td>

                                <td><input class="form-control" v-model="product.upc"/><br> </td>

                                <td><input class="form-control" placeholder="Notes" v-model="product.notes"/></td>

                                <td><button type="button" @click="product.EDIT = false">Cancel</button></td>
                                <td><button type="button" @click="editProduct(product.id, product.name, product.asin, product.fnsku, product.upc, product.notes)">Submit</button></td>
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

export default {
    components :{
        ProductCreateDialog,
        ProductEditDialog,
    },
    data() {
        return {
            products: [],
            specificProduct: [],
            asin: "",
            fnsku: "",
            upc: "",
            notes: "",
            name: "",
            displayCreate: false,
            displayEdit: false,
            awesome: false,
            
        }
    },

    mounted() {
        console.log('on mounted');
        this.getProducts();
    },

    methods: {
        getProducts(){
            
            axios.get("http://localhost:5000/products").then(res => {
                this.products = res.data
                for (let i = 0; i < this.products.length; i++) {
                this.products[i].EDIT = false;
                }
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
                location.reload();
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
            location.reload();
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
                location.reload();
            }).catch(error => {
                console.log(error);
            });
        }
    },
}
</script>
<style lang="">

</style>