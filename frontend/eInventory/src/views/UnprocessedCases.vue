<template>
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