import Papa from "papaparse";
import action from "./axiosUtils";
import { supabase } from "@/clients/supabase";

interface test {
    fnsku: any;
    [key:string]: string;
};

var importAction = {
    //products: [] as any[],

    async onUpload(event: any, fileType: any) {
        console.log("Uploaded");
        const fileUp = event.files[0];
        console.log(fileUp);

        let fileData = [];

        //let products = await action.getProducts();

        if (fileType == 'Processed Product Key'){
            await this.processedProductKeyParse(fileUp);
        }

        else if(fileType == 'Raw Product Key'){
            await this.rawProductKeyParse(fileUp);
        }

        else if(fileType == 'Processed Product List'){
           await this.ProcessedProductListParse(fileUp);
        }

        else if(fileType == 'Unprocessed Product List'){
            await this.UnprocessedProductListParse(fileUp);
        }

        //console.log("FILE DATA: ", fileData);
        //console.log("PRODUCTS: ", products);

        return 0;
    },

    async processedProductKeyParse(file: any){
        console.log(file);
        //return file;
        return Papa.parse(file, {
            header: false,
            complete: async function( results: any){
                console.log(results.data);
                
                // console.log(results.data[0]);

                let multiArray = [] as any[];

                multiArray = results.data;
                let keys = multiArray.shift();
                console.log(keys);
                console.log("results after shift ", multiArray);

                // In case any of the records in the array need to be edited
                /* multiArray.forEach((record: any[]) => {
                    record.forEach((field: any) => {
                        if(field == "")
                            field = null;
                    })
                    console.log(record.length);
                    //record[0] = new Date(record[0]);
                }); */

                let filteredArray = multiArray.filter(record => record.length == 51);
                console.log(filteredArray);

                const {data , error} = await supabase.rpc('import_processed_product_keys_batch', { record_array: filteredArray });
                    if(error){
                        console.error('Error calling RPC:', error);
                        throw error;
                    } else {
                        console.log('Function executed successfully:', data);
                    }
            }, 
        }); 
    },

    async rawProductKeyParse(file: any){
        console.log(file);

        return Papa.parse(file, {
            header: false,
            complete: async function( results: any){

                let multiArray = [] as any[];

                multiArray = results.data;
                let keys = multiArray.shift();
                console.log(keys);
                console.log("results after shift ", multiArray);

                let filteredArray = multiArray.filter(record => record.length == 10);
                console.log(filteredArray);

                const {data , error} = await supabase.rpc('import_raw_product_keys_batch', { record_array: filteredArray });
                if(error){
                    console.error('Error calling RPC:', error);
                    throw error;
                } else {
                    console.log('Function executed successfully:', data);
                }
            }
        })
    },

    async ProcessedProductListParse(file: any){
        console.log(file);

        return Papa.parse(file, {
            header: false,
            complete: async function( results: any){

                let multiArray = [] as any[];

                multiArray = results.data;
                let keys = multiArray.shift();
                console.log(keys);
                console.log("results after shift ", multiArray);

                let filteredArray = multiArray.filter(record => record.length == 16);
                console.log(filteredArray);

                const {data , error} = await supabase.rpc('import_processed_product_list_batch', { record_array: filteredArray });
                if(error){
                    console.error('Error calling RPC:', error);
                    throw error;
                } else {
                    console.log('Function executed successfully:', data);
                }
            }
        });
    },

    async UnprocessedProductListParse(file: any){
        console.log(file);

        return Papa.parse(file, {
            header: false,
            complete: async function( results: any){

                let multiArray = [] as any[];

                multiArray = results.data;
                let keys = multiArray.shift();
                console.log(keys);
                console.log("results after shift ", multiArray);

                let filteredArray = multiArray.filter(record => record.length == 12);

                console.log(filteredArray);

                filteredArray.forEach((record: any) => {
                    // console.log('Number of boxes',record[7], 'Floor number of boxes', Math.floor(record[7]))
                    if(Number(record[7]) !== Math.floor(record[7])){
                        console.log(record);
                        let units_per_box = record[6]*(record[7]-Math.floor(record[7]));

                        record[7] = String(Math.floor(record[7]));

                        filteredArray.push([
                            record[0],
                            record[1],
                            record[2],
                            record[3],
                            record[4],
                            record[5],
                            String(Math.ceil(units_per_box)),
                            '1',
                            record[8],
                            record[9],
                            record[10],
                            record[11]
                        ])
                    }
                })

                console.log(filteredArray);

                const {data , error} = await supabase.rpc('import_raw_product_list_batch', { record_array: filteredArray });
                if(error){
                    console.error('Error calling RPC:', error);
                    throw error;
                } else {
                    console.log('Function executed successfully:', data);
                }
            }
        });

        //return file;
        /* return Papa.parse(file, {
            header: true,
            complete: async function( results: any):Promise<any[]>{
                console.log(results);
                
                console.log(results.data[0]);

                let unusedFields=[];
                let content = [];

                //objectLength = Object.keys(exampleObject).length
                console.log(Object.keys(results.data[0]))
                let mapLength = Object.keys(results.data[0]).length; 

                let keys = Object.keys(results.data[0])

                let locations = [];
                locations = await action.getLocations();

                
                //results.data.length
                for (let dataIdx = 0; dataIdx<results.data.length; dataIdx++){
                    //console.log(results.data[0][this.columns[k].header]);
                    //results.data[dataIdx]['name'] = results.data[dataIdx]['Name'];
                    let map = [] as any[];

                    map['status' as any] = results.data[dataIdx]['Status'];

                    if(results.data[dataIdx]['Location']){

                        console.log(results.data[dataIdx]['Location']);
                        console.log(locations.length);
                        console.log(locations);

                        let locationExists = false;
                        
                        if (locations.length > 0){
                            
                            for (let locIdx = 0; locIdx < locations.length; locIdx++){
                                if(results.data[dataIdx]['Location'] == locations[locIdx].name){
                                    console.log("LOCATION EXISTS");
                                    //console.log(locations[locIdx].location_id);
                                    map['location' as any] = locations[locIdx].location_id;
                                    locationExists = true;
                                }    
                            }
                            if (locationExists == false){
                                console.log("NEW LOCATION");
                                let loc = [] as any[];
                                loc['name' as any] = results.data[dataIdx]['Location']
                                console.log("LOC BEFORE INSERT ", loc);
                                
                                let location = await action.addLocation(loc);
                                locations.push(loc);
                                console.log("LOC AFTER INSERT ", location);
                                map['location' as any] = location[0].location_id;
                            }
                        } else {
                            console.log("NEW LOCATION");
                            let loc = [] as any[];
                            loc['name' as any] = results.data[dataIdx]['Location']
                            console.log("LOC BEFORE INSERT ", loc);
                            
                            let location = await action.addLocation(loc);
                            locations.push(loc);
                            console.log("LOC AFTER INSERT ", location);
                            map['location' as any] = location[0].location_id;
                        }

                        //console.log(map['location' as any]);

                    }

                    map['space' as any] = results.data[dataIdx]['Space'];
                    map['vendor' as any] = results.data[dataIdx]['Vendor'];
                    map['description' as any] = results.data[dataIdx]['Description'];
                    map['notes' as any] = results.data[dataIdx]['Notes'];
                    map['units_per_case' as any] = results.data[dataIdx]['Units Per Case'];
                    map['number_of_cases' as any] = results.data[dataIdx]['Number of cases'];
                    map['total_units' as any] = results.data[dataIdx]['Total Units'];
                    map['cost' as any] = results.data[dataIdx]['Cost'];
                    map['total' as any] = results.data[dataIdx]['Total'];

                    console.log(map[<any>'number_of_cases']);
                    
                    for(let caseIdx = 0; caseIdx<map[<any>'number_of_cases']; caseIdx++){
                        content.push(map); 
                    }
                }

                console.log("RESULTS: ", results);
                console.log("RESULTS LENGTH: ", results.data.length);
                //console.log(Object.keys(content[0]).length)
                console.log("CONTENT: ", content);
                console.log("CONTENT LENGTH:", content.length);

                for (let contentIdx = 0; contentIdx < content.length; contentIdx++) {
                    //console.log(content[contentIdx].name);

                    for (let productIdx = 0; productIdx<products.length; productIdx++){
                        if (products[productIdx].name.toLowerCase() == content[contentIdx][<any>'description'].toLowerCase()){
                            //console.log(products[productIdx].name);
                            content[contentIdx][<any>'product_id'] = products[productIdx].product_id;
                            await action.addCase(content[contentIdx]);
                            break;
                        }
                        
                    }  
                    if (!content[contentIdx][<any>'product_id']){
                        console.log("PRODUCT WITHOUT ID: ",content[contentIdx][<any>'description']);
                    }     
                }

                console.log("DATA IMPORTED")

                return content;
            }
        });  */
    }

}

export default importAction
