<template>
    <div>
        <div class="card">
            <div v-show="displayCreate">
                <div class="createForm">
                    <h2>Create a Product</h2>
                    <p>
                        <label for="type"> Name: </label><br>
                        <input class="form-control" v-model="state.name"/><br>
                        <span v-if="v$.name.$error">
                            {{ v$.name.$errors[0].$message }}
                        </span> <br>
                    </p>
                    <p>
                        <label for="type"> ASIN: </label><br>
                                <input class="form-control" v-model="state.asin"/><br>
                    </p>
                    <p>
                        <label for="type"> FNSKU: </label><br>
                                <input class="form-control" v-model="state.fnsku"/><br>
                    </p>
                    <p>
                        <label for="type"> UPC: </label><br>
                                <input class="form-control" v-model="state.upc"/><br>
                    </p>
                    <p>
                        <label for="type">Notes: </label><br>
                                <input class="form-control" placeholder="Notes" v-model="state.notes"/><br>
                    </p>

                    <button class="submitButton" @click="this.displayCreate = false;">Cancel</button>
                    <button class="submitButton" @click="addProduct">Submit</button>
                </div>
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
                                <td> <input class="form-control" v-model="displayProducts[index].name"/><br> </td>

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
import useValidate from '@vuelidate/core'
import {
    required,
    helpers,

} from '@vuelidate/validators'
import { reactive, computed } from "vue";

export default {
    setup() {
        const state = reactive({
            asin: "",
            fnsku: "",
            upc: "",
            notes: "",
            name: "",
        });
        const rules = computed(() => {
            return{
                asin: {},
                fnsku: {},
                upc: {},
                notes: {},
                name: { required },
            };
        });

    const v$ = useValidate(rules, state)

    return { state, v$ }
 },
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
        getProducts(){
            
            axios.get("http://localhost:5000/products").then(res => {
                this.products = res.data;
                this.displayProducts = this.products;
                console.log(this.products);
            })
        },
        addProduct(){
            this.v$.$validate() // checks all inputs
            if (!this.v$.$error) {
                axios.post("http://localhost:5000/products/create", {
                name: this.state.name,
                asin: this.state.asin,
                fnsku: this.state.fnsku,
                upc: this.state.upc,
                notes: this.state.notes,

                }).then((res) => {
                    //location.reload();
                    setInterval(this.refreshData, 1000);
                }).catch(error => {
                    console.log(error);
                });
                // if ANY fail validation
                this.displayCreate = false;
                alert('Form successfully submitted.')
            } else {
                alert('Form failed validation')
            }
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

</style>