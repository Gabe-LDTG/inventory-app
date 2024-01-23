<template>
    <div>
        <div class="card">
            <div v-show="displayCreate">
                <form class="createForm">
                    <h2>Create a Product</h2>
                    <div class="errorMSG">Number of Errors: {{ numOfErr }}</div>
                    <p>
                        <label for="type"> Name: </label><br>
                        <input name="name" class="form-control" v-model="name"/><br>
                        <div class="errorMSG">{{ nameErrMSG }}</div>
                    </p>
                    <p>
                        <label for="type"> ASIN: </label><br>
                        <input class="form-control" v-model="asin"/><br>
                    </p>
                    <p>
                        <label for="type"> FNSKU: </label><br>
                        <input class="form-control" v-model="fnsku"/><br>
                        <div class="errorMSG">{{ fnskuErrMSG }}</div>
                    </p>
                    <p>
                        <label for="type"> UPC: </label><br>
                        <input class="form-control" v-model="upc"/><br>
                    </p>
                    <p>
                        <label for="type">Notes: </label><br>
                        <input class="form-control" placeholder="Notes" v-model="notes"/><br>
                    </p>

                    <button type="button" class="submitButton" @click="this.displayCreate = false; clearForm();">Cancel</button>
                    <button type="button" class="submitButton" @click="onSubmit('create', this.name, this.fnsku);">Submit</button>
                </form>
            </div>

            <div class="card-header">
                <h4>
                    Products

                    <button @click="this.displayCreate = true;">Add Product</button>
                </h4>
            </div>
            <div class="card-body">

                <table class="table table-table-bordered">
                    <thead>
                        <tr>
                            <th>#</th>
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
                                <td> <input class="form-control" v-model="product.name"/><br><div class="errorMSG">{{ nameErrMSG }}</div> </td>

                                <td> <input class="form-control" v-model="product.asin"/><br> </td>

                                <td><input class="form-control" v-model="product.fnsku"/><br><div class="errorMSG">{{ fnskuErrMSG }}</div> </td>

                                <td><input class="form-control" v-model="product.upc"/><br> </td>

                                <td><input class="form-control" v-model="product.notes"/></td>

                                <td><button type="button" @click="this.editId = '';">Cancel</button></td>
                                <td><button type="button" @click="this.heldProduct = product; onSubmit('edit', product.name, product.fnsku);">Submit</button></td>
                            </template>

                            <template v-else>
                            <td>{{ index + 1}}</td>
                            <td>{{ product.name }}</td>
                            <td>{{ product.asin }}</td>
                            <td>{{ product.fnsku }}</td>
                            <td>{{ product.upc }}</td>
                            <td>{{ product.notes }}</td>

                            <td><button @click="toggleEdit(product.id); console.log(product.id)">Edit</button></td>

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
// import ProductCreateDialog from '../components/ProductCreateDialog.vue'
// import ProductEditDialog from '../components/ProductEditDialog.vue'
import { reactive, computed } from "vue";
import { Form, Field, ErrorMessage } from 'vee-validate';

export default {
    components :{
/*         Form,
        Field,
        ErrorMessage, */
    },
    data() {
        return {
            asin: "",
            fnsku: "",
            upc: "",
            notes: "",
            name: "",

            asinErrMSG: "",
            fnskuErrMSG: "",
            upcErrMSG: "",
            notesErrMSG: "",
            nameErrMSG: "",

            numOfErr: 0,
            success: 0, 

            products: [],
            //displayProducts: [],
            heldProduct: [],
            specificProduct: [],
            editId: "",
            displayCreate: false,

            //displayCreate: false,
            //displayEdit: false,
            
        }
    },

    mounted() {
        console.log('on mounted');
        this.getProducts();
    },

    methods: {
        //The controller function. Checks whether the database interaction is a CREATE or EDIT. 
        //Then, validates the input before sending the data through the API.
        onSubmit(value: string, name: string, fnsku: string){
            this.success = 0;

            if (value == "create"){
                console.log('CREATE');
                this.numOfErr = this.validateName(name) + this.validateFnskuCreate(fnsku);
                console.log(this.numOfErr);
                if (this.numOfErr == 0){
                    console.log('submitted');
                    this.addProduct();
                    this.clearForm();

                    this.success = 1;
                }
            }

            else if (value == "edit"){
                this.numOfErr = this.validateName(name) + this.validateFnskuEdit(fnsku);
                console.log(this.numOfErr);
                console.log(fnsku);
                if (this.numOfErr == 0){
                    console.log('edited');
                    this.success = 1;
                    this.editProduct(this.heldProduct.id, this.heldProduct.name, this.heldProduct.asin, this.heldProduct.fnsku, this.heldProduct.upc, this.heldProduct.notes)

                }
            }
            return this.success;
        },
        clearForm(){
            this.asin = ""
            this.fnsku = ""
            this.upc = ""
            this.notes = ""
            this.name = ""
        },
        validateName(value: string){
            let isErr = 0;

            // if the name field is empty
            if (!value) {
                this.nameErrMSG = 'Name is a required field';
                console.log(this.name);
                isErr = 1;
            }
            else{
                this.nameErrMSG = '';
                isErr = 0;
            }

            return isErr;
        },
        validateAsin(value: string){},
        validateFnskuCreate(inputFnsku: string){
            let isErr = 0;

            if (inputFnsku != '') {
                for (let i = 0; i < this.products.length; i++) {
                    console.log(this.products[i].fnsku);
                    if (this.products[i].fnsku == inputFnsku){
                        console.log(this.products[i]);
                        this.fnskuErrMSG = "This fnsku is already in use";
                        isErr = 1;
                    }
                }
            }
            if (isErr == 0) {
                this.fnskuErrMSG = '';
            }

            return isErr;
        },
        validateFnskuEdit(inputFnsku: string){
            let isErr = 0;

            if (inputFnsku != '') {
                for (let i = 0; i < this.products.length; i++) {
                    console.log(this.products[i].fnsku);
                    if (this.products[i].fnsku == inputFnsku && this.products[i].id != this.heldProduct.id){
                        console.log(this.products[i]);
                        console.log(this.heldProduct.id); 
                        this.fnskuErrMSG = "This fnsku is already in use";
                        isErr = 1;
                    }
                }
            }
            if (isErr == 0) {
                this.fnskuErrMSG = '';
            }

            return isErr;
        },
        validateUpc(value: string){},
        validateNotes(value: string){},
        getProducts(){
            
            axios.get("http://localhost:5000/products").then(res => {
                this.products = res.data;
                //was trying to separate the data pulled from DB from the data displayed, but it was screwing with validation and wasn't really working anyway
                //this.displayProducts = this.products;
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
                    //setInterval(this.refreshData, 1000);
                }).catch(error => {
                    console.log(error);
                });
                // if ANY fail validation
                this.displayCreate = false;
                alert('Form successfully submitted.')
                setInterval(this.refreshData, 1000);
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
            setInterval(this.refreshData, 1000)
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
            console.log(this.editId);
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
<style lang="css">
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

.errorMSG{
    color: red;
}

</style>