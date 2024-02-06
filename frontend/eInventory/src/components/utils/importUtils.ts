import Papa from "papaparse";
import action from "./axiosUtils";

var importAction = {
    products: [] as any[],
    columns : [
        { field: '30_day_storage_cost', header: '30 Day Storage Cost'},
        { field: 'amz_fees_cost', header: 'Amz Fees Cost'},
        { field: 'amz_fulfilment_cost', header: 'Amz Fulfilment Cost'},
        { field: 'asin', header: 'ASIN' },
        { field: 'bag_cost', header: 'Bag Cost' },
        { field: 'bag_size' , header: 'Bag Size'},
        { field: 'box_cost' , header: 'Box Cost'},
        { field: 'box_type', header: 'Box Type' },
        { field: 'date_added', header: 'Date Added' },
        { field: 'do_we_carry', header: 'Do We Carry?' },
        { field: 'default_units_per_case', header: 'Default Units per Case'},
        { field: 'fnsku', header: 'FNSKU' },
        { field: 'holiday_storage_cost', header: 'Holiday Storage Cost' },
        { field: 'in_shipping_cost', header: 'In-shipping Cost' },
        { field: 'item_cost', header: 'Item Cost'},
        { field: 'item_num', header: 'Item Number'},
        { field: 'item_num_1', header: 'Item Number #1'},
        { field: 'item_num_2', header: 'Item Number #2'},
        { field: 'item_num_3', header: 'Item Number #3'},
        { field: 'item_num_4', header: 'Item Number #4'},
        { field: 'item_num_5', header: 'Item Number #5'},
        { field: 'item_num_6', header: 'Item Number #6'},
        { field: 'labor_cost', header: 'Labor Cost' },
        { field: 'map', header: 'Map' },
        { field: 'meltable', header: 'Meltable?' },
        { field: 'misc_cost', header: 'Misc Cost' },
        { field: 'name', header: 'Name' },
        { field: 'notes', header: 'Notes' },
        { field: 'out_shipping_cost', header: 'Out-shipping Cost' },
        { field: 'price_2021', header: 'Price 2021' },
        { field: 'price_2022', header: 'Price 2022' },
        { field: 'price_2023', header: 'Price 2023' },
        { field: 'process_time_per_unit_sec', header: 'Process Time per Unit Sec' },
        { field: 'products_needed_a', header: 'Products needed A'},
        { field: 'products_needed_b', header: 'Products needed B'},
        { field: 'products_needed_c', header: 'Products needed C'},
        { field: 'products_needed_d', header: 'Products needed D'},
        { field: 'products_needed_e', header: 'Products needed E'},
        { field: 'products_needed_f', header: 'Products needed F'},
        { field: 'qty_1', header: 'Quantity #1'},
        { field: 'qty_2', header: 'Quantity #2'},
        { field: 'qty_3', header: 'Quantity #3'},
        { field: 'qty_4', header: 'Quantity #4'},
        { field: 'qty_5', header: 'Quantity #5'},
        { field: 'qty_6', header: 'Quantity #6'},
        { field: 'total_cost', header: 'Total Cost'},
        { field: 'total_holiday_cost', header: 'Total Holiday Cost' },
        { field: 'upc', header: 'UPC' },
        { field: 'vendor', header: 'Vendor' },
        { field: 'weight_lbs', header: 'Weight (Lbs)' },
    ],

    async onUpload(event: any, fileType: any) {
        console.log("Uploaded");
        const fileUp = event.files[0];
        console.log(fileUp);

        this.products = await action.getProducts();

        if (fileType == 'Processed Product Key'){
            this.processedProductKeyParse(fileUp);
        }

        else if(fileType == 'Raw Product Key'){
            this.rawProductKeyParse(fileUp);
        }

        else if(fileType == 'Processed Product List'){
            this.ProcessedProductListParse(fileUp);
        }

        else if(fileType == 'Unprocessed Product List'){
            this.UnprocessedProductListParse(fileUp);
        }

        
    },

    processedProductKeyParse(file: any){
        console.log(file);
        Papa.parse(file, {
            header: true,
            complete: function( results: any){
                console.log(results);
                
                console.log(results.data[0]);

                let unusedFields=[];
                let content = [];

                //objectLength = Object.keys(exampleObject).length
                console.log(Object.keys(results.data[0]))
                let mapLength = Object.keys(results.data[0]).length; 

                let keys = Object.keys(results.data[0])

                
                //results.data.length
                for (let dataIdx = 0; dataIdx<10; dataIdx++){
                    //console.log(results.data[0][this.columns[k].header]);
                    //results.data[dataIdx]['name'] = results.data[dataIdx]['Name'];
                    let map = [];

                    map['name'] = results.data[dataIdx]['Name'];
                    map['date_added'] = results.data[dataIdx]['Date Added'];

                    

                    /* for (let colIdx = 0; colIdx<this.columns.length; colIdx++){
                        if(results.data[dataIdx][this.columns[colIdx].header] || results.data[dataIdx][this.columns[colIdx].header] == ""){
                            map[this.columns[colIdx].field] = results.data[dataIdx][this.columns[colIdx].header];
                        }
                        //map[this.columns[i].field] = results.data[0][this.columns[i].header];
                        else{
                            //console.log([this.columns[i].header]);
                            //console.log(Object.keys(results.data[0][this.columns[i].header]));
                            if(unusedFields.length == 0){
                                unusedFields.push(this.columns[colIdx].header);
                            }
                        }
                        //console.log(`Mapping Column: data:${dataIdx}, col:${colIdx}; field: ${this.columns[colIdx].field}, header: ${this.columns[colIdx].header}; data:`, results.data[dataIdx][this.columns[colIdx].header], 'current map:', JSON.stringify(map, null, 2), 'map:', map)
                    }
                     */
                    //console.log(map.name);
                    content.push(map); 
                    //console.log(content);
                    /*keys.forEach((key: any, index: any) => {
                        if(results.data[0][this.columns[index].header] || results.data[0][this.columns[index].header] == ""){
                            map[this.columns[index].field] = results.data[0][this.columns[index].header];
                        }
                        else{
                            console.log(key);
                            unusedFields.push(key);
                        }
                    }) */
                }

                console.log(unusedFields);
                console.log("RESULTS: ", results);
                //console.log(map);
                //console.log(Object.keys(map).length)
                console.log("CONTENT: ", content);

            }.bind(this)
        });
        /* Papa.parse( file, {
            header: false,
            skipEmptyLines: true,
            //preview: 10,
            complete: function( results: any ){
                //console.log(results.data.splice(0,2))
                //let keys = results.data.splice(0,2);
                let keys = results.data[1];
                //console.log(keys);
                //keys.splice(0,1);
                //console.log("Keys: ",keys);

                //console.log(keys[1]);

                console.log(results);

                let countA = 1;
                let countB = 1;

                for (let i = 0; i<keys.length; i++){
                    //console.log(keys[i]);

                    if(keys[i]=='<-Quantity'){
                        //console.log(keys[0][i]);
                        keys[i] = 'Quantity #'+countA;
                        countA++;
                    }
                    else if(keys[i]=='Item #'){
                        keys[i] = 'Item #'+countB;
                        countB++;
                    }
                    else if(keys[i]=='Title'){
                        keys[i] = 'Name';
                    }

                    else if(keys[i]=='Storage Cost 30Days'){
                        keys[i] = '30 Day Storage Cost';
                    }

                    else if(keys[i]=='Storage Cost Holiday'){
                        keys[i] = 'Holiday Storage Cost';
                    }

                    else if(keys[i]=='Total Cost HOLIDAY'){
                        keys[i] = 'Total Holiday Cost';
                    }

                    else if(keys[i]=='Products needed '){
                        keys[i] = '';
                    }

                    else if(keys[i]=='Shipping to AMZ'){
                        keys[i] = 'Out-shipping Cost';
                    }

                    else if(keys[i]=='Shipping Here'){
                        keys[i] = 'In-shipping Cost';
                    }

                    else if (keys[i]== 'Process Time per Unit (Sec)'){
                        keys[i] = 'Process Time per Unit Sec'
                    }

                    else if (keys[i]== 'Units per Case'){
                        keys[i] = 'Default Units per Case'
                    }

                    else if (keys[i]== 'Weight (lbs)'){
                        keys[i] = 'Weight (Lbs)'
                    }

                }

                console.log("Cleaned up keys ",keys);
                
                let myMap = {} as any;
                let map = {} as any;
                let content = [];
                //let newContent = [];

                let contentCount = 1;
                //let newContentCount = 1;

                //let missingKeys = [];
                console.log(results.data.length);
                console.log(5);

                for(let i = 0; i<5; i++){

                    for(let j = 0; j<results.data[i].length; j++){
                        map[keys[j]] = results.data[i][j];
                        //newContentCount++;
                    } 

                    //console.log("MAP: ",map);

                    for (let k = 0; k<this.columns.length; k++){
                        keys.forEach((key: any) => {
                            if (key==this.columns[k].header){

                            //console.log(this.columns[k].field);
                            myMap[this.columns[k].field] = map[key];
                            contentCount++
                            //console.log(count++);
                            }
                            else{
                            //missingKeys.push(key);
                            }
                        });
                        //console.log("MYMAP IN LOOP: ", myMap);
                    }
                    console.log("MYMAP: ",myMap);
                    content.push(myMap);
                    //newContent.push(map);
                }

                //console.log("MISSING KEYS: ", missingKeys);
                //console.log("MAP: ",map);

                
                console.log("MYMAP: ", myMap);
                //console.log(myMap.length);

                console.log("CONTENT",content);
                const keysArrayContent = Object.keys(content[0]);
                console.log(keysArrayContent.length);

                /* console.log("NEW CONTENT: ",newContent[0]);
                const keysArrayNewContent = Object.keys(newContent[0]);
                console.log(keysArrayNewContent.length); 


                console.log(results);
            }.bind(this) 
        }); */
    },

    rawProductKeyParse(file: any){
        console.log(file);
        Papa.parse( file, {
            header: false,
            skipEmptyLines: true,
            //preview: 10,
            complete: function( results: any ){
                //console.log(results.data.splice(0,2))
                //let keys = results.data.splice(0,2);
                let keys = results.data[1];
                //console.log(keys);
                //keys.splice(0,1);
                //console.log("Keys: ",keys);

                //console.log(keys[1]);

                console.log(results);

                let countA = 1;
                let countB = 1;

                for (let i = 0; i<keys.length; i++){
                    //console.log(keys[i]);

                    if(keys[i]=='<-Quantity'){
                        //console.log(keys[0][i]);
                        keys[i] = 'Quantity #'+countA;
                        countA++;
                    }
                    else if(keys[i]=='Item #'){
                        keys[i] = 'Item #'+countB;
                        countB++;
                    }
                    else if(keys[i]=='Title'){
                        keys[i] = 'Name';
                    }

                    else if(keys[i]=='Storage Cost 30Days'){
                        keys[i] = '30 Day Storage Cost';
                    }

                    else if(keys[i]=='Storage Cost Holiday'){
                        keys[i] = 'Holiday Storage Cost';
                    }

                    else if(keys[i]=='Total Cost HOLIDAY'){
                        keys[i] = 'Total Holiday Cost';
                    }

                    else if(keys[i]=='Products needed '){
                        keys[i] = '';
                    }

                    else if(keys[i]=='Shipping to AMZ'){
                        keys[i] = 'Out-shipping Cost';
                    }

                    else if(keys[i]=='Shipping Here'){
                        keys[i] = 'In-shipping Cost';
                    }

                    else if (keys[i]== 'Process Time per Unit (Sec)'){
                        keys[i] = 'Process Time per Unit Sec'
                    }

                    else if (keys[i]== 'Units per Case'){
                        keys[i] = 'Default Units per Case'
                    }

                    else if (keys[i]== 'Weight (lbs)'){
                        keys[i] = 'Weight (Lbs)'
                    }

                }

                console.log("Cleaned up keys ",keys);
                
                let myMap = {} as any;
                let map = {} as any;
                let content = [];
                //let newContent = [];

                let contentCount = 1;
                //let newContentCount = 1;

                //let missingKeys = [];

                for(let i = 0; i<results.data.length; i++){

                    for(let j = 0; j<results.data[i].length; j++){
                        map[keys[j]] = results.data[i][j];
                        //newContentCount++;
                    } 

                    for (let k = 0; k<this.columns.length; k++){
                        keys.forEach((key: any) => {
                            if (key==this.columns[k].header){

                            //console.log(this.columns[k].field);
                            myMap[this.columns[k].field] = map[key];
                            contentCount++
                            //console.log(count++);
                            }
                            else{
                            //missingKeys.push(key);
                            }
                        });
                    }

                    content.push(myMap);
                    //newContent.push(map);
                }

                //console.log("MISSING KEYS: ", missingKeys);
                console.log("MAP: ",map);

                
                console.log("MYMAP: ", myMap);
                //console.log(myMap.length);

                console.log("CONTENT",content[0]);
                const keysArrayContent = Object.keys(content[0]);
                console.log(keysArrayContent.length);

                /* console.log("NEW CONTENT: ",newContent[0]);
                const keysArrayNewContent = Object.keys(newContent[0]);
                console.log(keysArrayNewContent.length); */


                console.log(results);
            }.bind(this)
        });
    },

    ProcessedProductListParse(file: any){

    },

    UnprocessedProductListParse(file: any){

    }

}

export default importAction
