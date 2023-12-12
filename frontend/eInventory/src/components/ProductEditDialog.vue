<template>
    <div>
        <button onclick="window.editProd.showModal();">EDIT</button>

            <dialog id="editProd">
                <form action="">

                        <label for="type"> TEST: </label><br>
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
    </div>
</template>
<script lang="ts">

import axios from "axios";
export default {
    data() {
        return {
            products: [],
            asin: "",
            fnsku: "",
            upc: "",
            notes: "",
            name: "",

        }
    },

    methods: {
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
    },
    
}
</script>
<style lang="">
    
</style>