<template>
    <div>
        <div class="card">
            <div v-show="displayCreate">
                <form class="createForm">
                    <h2>Create a Product</h2> <br>
                    <div v-if="numOfErr > 0" class="errorMSG">Number of Errors: {{ numOfErr }}</div>
                    
                    <span class="p-float-label">
                        <InputText id="name" v-model="name"/>
                        <label for="name">Name</label>
                    </span>
                    <div class="errorMSG">{{ nameErrMSG }}</div><br>

                    <span class="p-float-label">
                        <label for="asin"> ASIN: </label>
                        <InputText id="asin" v-model="asin"/>
                    </span><br>

                    <span class="p-float-label">
                        <InputText id="fnsku" v-model="fnsku"/>
                        <label for="fnsku"> FNSKU: </label>
                    </span>
                    <div class="errorMSG">{{ fnskuErrMSG }}</div><br>

                    <span class="p-float-label">
                        <InputText id="upc" v-model="upc"/>
                        <label for="upc"> UPC: </label>
                    </span><br>

                    <span class="p-float-label">
                        <InputText id="notes" v-model="notes"/>
                        <label for="notes">Notes:</label>
                    </span><br>

                    <Button label= "Cancel" type="button" severity="secondary" rounded @click="displayCreate = false; clearForm();"/>
                    <Button label= "Submit" type="button" rounded @click="onSubmit('create', name, fnsku);" />
                </form>
            </div>

            <div class="card-body">
                <DataTable scrollable v-model:editingRows="editingRows" :value="products" editMode="row" dataKey="id" @row-edit-save="onRowEditSave"
                    :pt="{
                        table: { style: 'min-width: 50rem' },
                        column: {
                            bodycell: ({ state }) => ({
                                style:  state['d_editing']&&'padding-top: 0.6rem; padding-bottom: 0.6rem'
                            })
                        }
                    }"
                >
        <template #header>
            <div class="flex justify-content-between flex-wrap">
            <div class="flex align-items-center">
                Products
            </div>

            <div class="flex align-items-center">
                <Button label= "Add Product" size="small" rounded @click="displayCreate = true;" />
            </div>
            </div>
        </template>
            <Column field="name" header="Name">
                <template #editor="{ data, field }">
                    <InputText v-model="data[field]" />
                </template>
            </Column>
            <Column field="asin" header="ASIN">
                <template #editor="{ data, field }">
                    <InputText v-model="data[field]" />
                </template>
            </Column>
            <Column field="fnsku" header="FNSKU">
                <template #editor="{ data, field }">
                    <InputText v-model="data[field]" />
                </template>
            </Column>
            <Column field="upc" header="UPC">
                <template #editor="{ data, field }">
                    <InputText v-model="data[field]" />
                </template>
            </Column>
            <Column field="notes" header="Notes">
                <template #editor="{ data, field }">
                    <InputText v-model="data[field]" />
                </template>
            </Column>
            <Column :rowEditor="true" style="width: 10%; min-width: 8rem" frozen bodyStyle="text-align:center"></Column>
            <Column :exportable="false" style="min-width:8rem">
                    <template #body="slotProps">
                        <!-- <Button icon="pi pi-pencil" outlined rounded class="mr-2" @click="editProduct(slotProps.data)" /> deleteProduct(slotProps.data)-->
                        <Button icon="pi pi-trash" outlined rounded severity="danger" @click="deleteProduct(slotProps.data.id)" />
                    </template>
            </Column>
        </DataTable>

                <!-- <table class="table table-table-bordered">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Name</th>
                            <th>ASIN</th>
                            <th>FNSKU</th>
                            <th>UPC</th>
                            <th>Notes</th>
                            <th>30 Day Storage Cost</th>
                            <th>Amz Fees Cost</th>
                            <th>amz_fulfilment_cost</th>
                            <th>bag_cost </th>
                            <th>bag_size </th>
                            <th>box_cost </th>
                            <th>box_size </th>
                            <th>box_type </th>
                            <th>date_added </th>
                            <th>do_we_carry </th>
                            <th>holiday_storage_cost </th>
                            <th>in_shipping_cost </th>
                            <th>item_cost </th>
                            <th>item_num </th>
                            <th>labor_cost </th>
                            <th>map </th>
                            <th>meltable </th>
                            <th>misc_cost </th>
                            <th>out_shipping_cost </th>
                            <th>price_2021 </th>
                            <th>price_2022 </th>
                            <th>price_2023 </th>
                            <th>process_time_per_unit_sec </th>
                            <th>total_cost </th>
                            <th>total_holiday_cost </th>
                            <th>vendor </th>
                            <th>weight_lbs </th> 
                        </tr>
                    </thead>
                    <tbody>
                        <template v-for="(product, index) in products" :key="index">

                        <tr>
                            <template v-if="editId === product.id">
                                <td>{{ index + 1}}</td>

                                <td><input class="form-control" v-model="product.name"/><br><div class="errorMSG">{{ nameErrMSG }}</div> </td>

                                <td><input class="form-control" v-model="product.asin"/><br> </td>

                                <td><input class="form-control" v-model="product.fnsku"/><br><div class="errorMSG">{{ fnskuErrMSG }}</div> </td>

                                <td><input class="form-control" v-model="product.upc"/><br> </td>

                                <td><input class="form-control" v-model="product.notes"/></td>

                                <span class="p-buttonset">
                                    <Button label="Cancel" type="button" @click="editId = '';" />
                                    <Button label="Submit" type="button" @click="heldProduct = product; onSubmit('edit', product.name, product.fnsku);"/>
                                </span>
                            </template>

                            <template v-else>
                            <td>{{ index + 1}}</td>
                            <td>{{ product.name }}</td>
                            <td>{{ product.asin }}</td>
                            <td>{{ product.fnsku }}</td>
                            <td>{{ product.upc }}</td>
                            <td>{{ product.notes }}</td>
                            <td>{{ product['30_day_storage_cost'] }}</td>
                            <td>{{ product.amz_fees_cost }}</td>
                            <td>{{ product.amz_fulfilment_cost }}</td>
                            <td>{{ product.bag_cost }}</td>
                            <td>{{ product.bag_size }}</td>
                            <td>{{ product.box_cost }}</td>
                            <td>{{ product.box_size }}</td>
                            <td>{{ product.box_type }}</td>
                            <td>{{ product.date_added }}</td>
                            <td>{{ product.do_we_carry }}</td>
                            <td>{{ product.holiday_storage_cost }}</td>
                            <td>{{ product.in_shipping_cost }}</td>
                            <td>{{ product.item_cost }}</td>
                            <td>{{ product.item_num }}</td>
                            <td>{{ product.labor_cost }}</td>
                            <td>{{ product.map }}</td>
                            <td>{{ product.meltable }}</td>
                            <td>{{ product.misc_cost }}</td>
                            <td>{{ product.out_shipping_cost }}</td>
                            <td>{{ product.price_2021 }}</td>
                            <td>{{ product.price_2022 }}</td>
                            <td>{{ product.price_2023 }}</td>
                            <td>{{ product.process_time_per_unit_sec }}</td>
                            <td>{{ product.total_cost }}</td>
                            <td>{{ product.total_holiday_cost }}</td>
                            <td>{{ product.vendor }}</td>
                            <td>{{ product.weight_lbs }}</td> 

                            <span class="p-buttonset">
                                <Button label="Edit" @click="toggleEdit(product.id); console.log(product.id)" />

                                <Button label="Delete" class="btn btn-primary" @click="deleteProduct(product.id)" />
                            </span>
                            </template>
                        </tr>

                    </template>
                    </tbody>
                </table> -->


            </div>
        </div>
    </div>
