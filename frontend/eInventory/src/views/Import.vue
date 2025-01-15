<template lang="">
    <div v-show="loading"><Message :closable="false" icon="pi pi-spin pi-spinner" iconPos="right"> {{actionMSG}} </Message></div>
    <FileUpload mode="basic" customUpload :maxFileSize="1000000" label="Import Raw Product Key" chooseLabel="Import Raw Product Key" class="mr-2 inline-block" @uploader="rawProductKeyUpload"/>
    <FileUpload mode="basic" customUpload :maxFileSize="1000000" label="Import Processed Product Key" chooseLabel="Import Processed Product Key" class="mr-2 inline-block" @uploader="procProductKeyUpload"/>
    <FileUpload mode="basic" customUpload :maxFileSize="1000000" label="Import Processed Product List" chooseLabel="Import Processed Product List" class="mr-2 inline-block" @uploader="processProductListUpload"/>
    <FileUpload mode="basic" customUpload :maxFileSize="1000000" label="Import Unprocessed Product List" chooseLabel="Import Unprocessed Product List" class="mr-2 inline-block" @uploader="unprocessedProductListUpload"/>
    <!-- <Button label="Purge Products" text @click="purgeProducts"/> -->
    <!-- <Button label="Purge Cases" text @click="purgeCases"/> -->
    <!-- <div>
        <form enctype="multipart/form-data">
            <input type="file" accept=".csv" @change="handleFileUpload( $event )"/>

            <button type="button" @click="addProduct()"> Submit </button>
        </form>
        <p v-show="loading">LOADING</p>
    </div>
    <table v-if="parsed" style="width: 100%;">
        <thead>
            <tr>
                <th v-for="(header, key) in content.meta.fields"
                    v-bind:key="'header-'+key">
                    {{ header }}
                </th>
            </tr>
        </thead>
        <tbody>
            <tr v-for="(row, rowKey) in content.data"
                v-bind:key="'row-'+rowKey">
                    <td v-for="(column, columnKey) in content.meta.fields"
                        v-bind:key="'row-'+rowKey+'-column-'+columnKey">
                            {{ content.data[rowKey][column] }}
                    </td>
            </tr>
        </tbody>
    </table> -->
</template>
<script lang="ts">
import Papa from "papaparse";
import axios from "axios";
import importAction from "../components/utils/importUtils";
import action from "@/components/utils/axiosUtils";

export default {
    data() {
        return {
            file: '',
            content: [],
            testContent: [],
            uContent: [] as any[],
            parsed: false,
            lines: '',
            loading: false,
            count: 0,
            total: 0,
            percentage: "",
            actionMSG: "",
            recipes: [] as any[],
        }
    },
    methods: {

        async procProductKeyUpload(event: any) {
            try {
                this.loading = true;
                await importAction.onUpload(event, 'Processed Product Key');
                this.loading = false;
            } catch (error) {
                console.log(error);
            }
        },
        async rawProductKeyUpload(event: any) {
            try {
                this.loading = true;
                this.actionMSG = "Uploading";
                await importAction.onUpload(event, 'Raw Product Key');

                this.loading = false;
                this.actionMSG = "";
                
            } catch (error) {
                console.log(error);
            }
        },
        async processProductListUpload(event: any){
            try {
                
            } catch (error) {
                console.log(error);
            }
            this.loading = true;
            await importAction.onUpload(event, 'Processed Product List');
            this.loading = false;
        },
        async unprocessedProductListUpload(event: any){
            try {
                
            } catch (error) {
                console.log(error);
            }
            this.loading = true;
            await importAction.onUpload(event, 'Unprocessed Product List');
            this.loading = false;
        },
        /* async purgeProducts(){
            try {
                let content = [];
                this.actionMSG = "Deleting "+this.percentage+"% complete"
                this.loading = true;
                let products = await action.getProducts();
                console.log(products);
                console.log(products.length);
                this.total = products.length;

                console.log(products.product_id)

                //await action.batchDeleteProduct(products.product_id)

                for(let i=0; i<products.length; i++){
                    let nuf = (i/this.total)*100;
                    this.percentage = nuf.toFixed(1);
                    content.push(products[i].product_id);
                    //await action.deleteProduct(products[i].product_id);
                } 
                console.log("CONTENT ",content);

                await action.batchDeleteProduct(content);
                content = [];

                this.loading = false;
                this.actionMSG = "";
            } catch (error) {
                console.log(error);
            }
        }, */
        /* async purgeCases(event: any){
            try {
                let content = [];
                this.loading = true;
                let cases = await action.getCases();
                console.log(cases);

                this.total = cases.length;

                for(let i=0; i<cases.length; i++){
                    let nuf = (i/this.total)*100;
                    this.percentage = nuf.toFixed(1);
                    //await action.deleteCase(cases[i].case_id);
                    content.push(cases[i].case_id);
                }

                console.log(content);
                await action.batchDeleteCases(content);
                content = [];
                this.loading = false;
            } catch (error) {
                console.log(error);
            }
        }, */
    }
}
</script>
<style lang="">
    
</style>