<template lang="">
    <div>
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
    </table>
</template>
<script lang="ts">
import Papa from 'papaparse';
import axios from "axios";
import cleaning from '../components/DataCleaning.vue'

export default {
    data() {
        return {
            file: '',
            content: [],
            testContent: [],
            uContent: [],
            parsed: false,
            lines: '',
            loading: false,
        }
    },
    methods: {
        /* onFileChange(e) {
            var files = e.target.files || e.dataTransfer.files;
            if (!files.length) return;
            this.createInput(files[0]);
        },
        createInput(file) {
            let promise = new Promise((resolve, reject) => {
                var reader = new FileReader();
                var vm = this;
                reader.onload = e => {
                resolve((vm.fileinput = reader.result));
                };
                reader.readAsText(file);
            });

            promise.then(
                result => {
                // handle a successful result 
                //console.log(this.fileinput);
                this.lines = this.fileinput;
                this.lines = this.lines.substring(this.lines.indexOf("\n") + 1);
                // cut the first line:
                //console.log("NEW STUFF--------------------------")
                //console.log( this.lines );

                this.parseFile();

                },
                error => {
                //handle an error
                console.log(error);
                }
            );
        }, */
/*         dataCleaning(d){
            console.log("CLEANING __________________________________________")
            console.log(d);
            console.log(d.data);
            let loopCount = d.data.length;
            console.log("LOOP COUNT");
            console.log(loopCount);

            for (let i = 0; i < loopCount; i++) {
                console.log("IN FOR LOOP");
                //console.log(d.data[i].Title);
                if(d.data[i].Title = '' || !d.data[i].Title){
                    console.log(i);
                    d.data.splice(i,1);
                }
                //console.log(v);
            }
            //d.data.splice(1,1);
            console.log("DATA AFTER LOOP");
            console.log(d.data);
        }, */

        handleFileUpload( event ){
            this.file = event.target.files[0];
            console.log(event.target.files[0]);
            this.parseFile();
            //this.formatFile();
        },
       /*  formatFile(){
            Papa.parse( this.file, {
                header: true,
                skipEmptyLines: true,
                //preview: 10,
                complete: function( results ){
                    //console.log(results);
                    this.testContent = results;
                    console.log(this.testContent);
                    //this.dataCleaning(this.content);
                    this.parsed = true;
                    return results;
                }.bind(this)
            } );
            Papa.unparse( this.testContent);
            console.log(this.testContent);

        }, */
        /* parseFile(){
            this.loading = true;
            Papa.parse( this.file, {
                header: true,
                skipEmptyLines: true,
                //preview: 10,
                complete: function( results ){
                    //console.log(results);
                    this.content = results;
                    console.log(this.content);
                    //this.dataCleaning(this.content);
                    this.parsed = true;
                    this.loading = false;
                    return results;
                }.bind(this)
            } );
        }, */
        parseFile(){
            this.loading = true;
            Papa.parse( this.file, {
                header: false,
                skipEmptyLines: true,
                //preview: 10,
                complete: function( results ){
                    for (let i = 2; i < results.data.length; i++) { // Notice that i changed i to 2, so that we skip the line 0 and 1.
                        let tradehistory = {
                        Date: results.data[i][0],
                        Side: results.data[i][1],
                        };
                        this.loading = false;
                        this.content.push(tradehistory);
                    }
                    console.log("Parsed: k", results.data);
                    console.log(this.content);
                }.bind(this)
            } );
        },
        unparseFile(){
            this.uContent = Papa.unparse( this.content);
            this.uContent = this.uContent.substring(this.uContent.indexOf("\n") + 1);
            console.log(this.uContent);
            this.parseFile();
        },
        addProduct(){
                axios.post("http://localhost:5000/products/create", {
                data: this.content

                }).then((res) => {
                    //location.reload();
                    //setInterval(this.refreshData, 1000);
                }).catch(error => {
                    console.log(error);
                });
                // if ANY fail validation
                alert('Form successfully submitted.')
                setInterval(this.refreshData, 1000);
        },

    }
}
</script>
<style lang="">
    
</style>