</template>
<script lang="ts">
// import { assertExpressionStatement } from '@babel/types';
import axios from "axios";
import validate from "../components/Validator.vue";
import action from "../components/utils/axiosUtils";
import ProductTable from "../components/ProductTable.vue";
import { createApp, reactive, computed } from "vue";

//  import { Form, Field, ErrorMessage } from 'vee-validate';

//REFERENCE FOR PAGES
//https://codesandbox.io/s/6vr97h?file=/src/App.vue:3297-3712

export default {
    data() {
        return {
            asin: "",
            fnsku: "",
            upc: "",
            notes: "",
            name: "",
            db30_day_storage_cost: "",
            amz_fees_cost: "",
            amz_fulfilment_cost: "",
            bag_cost: "",
            bag_size: "",
            box_cost: "",
            box_size: "",
            box_type: "",
            date_added: "",
            do_we_carry: "",
            holiday_storage_cost: "",
            in_shipping_cost: "",
            item_cost: "",
            item_num: "",
            labor_cost: "",
            map: "",
            meltable: "",
            misc_cost: "",
            out_shipping_cost: "",
            price_2021: "",
            price_2022: "",
            price_2023: "",
            process_time_per_unit_sec: "",
            total_cost: "",
            total_holiday_cost: "",
            vendor: "",
            weight_lbs: "",

            asinErrMSG: "",
            fnskuErrMSG: "",
            upcErrMSG: "",
            notesErrMSG: "",
            nameErrMSG: "",

            numOfErr: 0,
            success: 0, 

            products: [] as any[],
            //displayProducts: [],
            heldProduct: "" as any,
            specificProduct: [],
            columns: [] as any[],
            editingRows: [] as any[],

            editId: "",
            displayCreate: false,
        }
    },

    mounted() {
        console.log('on mounted');
        this.getProducts();
    },

    methods: {
        onRowEditSave(event: any) {
            let { newData, index } = event;

            this.products[index] = newData;
            console.log(newData);

            this.editProduct(newData);

            //this.onSubmit('edit', newData.name, newData.fnsku);
        },
        //The controller function. Checks whether the database interaction is a CREATE or EDIT. 
        //Then, validates the input before sending the data through the API.
        onSubmit(value: string, name: string, fnsku: string){
            this.success = 0;

            //If the user is submitting a new product, the fnsku validation 
            //function for newly created products will be used
            if (value == "create"){
                //console.log('CREATE');
                this.numOfErr = this.validateName(name) + this.validateFnskuCreate(fnsku);
                //console.log(this.numOfErr);
                if (this.numOfErr == 0){
                    console.log('submitted');
                    this.addProduct();
                    this.clearForm();

                    this.success = 1;
                }
            }

            //If the user is submitting a new product, the fnsku validation 
            //function for editted products will be used
            else if (value == "edit"){
                this.numOfErr = this.validateName(name) + this.validateFnskuEdit(fnsku);
                //console.log(this.numOfErr);
                //console.log(fnsku);
                if (this.numOfErr == 0){
                    console.log('edited');
                    this.success = 1;
                    this.editProduct(this.heldProduct.id)

                }
            }
            return this.success;
        },

        // Clears the form when a user clicks cancel on the create product form
        clearForm(){
            this.asin = ""
            this.fnsku = ""
            this.upc = ""
            this.notes = ""
            this.name = ""
            this.nameErrMSG = ""
            this.numOfErr = 0
            this.fnskuErrMSG = ""

        },

        //Checks to make sure the name field is not empty
        validateName(value: string){
            let isErr = 0;

            // if the name field is empty
            if (!value) {
                this.nameErrMSG = 'Name is a required field';
                //console.log(this.name);
                isErr = 1;
            }
            else{
                this.nameErrMSG = '';
                isErr = 0;
            }

            return isErr;
        },

        validateAsin(value: string){},

        //Checks all available products to make sure the fnsku being entered has not already been used
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

        //Checks to make sure the newly edited fnsku does not already exist
        //Differs from validateFnskuCreate by ignoring the fnsku if it is the product's own fnsku
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

        //Pulls all the products from the database using API
        getProducts(){
            
            axios.get("http://localhost:5000/products").then(res => {
                this.products = res.data;

                this.columns = Object.keys(this.products[0]);
                //was trying to separate the data pulled from DB from the data displayed, but it was screwing with validation and wasn't really working anyway
                //this.displayProducts = this.products;

                console.log("Product List Recieved\n",this.products);
                console.log("Keys", Object.keys(this.products[1]));
            })
        },

        //Used to search for a specific product by Id
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

        //Posts a newly added product into the database using API
        addProduct(){
            
            //console.log("UPC ______ ", this.upc);
            //console.log(this.fnsku);
                axios.post("http://localhost:5000/products/create", {
                name: this.name,
                asin: this.asin,
                fnsku: this.fnsku,
                upc: this.upc,
                notes: this.notes,

                }).then((res) => {
                    //location.reload();
                    //setInterval(this.refreshData, 1000);

                    // if ANY fail validation
                    this.displayCreate = false;
                    alert('Form successfully submitted.')
                    this.refreshData();
                }).catch(error => {
                    console.log(error);
                });
        },

        //Removes a product from the database using API
        deleteProduct(id: string){
            //console.log(id);
            if(confirm("Do you really want to delete?")){
                axios.delete("http://localhost:5000/products/"+id)
                .then(res => {
                    //location.reload();
                    this.refreshData();
                })
                .catch(error => {
                    console.log(error);
                })
            }
        },

        //Updates an already existing product in the database using API
        editProduct(value: any){

            axios.put("http://localhost:5000/products/"+value.id, {
                name: value.name,
                asin: value.asin,
                fnsku: value.fnsku,
                upc: value.upc,
                notes: value.notes,

            }).then((res) => {
                //location.reload();
                this.refreshData();
                this.editId = '';
            }).catch(error => {
                console.log(error);
            });
        },

        // Used to allow for inline editing
        toggleEdit(id: string){
            this.editId = id;
            console.log(this.editId);
        },

        // Uses API to grab the list of products
        // Used to reflect the changes when a user edits the products in the database in any way
        refreshData () {
        // fetch data
        this.getProducts()
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
  background-color: black;

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