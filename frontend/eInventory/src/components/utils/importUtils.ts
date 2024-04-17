import Papa from "papaparse";
import action from "./axiosUtils";

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

        let products = await action.getProducts();

        if (fileType == 'Processed Product Key'){
            await this.processedProductKeyParse(fileUp, products);
        }

        else if(fileType == 'Raw Product Key'){
            await this.rawProductKeyParse(fileUp);
        }

        else if(fileType == 'Processed Product List'){
            await this.ProcessedProductListParse(fileUp, products);
        }

        else if(fileType == 'Unprocessed Product List'){
            await this.UnprocessedProductListParse(fileUp, products);
        }

        //console.log("FILE DATA: ", fileData);
        console.log("PRODUCTS: ", products);

        return 0;
    },

    async processedProductKeyParse(file: any, products: any){
        console.log(file);
        //return file;
        return Papa.parse(file, {
            header: true,
            complete: async function( results: any){
                console.log(results);
                
                console.log(results.data[0]);

                let unusedFields=[];
                let content = [];
                let recipeContent = [] as any[];

                let vendors = await action.getVendors();

                //objectLength = Object.keys(exampleObject).length
                console.log(Object.keys(results.data[0]))
                //let mapLength = Object.keys(results.data[0]).length; 

                //let keys = Object.keys(results.data[0])

                
                //results.data.length
                for (let dataIdx = 0; dataIdx<results.data.length; dataIdx++){
                    console.log("Progress ", Math.round((dataIdx/results.data.length)*100) + "%");
                    //console.log(results.data[0][this.columns[k].header]);
                    //results.data[dataIdx]['name'] = results.data[dataIdx]['Name'];
                    let map = [];
                    let recMap = {} as any;

                    if (results.data[dataIdx]['Name']) {
                        map['name' as any] = results.data[dataIdx]['Name'];
                    }
                    
                    if (results.data[dataIdx]['Date Added']) {
                        map['date_added' as any] = results.data[dataIdx]['Date Added'];
                    }
                    
                    if (results.data[dataIdx]['Do We Carry?']) {
                        map['do_we_carry' as any] = results.data[dataIdx]['Do We Carry?'];
                    }
                    
                    if (results.data[dataIdx]['Vendor']) {
                        //console.log(results.data[dataIdx]['Vendor']);
                        //console.log(vendors.length);
                        //console.log(vendors);

                        let vendorExists = false;
                        
                        if (vendors.length > 0){
                            
                            for (let venIdx = 0; venIdx < vendors.length; venIdx++){
                                if(results.data[dataIdx]['Vendor'] == vendors[venIdx].vendor_name){
                                    //console.log("VENDOR EXISTS");
                                    //console.log(vendors[venIdx].vendor_id);
                                    map['vendor' as any] = vendors[venIdx].vendor_id;
                                    vendorExists = true;
                                }    
                            }
                            if (vendorExists == false){
                                console.log("NEW VENDOR");
                                let ven = [] as any[];
                                ven['vendor_name' as any] = results.data[dataIdx]['Vendor']
                                console.log("VEN BEFORE INSERT ", ven);
                                
                                let vendor = await action.addVendor(ven);
                                vendors.push(ven);
                                console.log("VEN AFTER INSERT ", vendor);
                                map['vendor' as any] = vendor[0].vendor_id;
                            }
                        } else {
                            console.log("NEW VENDOR");
                            let ven = [] as any[];
                            ven['vendor_name' as any] = results.data[dataIdx]['Vendor']
                            console.log("VEN BEFORE INSERT ", ven);
                            
                            let vendor = await action.addVendor(ven);
                            vendors.push(ven);
                            console.log("VEN AFTER INSERT ", vendor);
                            map['vendor' as any] = vendor[0].vendor_id;
                        }

                        //console.log(map['vendor' as any]);
                    }
                    
                    if (results.data[dataIdx]['FNSKU']) {
                        map['fnsku' as any] = results.data[dataIdx]['FNSKU'];
                    }
                    
                    if (results.data[dataIdx]['ASIN']) {
                        map['asin' as any] = results.data[dataIdx]['ASIN'];
                    }
                    
                    if (results.data[dataIdx]['Default Units per Case']) {
                        map['default_units_per_case' as any] = results.data[dataIdx]['Default Units per Case']; 
                    }
                    
                    if (results.data[dataIdx]['Weight (Lbs)']) {
                        map['weight_lbs' as any] = results.data[dataIdx]['Weight (Lbs)'];
                    }
                    
                    if (results.data[dataIdx]['Box Type']) {
                        map['box_type' as any] = results.data[dataIdx]['Box Type'];
                    }
                    
                    if (results.data[dataIdx]['Box Cost']) {
                        map['box_cost' as any] = results.data[dataIdx]['Box Cost'];
                    }
                    
                    if (results.data[dataIdx]['Bag Size']) {
                        map['bag_size' as any] = results.data[dataIdx]['Bag Size'];
                    }
                    
                    if (results.data[dataIdx]['Process Time per Unit Sec']) {
                        map['process_time_per_unit_sec' as any] = results.data[dataIdx]['Process Time per Unit Sec'];
                    }
                    
                    if (results.data[dataIdx]['Meltable?']) {
                        map['meltable' as any] = results.data[dataIdx]['Meltable?'];
                    }

                    if(results.data[dataIdx]['Products needed A'] != '' && results.data[dataIdx]['Products needed A']){
                        console.log(results.data[dataIdx]['Products needed A']);
                        map['products_needed_a' as any] = results.data[dataIdx]['Products needed A'].toLowerCase();
                    }

                    if (results.data[dataIdx]['Item Number #1']) {
                        map['item_num_1' as any] = results.data[dataIdx]['Item Number #1'];
                    }
                    
                    if (results.data[dataIdx]['Quantity #1']) {
                        map['qty_1' as any] = results.data[dataIdx]['Quantity #1'];
                    }

                    if(results.data[dataIdx]['Products needed B'] != ''&& results.data[dataIdx]['Products needed B']){
                        console.log(results.data[dataIdx]['Products needed B']);

                        map['products_needed_b' as any] = results.data[dataIdx]['Products needed B'].toLowerCase();
                    }

                    if (results.data[dataIdx]['Item Number #2']) {
                        map['item_num_2' as any] = results.data[dataIdx]['Item Number #2'];
                    }
                    
                    if (results.data[dataIdx]['Quantity #2']) {
                        map['qty_2' as any] = results.data[dataIdx]['Quantity #2'];
                    }

                    if(results.data[dataIdx]['Products needed C'] != ''&& results.data[dataIdx]['Products needed C']){
                        map['products_needed_c' as any] = results.data[dataIdx]['Products needed C'].toLowerCase();
                    }

                    if (results.data[dataIdx]['Item Number #3']) {
                        map['item_num_3' as any] = results.data[dataIdx]['Item Number #3'];
                    }
                    
                    if (results.data[dataIdx]['Quantity #3']) {
                        map['qty_3' as any] = results.data[dataIdx]['Quantity #3'];
                    }
                    
                    if(results.data[dataIdx]['Products needed D'] != ''&& results.data[dataIdx]['Products needed D']){
                        map['products_needed_d' as any] = results.data[dataIdx]['Products needed D'].toLowerCase();
                    }

                    if (results.data[dataIdx]['Item Number #4']) {
                        map['item_num_4' as any] = results.data[dataIdx]['Item Number #4'];
                    }
                    
                    if (results.data[dataIdx]['Quantity #4']) {
                        map['qty_4' as any] = results.data[dataIdx]['Quantity #4'];
                    }
                    
                    if(results.data[dataIdx]['Products needed E'] != ''&& results.data[dataIdx]['Products needed E']){
                        map['products_needed_e' as any] = results.data[dataIdx]['Products needed E'].toLowerCase();
                    }

                    if (results.data[dataIdx]['Item Number #5']) {
                        map['item_num_5' as any] = results.data[dataIdx]['Item Number #5'];
                    }
                    
                    if (results.data[dataIdx]['Quantity #5']) {
                        map['qty_5' as any] = results.data[dataIdx]['Quantity #5'];
                    }

                    if(results.data[dataIdx]['Products needed F'] != ''&& results.data[dataIdx]['Products needed F']){
                        map['products_needed_f' as any] = results.data[dataIdx]['Products needed F'].toLowerCase();
                    }
                    if (results.data[dataIdx]['Item Number #6']) {
                        map['item_num_6' as any] = results.data[dataIdx]['Item Number #6'];
                    }
                    
                    if (results.data[dataIdx]['Quantity #6']) {
                        map['qty_6' as any] = results.data[dataIdx]['Quantity #6'];
                    }

                    if (results.data[dataIdx]['Bag Cost']) {
                        map['bag_cost' as any] = results.data[dataIdx]['Bag Cost'];
                    }
                    
                    if (results.data[dataIdx]['In-shipping Cost']) {
                        map['in_shipping_cost' as any] = results.data[dataIdx]['In-shipping Cost'];
                    }
                    
                    if (results.data[dataIdx]['Out-shipping Cost']) {
                        map['out_shipping_cost' as any] = results.data[dataIdx]['Out-shipping Cost'];
                    }
                    
                    if (results.data[dataIdx]['Labor Cost']) {
                        map['labor_cost' as any] = results.data[dataIdx]['Labor Cost'];
                    }
                    
                    if (results.data[dataIdx]['Item Cost']) {
                        map['item_cost' as any] = results.data[dataIdx]['Item Cost'];
                    }
                    
                    if (results.data[dataIdx]['Misc Cost']) {
                        map['misc_cost' as any] = results.data[dataIdx]['Misc Cost'];
                    }
                    
                    if (results.data[dataIdx]['Amz Fees Cost']) {
                        map['amz_fees_cost' as any] = results.data[dataIdx]['Amz Fees Cost'];
                    }
                    
                    if (results.data[dataIdx]['Amz Fulfilment Cost']) {
                        map['amz_fulfiment_cost' as any] = results.data[dataIdx]['Amz Fulfilment Cost'];
                    }
                    
                    if (results.data[dataIdx]['30 Day Storage Cost']) {
                        map['30_day_storage_cost' as any] = results.data[dataIdx]['30 Day Storage Cost'];
                    }
                    
                    if (results.data[dataIdx]['Holiday Storage Cost']) {
                        map['holiday_storage_cost' as any] = results.data[dataIdx]['Holiday Storage Cost'];
                    }
                    
                    if (results.data[dataIdx]['Total Cost']) {
                        map['total_cost' as any] = results.data[dataIdx]['Total Cost'];
                    }
                    
                    if (results.data[dataIdx]['Total Holiday Cost']) {
                        map['total_holiday_cost' as any] = results.data[dataIdx]['Total Holiday Cost'];
                    }
                    
                    if (results.data[dataIdx]['Notes']) {
                        map['notes' as any] = results.data[dataIdx]['Notes'];
                    }
                    
                    if (results.data[dataIdx]['Unit Box Cost']) {
                        map['unit_box_cost' as any] = results.data[dataIdx]['Unit Box Cost'];
                    }
                    

                    //console.log(map);
                    //console.log(map['products_needed_a' as any]);
                    //console.log(map['products_needed_a' as any].toLowerCase());

                    //products.length
                    for (let productIdx = 0; productIdx<products.length; productIdx++){
                        //products[productIdx].name.toLowerCase();
                        //console.log(products[productIdx].name);
                        
                        if (map['products_needed_a' as any] && products[productIdx].name.toLowerCase() == map['products_needed_a' as any] && products[productIdx].item_num == map[<any>'item_num_1'] && map['qty_1' as any]){
                            // console.log("MATCH A ", products[productIdx].product_id);
                            // console.log(products[productIdx].name);
                            // console.log(products[productIdx].item_num);
                            recMap['product_needed' as any] = products[productIdx].product_id;
                            recMap['units_needed' as any] = map['qty_1' as any];

                            console.log("REC MAP", recMap);

                            recipeContent.push(recMap);

                            recMap = {};
                            // console.log(map['products_needed_a' as any]);

                        }
                        if (map['products_needed_b' as any] && products[productIdx].name.toLowerCase() == map['products_needed_b' as any] && products[productIdx].item_num == map[<any>'item_num_2'] && map['qty_2' as any]){
                            //console.log(map['products_needed_b' as any]);
                            
                            // console.log("MATCH B ", products[productIdx].product_id)
                            // console.log(products[productIdx].name);
                            // console.log(products[productIdx].item_num);
                            recMap['product_needed' as any] = products[productIdx].product_id;
                            recMap['units_needed' as any] = map['qty_2' as any];
                            // console.log(map['products_needed_b' as any]);

                            console.log("REC MAP", recMap);

                            recipeContent.push(recMap);

                            recMap = {};
                        }
                        if (map['products_needed_c' as any] && products[productIdx].name.toLowerCase() == map['products_needed_c' as any] && products[productIdx].item_num == map[<any>'item_num_3'] && map['qty_3' as any]){
                            // console.log("MATCH C ", products[productIdx].product_id)
                            // console.log(products[productIdx].name);
                            // console.log(products[productIdx].item_num);
                            recMap['product_needed' as any] = products[productIdx].product_id;
                            recMap['units_needed' as any] = map['qty_3' as any];
                            // console.log(map['products_needed_c' as any]);

                            console.log("REC MAP", recMap);

                            recipeContent.push(recMap);

                            recMap = {};
                        }
                        if (map['products_needed_d' as any] && products[productIdx].name.toLowerCase() == map['products_needed_d' as any] && products[productIdx].item_num == map[<any>'item_num_4'] && map['qty_4' as any]){
                            // console.log("MATCH D ", products[productIdx].product_id)
                            // console.log(products[productIdx].name);
                            // console.log(products[productIdx].item_num);
                            recMap['product_needed' as any] = products[productIdx].product_id;
                            recMap['units_needed' as any] = map['qty_4' as any];
                            //console.log(map['products_needed_d' as any]);

                            console.log("REC MAP", recMap);

                            recipeContent.push(recMap);

                            recMap = {};
                        }
                        if (map['products_needed_e' as any] && products[productIdx].name.toLowerCase() == map['products_needed_e' as any] && products[productIdx].item_num == map[<any>'item_num_5'] && map['qty_5' as any]){
                            //console.log("MATCH E ", products[productIdx].product_id)
                            //console.log(products[productIdx].name);
                            //console.log(products[productIdx].item_num);
                            recMap['product_needed' as any] = products[productIdx].product_id;
                            recMap['units_needed' as any] = map['qty_5' as any];
                            //console.log(map['products_needed_e' as any]);

                            console.log("REC MAP", recMap);

                            recipeContent.push(recMap);

                            recMap = {};
                        }
                        if (map['products_needed_f' as any] && products[productIdx].name.toLowerCase() == map['products_needed_f' as any] && products[productIdx].item_num == map[<any>'item_num_6'] && map['qty_6' as any]){
                            //console.log("MATCH F ", products[productIdx].product_id)
                            //console.log(products[productIdx].name);
                            //console.log(products[productIdx].item_num);
                            recMap['product_needed' as any] = products[productIdx].product_id;
                            recMap['units_needed' as any] = map['qty_6' as any];
                            //console.log(map['products_needed_f' as any]);

                            console.log("REC MAP", recMap);

                            recipeContent.push(recMap);

                            recMap = {};
                        }
                        if (products[productIdx].name != map['products_needed_a' as any] && products[productIdx].item_num == map[<any>'item_num_1'] && map['products_needed_a' as any] && products[productIdx].item_num != ''){
                            //console.log("MATCH A ", products[productIdx].product_id);
                            //console.log("PRODUCT NAME: ", products[productIdx].name);
                            //console.log("PRODUCT ITEM NUMBER: ", products[productIdx].item_num);
                            //map['products_needed_a' as any] = products[productIdx].product_id;
                            //console.log("FOREIGN KEY TO CORRECT: ", map['name' as any]); 

                        }
                    }

                    console.log("RECIPE CONTENT ARRAY ", recipeContent);
                    
                    if (map['name' as any]){
                        console.log("MAP: ", map, " AND RECIPE CONTENT: ", recipeContent);

                        await action.addProduct(map, recipeContent);
                        recipeContent = [];
                    }

                    //console.log(map.name);
                    content.push(map); 
                }

                /* for(let contentIdx = 0; contentIdx<content.length; contentIdx++){
                    
                } */

                console.log("RESULTS: ", results);
                console.log("RESULTS LENGTH: ", results.data.length);
                //console.log(Object.keys(content[0]).length)
                console.log("CONTENT: ", content);
                //console.log("TESTING: ", content[0].testing)
                console.log("CONTENT LENGTH:", content.length);

                console.log("DATA IMPORTED")
                return content;
            },
        }); 
    },

    async rawProductKeyParse(file: any){
        console.log(file);
        //return file;
        return Papa.parse(file, {
            header: true,
            complete: async function( results: any){
                console.log(results);
                
                console.log(results.data[0]);

                let unusedFields=[];
                let content = [];

                //objectLength = Object.keys(exampleObject).length
                console.log(Object.keys(results.data[0]))
                let mapLength = Object.keys(results.data[0]).length; 

                let keys = Object.keys(results.data[0])

                let vendors = [];
                vendors = await action.getVendors();

                
                //results.data.length
                for (let dataIdx = 0; dataIdx<results.data.length; dataIdx++){
                    console.log("Progress ", Math.round((dataIdx/results.data.length)*100) + "%");
                    //console.log(results.data[0][this.columns[k].header]);
                    //results.data[dataIdx]['name'] = results.data[dataIdx]['Name'];
                    let map = [];

                    if(results.data[dataIdx]['Vendor']){

                        //console.log(results.data[dataIdx]['Vendor']);
                        //console.log(vendors.length);
                        //console.log(vendors);

                        let vendorExists = false;
                        
                        if (vendors.length > 0){
                            
                            for (let venIdx = 0; venIdx < vendors.length; venIdx++){
                                if(results.data[dataIdx]['Vendor'] == vendors[venIdx].vendor_name){
                                    //console.log("VENDOR EXISTS");
                                    //console.log(vendors[venIdx].vendor_id);
                                    map['vendor' as any] = vendors[venIdx].vendor_id;
                                    vendorExists = true;
                                }    
                            }
                            if (vendorExists == false){
                                console.log("NEW VENDOR");
                                let ven = [] as any[];
                                ven['vendor_name' as any] = results.data[dataIdx]['Vendor']
                                console.log("VEN BEFORE INSERT ", ven);
                                
                                let vendor = await action.addVendor(ven);
                                vendors.push(ven);
                                console.log("VEN AFTER INSERT ", vendor);
                                map['vendor' as any] = vendor[0].vendor_id;
                            }
                        } else {
                            console.log("NEW VENDOR");
                            let ven = [] as any[];
                            ven['vendor_name' as any] = results.data[dataIdx]['Vendor']
                            console.log("VEN BEFORE INSERT ", ven);
                            
                            let vendor = await action.addVendor(ven);
                            vendors.push(ven);
                            console.log("VEN AFTER INSERT ", vendor);
                            map['vendor' as any] = vendor[0].vendor_id;
                        }

                        //console.log(map['vendor' as any]);
                    }
                    
                    if(results.data[dataIdx]['Product Name']){
                        map['name' as any] = results.data[dataIdx]['Product Name'];
                    }
                    
                    if(results.data[dataIdx]['item #']){
                        map['item_num' as any] = results.data[dataIdx]['item #'];
                    }
                    
                    if(results.data[dataIdx]['2023 Price']){
                        map['price_2023' as any] = results.data[dataIdx]['2023 Price'];
                    }
                    
                    if(results.data[dataIdx]['2022 AUG Price']){
                        map['price_2022' as any] = results.data[dataIdx]['2022 AUG Price'];
                    }
                    
                    if(results.data[dataIdx]['2021 Price']){
                        map['price_2021' as any] = results.data[dataIdx]['2021 Price'];
                    }
                    
                    if(results.data[dataIdx]['Units Per Case']){
                        map['default_units_per_case' as any] = results.data[dataIdx]['Units Per Case'];
                    }
                    
                    if(results.data[dataIdx]['MAP']){
                        map['map' as any] = results.data[dataIdx]['MAP'];
                    }
                    if(results.data[dataIdx]['Notes']){
                        map['notes' as any] = results.data[dataIdx]['Notes'];
                    }
                    if(results.data[dataIdx]['UPC']){
                        map['upc' as any] = results.data[dataIdx]['UPC'];
                    }

                    if(results.data[dataIdx]['Product Name']){
                        //console.log(map);

                        await action.addProduct(map, '');
                    }
                    

                    content.push(JSON.stringify(map)); 
                }

                console.log("RESULTS: ", results);
                console.log("RESULTS LENGTH: ", results.data.length);
                console.log(Object.keys(content[0]).length)
                console.log("CONTENT: ", content);

                //await action.batchInsertProduct(content);

                console.log("CONTENT LENGTH:", content.length);

                console.log("DATA IMPORTED")
                return content;
            }.bind(this)
        }); 
    },

    async ProcessedProductListParse(file: any, products: any){
        console.log(file);
        //return file;
        return Papa.parse(file, {
            header: true,
            complete: async function( results: any){
                console.log(results);
                
                console.log(results.data[0]);

                let unusedFields=[];
                let content: test[][] = [];

                //objectLength = Object.keys(exampleObject).length
                console.log(Object.keys(results.data[0]))
                let mapLength = Object.keys(results.data[0]).length; 

                let keys = Object.keys(results.data[0])

                let locations = [];
                locations = await action.getLocations();

                let totalCount = 0;

                
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
                    

                    //map['space' as any] = results.data[dataIdx]['Space'];
                    map['vendor' as any] = results.data[dataIdx]['Vendor'];
                    map['asin' as any] = results.data[dataIdx]['ASIN'];
                    map['name' as any] = results.data[dataIdx]['Description'];
                    map['fnsku' as any] = results.data[dataIdx]['FNSKU'];
                    map['notes' as any] = results.data[dataIdx]['Notes'];
                    map['units_per_case' as any] = results.data[dataIdx]['Units per case'];
                    map['number_of_cases' as any] = results.data[dataIdx]['Number of cases'];
                    map['total_units' as any] = results.data[dataIdx]['Total Units'];
                    map['cost' as any] = results.data[dataIdx]['Cost'];
                    map['total' as any] = results.data[dataIdx]['Total'];
                    map['weight_lbs' as any] = results.data[dataIdx]['Weight (lbs)'];
                    map['box_type' as any] = results.data[dataIdx]['Box type'];
                    map['bag_size' as any] = results.data[dataIdx]['Bag Size'];

                    //console.log(map['number_of_cases']);

                    //totalCount += map['number_of_cases'];
        
                    for(let caseIdx = 0; caseIdx<map[<any>'number_of_cases']; caseIdx++){
                        content.push(map); 
                    }
                }

                console.log("RESULTS: ", results);
                console.log("RESULTS LENGTH: ", results.data.length);
                //console.log(Object.keys(content[0]).length)
                console.log("CONTENT: ", content);
                console.log("CONTENT LENGTH:", content.length);
                //console.log("TOTAL COUNT: ", totalCount);

                let importContent = [];

                for (let contentIdx = 0; contentIdx < content.length; contentIdx++) {
                    //console.log(content[contentIdx].name);

                    for (let productIdx = 0; productIdx<products.length; productIdx++){
                        if (products[productIdx].fnsku == content[contentIdx][<any>'fnsku']){
                            //console.log(products[productIdx].name);
                            content[contentIdx][<any>'product_id'] = products[productIdx].product_id;
                            await action.addCase(content[contentIdx]);
                            break;
                        }
                    }       
                }

                console.log("CONTENT AFTER LOOP: ", content);
                console.log("DATA IMPORTED");
                return content;
            }.bind(this)
        }); 
    },

    async UnprocessedProductListParse(file: any, products: any){
        console.log(file);
        //return file;
        return Papa.parse(file, {
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
        }); 
    }

}

export default importAction
