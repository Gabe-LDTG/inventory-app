import Papa from "papaparse";
import action from "./axiosUtils";

var importAction = {
    products: [] as any[],

    async onUpload(event: any, fileType: any) {
        console.log("Uploaded");
        const fileUp = event.files[0];
        console.log(fileUp);

        let fileData = [];

        this.products = await action.getProducts();

        if (fileType == 'Processed Product Key'){
            fileData = await this.processedProductKeyParse(fileUp);
        }

        else if(fileType == 'Raw Product Key'){
            fileData = await this.rawProductKeyParse(fileUp);
        }

        else if(fileType == 'Processed Product List'){
            fileData = await this.ProcessedProductListParse(fileUp);
        }

        else if(fileType == 'Unprocessed Product List'){
            fileData = await this.UnprocessedProductListParse(fileUp);
        }

        console.log("FILE DATA: ", fileData);
        console.log("PRODUCTS: ", this.products);

        
    },

    async processedProductKeyParse(file: any){
        console.log(file);
        return Papa.parse(file, {
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
                for (let dataIdx = 0; dataIdx<results.data.length; dataIdx++){
                    //console.log(results.data[0][this.columns[k].header]);
                    //results.data[dataIdx]['name'] = results.data[dataIdx]['Name'];
                    let map = [];

                    map['name' as any] = "";
                    map['item_num' as any] = "";
                    map['vendor' as any] = "";	
                    map['weight_lbs' as any] = "";
                    map['box_type' as any] = "";
                    map['box_cost' as any] = "";
                    map['bag_size' as any] = "";
                    map['bag_cost' as any] = "";
                    map['price_2021' as any] = "";
                    map['price_2022' as any] = "";
                    map['price_2023' as any] = "";
                    map['notes' as any] = "";
                    map['date_added' as any] = "";
                    map['upc' as any] = "";
                    map['fnsku' as any] = "";
                    map['asin' as any] = "";
                    map['do_we_carry' as any] = "";
                    map['process_time_per_unit_sec' as any] = "";
                    map['meltable' as any] = "";
                    map['map' as any] = "";
                    map['in_shipping_cost' as any] = "";
                    map['out_shipping_cost' as any] = "";
                    map['labor_cost' as any] = "";
                    map['item_cost' as any] = "";
                    map['misc_cost' as any] = "";
                    map['amz_fees_cost' as any] = "";
                    map['amz_fulfilment_cost' as any] = "";
                    map['30_day_storage_cost' as any] = "";
                    map['holiday_storage_cost' as any] = "";
                    map['total_cost' as any] = "";
                    map['total_holiday_cost' as any] = "";
                    map['products_needed_a' as any] = "";
                    map['qty_1' as any] = "";
                    map['products_needed_b' as any] = "";
                    map['qty_2' as any] = "";
                    map['products_needed_c' as any] = "";
                    map['qty_3' as any] = "";
                    map['products_needed_d' as any] = "";
                    map['qty_4' as any] = "";
                    map['products_needed_e' as any] = "";
                    map['qty_5' as any] = "";
                    map['products_needed_f' as any] = "";
                    map['qty_6' as any] = "";
                    map['default_units_per_case' as any] = "";

                    map['name' as any] = results.data[dataIdx]['Name'];
                    map['date_added' as any] = results.data[dataIdx]['Date Added'];
                    map['do_we_carry' as any] = results.data[dataIdx]['Do We Carry?'];
                    map['vendor' as any] = results.data[dataIdx]['Vendor'];
                    map['fnsku' as any] = results.data[dataIdx]['FNSKU'];
                    map['asin' as any] = results.data[dataIdx]['ASIN'];
                    map['default_units_per_case' as any] = results.data[dataIdx]['Default Units per Case'];
                    map['weight_lbs' as any] = results.data[dataIdx]['Weight (Lbs)'];
                    map['box_type' as any] = results.data[dataIdx]['Box Type'];
                    map['box_cost' as any] = results.data[dataIdx]['Box Cost'];
                    map['bag_size' as any] = results.data[dataIdx]['Bag Size'];
                    map['process_time_per_unit_sec' as any] = results.data[dataIdx]['Process Time per Unit Sec'];
                    map['meltable' as any] = results.data[dataIdx]['Meltable?'];
                    map['products_needed_a' as any] = results.data[dataIdx]['Products needed A'];
                    map['item_num_1' as any] = results.data[dataIdx]['Item Number #1'];
                    map['qty_1' as any] = results.data[dataIdx]['Quantity #1'];
                    map['products_needed_b' as any] = results.data[dataIdx]['Products needed B'];
                    map['item_num_2' as any] = results.data[dataIdx]['Item Number #2'];
                    map['qty_2' as any] = results.data[dataIdx]['Quantity #2'];
                    map['products_needed_c' as any] = results.data[dataIdx]['Products needed C'];
                    map['item_num_3' as any] = results.data[dataIdx]['Item Number #3'];
                    map['qty_3' as any] = results.data[dataIdx]['Quantity #3'];
                    map['products_needed_d' as any] = results.data[dataIdx]['Products needed D'];
                    map['item_num_4' as any] = results.data[dataIdx]['Item Number #4'];
                    map['qty_4' as any] = results.data[dataIdx]['Quantity #4'];
                    map['products_needed_e' as any] = results.data[dataIdx]['Products needed E'];
                    map['item_num_5' as any] = results.data[dataIdx]['Item Number #5'];
                    map['qty_5' as any] = results.data[dataIdx]['Quantity #5'];
                    map['products_needed_f' as any] = results.data[dataIdx]['Products needed F'];
                    map['item_num_6' as any] = results.data[dataIdx]['Item Number #6'];
                    map['qty_6' as any] = results.data[dataIdx]['Quantity #6'];
                    map['bag_cost' as any] = results.data[dataIdx]['Bag Cost'];
                    map['in_shipping_cost' as any] = results.data[dataIdx]['In-shipping Cost'];
                    map['out_shipping_cost' as any] = results.data[dataIdx]['Out-shipping Cost'];
                    map['labor_cost' as any] = results.data[dataIdx]['Labor Cost'];
                    map['item_cost' as any] = results.data[dataIdx]['Item Cost'];
                    map['misc_cost' as any] = results.data[dataIdx]['Misc Cost'];
                    map['amz_fees_cost' as any] = results.data[dataIdx]['Amz Fees Cost'];
                    map['amz_fulfiment_cost' as any] = results.data[dataIdx]['Amz Fulfilment Cost'];
                    map['30_day_storage_cost' as any] = results.data[dataIdx]['30 Day Storage Cost'];
                    map['holiday_storage_cost' as any] = results.data[dataIdx]['Holiday Storage Cost'];
                    map['total_cost' as any] = results.data[dataIdx]['Total Cost'];
                    map['total_holiday_cost' as any] = results.data[dataIdx]['Total Holiday Cost'];
                    map['notes' as any] = results.data[dataIdx]['Notes'];

                    for (let productIdx = 0; productIdx<this.products.length; productIdx++){
                        if (this.products[productIdx].name == map['products_needed_a' as any] && this.products[productIdx].item_num == map['item_num_1']){
                            console.log("MATCH A ", this.products[productIdx].id);
                            map['products_needed_a' as any] = this.products[productIdx].id;
                        }
                        else if (this.products[productIdx].name == map['products_needed_b' as any] && this.products[productIdx].item_num == map['item_num_2']){
                            console.log("MATCH B ", this.products[productIdx].id)
                            map['products_needed_b' as any] = this.products[productIdx].id;
                        }
                        else if (this.products[productIdx].name == map['products_needed_c' as any] && this.products[productIdx].item_num == map['item_num_3']){
                            console.log("MATCH C ", this.products[productIdx].id)
                            map['products_needed_c' as any] = this.products[productIdx].id;
                        }
                        else if (this.products[productIdx].name == map['products_needed_d' as any] && this.products[productIdx].item_num == map['item_num_4']){
                            console.log("MATCH D ", this.products[productIdx].id)
                            map['products_needed_d' as any] = this.products[productIdx].id;
                        }
                        else if (this.products[productIdx].name == map['products_needed_e' as any] && this.products[productIdx].item_num == map['item_num_5']){
                            console.log("MATCH E ", this.products[productIdx].id)
                            map['products_needed_e' as any] = this.products[productIdx].id;
                        }
                        else if (this.products[productIdx].name == map['products_needed_f' as any] && this.products[productIdx].item_num == map['item_num_6']){
                            console.log("MATCH F ", this.products[productIdx].id)
                            map['products_needed_f' as any] = this.products[productIdx].id;
                        }
                    }
                    
                    //console.log(map.name);
                    content.push(map); 
                }

                console.log("RESULTS: ", results);
                console.log("RESULTS LENGTH: ", results.data.length);
                console.log(Object.keys(content[0]).length)
                console.log("CONTENT: ", content);
                //console.log("TESTING: ", content[0].testing)
                console.log("CONTENT LENGTH:", content.length);

                console.log("DATA IMPORTED")
                return content;
            }.bind(this)
        });
    },

    async rawProductKeyParse(file: any){
        console.log(file);
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

                
                //results.data.length
                for (let dataIdx = 0; dataIdx<results.data.length; dataIdx++){
                    //console.log(results.data[0][this.columns[k].header]);
                    //results.data[dataIdx]['name'] = results.data[dataIdx]['Name'];
                    let map = [];

                    map['name' as any] = "";
                    map['item_num' as any] = "";
                    map['vendor' as any] = "";	
                    map['weight_lbs' as any] = "";
                    map['box_type' as any] = "";
                    map['box_cost' as any] = "";
                    map['bag_size' as any] = "";
                    map['bag_cost' as any] = "";
                    map['price_2021' as any] = "";
                    map['price_2022' as any] = "";
                    map['price_2023' as any] = "";
                    map['notes' as any] = "";
                    map['date_added' as any] = "";
                    map['upc' as any] = "";
                    map['fnsku' as any] = "";
                    map['asin' as any] = "";
                    map['do_we_carry' as any] = "";
                    map['process_time_per_unit_sec' as any] = "";
                    map['meltable' as any] = "";
                    map['map' as any] = "";
                    map['in_shipping_cost' as any] = "";
                    map['out_shipping_cost' as any] = "";
                    map['labor_cost' as any] = "";
                    map['item_cost' as any] = "";
                    map['misc_cost' as any] = "";
                    map['amz_fees_cost' as any] = "";
                    map['amz_fulfilment_cost' as any] = "";
                    map['30_day_storage_cost' as any] = "";
                    map['holiday_storage_cost' as any] = "";
                    map['total_cost' as any] = "";
                    map['total_holiday_cost' as any] = "";
                    map['products_needed_a' as any] = "";
                    map['qty_1' as any] = "";
                    map['products_needed_b' as any] = "";
                    map['qty_2' as any] = "";
                    map['products_needed_c' as any] = "";
                    map['qty_3' as any] = "";
                    map['products_needed_d' as any] = "";
                    map['qty_4' as any] = "";
                    map['products_needed_e' as any] = "";
                    map['qty_5' as any] = "";
                    map['products_needed_f' as any] = "";
                    map['qty_6' as any] = "";
                    map['default_units_per_case' as any] = "";

                    map['vendor' as any] = results.data[dataIdx]['Vendor'];
                    map['name' as any] = results.data[dataIdx]['Product Name'];
                    map['item_num' as any] = results.data[dataIdx]['item #'];
                    map['price_2023' as any] = results.data[dataIdx]['2023 Price'];
                    map['price_2022' as any] = results.data[dataIdx]['2022 AUG Price'];
                    map['price_2021' as any] = results.data[dataIdx]['2021 Price'];
                    map['default_units_per_case' as any] = results.data[dataIdx]['Units Per Case'];
                    map['map' as any] = results.data[dataIdx]['MAP'];
                    map['notes' as any] = results.data[dataIdx]['Notes'];
                    map['upc' as any] = results.data[dataIdx]['UPC'];

                    //await action.addProduct(map);

                    content.push(map); 
                }

                console.log("RESULTS: ", results);
                console.log("RESULTS LENGTH: ", results.data.length);
                console.log(Object.keys(content[0]).length)
                console.log("CONTENT: ", content);
                console.log("CONTENT LENGTH:", content.length);

                console.log("DATA IMPORTED")
                return content;
            }.bind(this)
        });
    },

    async ProcessedProductListParse(file: any){
        console.log(file);
        return Papa.parse(file, {
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
                for (let dataIdx = 0; dataIdx<results.data.length; dataIdx++){
                    //console.log(results.data[0][this.columns[k].header]);
                    //results.data[dataIdx]['name'] = results.data[dataIdx]['Name'];
                    let map = [] as any[];

                    map['name' as any] = "";
                    map['item_num' as any] = "";
                    map['vendor' as any] = "";	
                    map['weight_lbs' as any] = "";
                    map['box_type' as any] = "";
                    map['box_cost' as any] = "";
                    map['bag_size' as any] = "";
                    map['bag_cost' as any] = "";
                    map['price_2021' as any] = "";
                    map['price_2022' as any] = "";
                    map['price_2023' as any] = "";
                    map['notes' as any] = "";
                    map['date_added' as any] = "";
                    map['upc' as any] = "";
                    map['fnsku' as any] = "";
                    map['asin' as any] = "";
                    map['do_we_carry' as any] = "";
                    map['process_time_per_unit_sec' as any] = "";
                    map['meltable' as any] = "";
                    map['map' as any] = "";
                    map['in_shipping_cost' as any] = "";
                    map['out_shipping_cost' as any] = "";
                    map['labor_cost' as any] = "";
                    map['item_cost' as any] = "";
                    map['misc_cost' as any] = "";
                    map['amz_fees_cost' as any] = "";
                    map['amz_fulfilment_cost' as any] = "";
                    map['30_day_storage_cost' as any] = "";
                    map['holiday_storage_cost' as any] = "";
                    map['total_cost' as any] = "";
                    map['total_holiday_cost' as any] = "";
                    map['products_needed_a' as any] = "";
                    map['qty_1' as any] = "";
                    map['products_needed_b' as any] = "";
                    map['qty_2' as any] = "";
                    map['products_needed_c' as any] = "";
                    map['qty_3' as any] = "";
                    map['products_needed_d' as any] = "";
                    map['qty_4' as any] = "";
                    map['products_needed_e' as any] = "";
                    map['qty_5' as any] = "";
                    map['products_needed_f' as any] = "";
                    map['qty_6' as any] = "";
                    map['default_units_per_case' as any] = "";

                    map['status' as any] = results.data[dataIdx]['Status'];
                    map['location' as any] = results.data[dataIdx]['Location'];
                    map['space' as any] = results.data[dataIdx]['Space'];
                    map['vendor' as any] = results.data[dataIdx]['Vendor'];
                    map['asin' as any] = results.data[dataIdx]['ASIN'];
                    map['item' as any] = results.data[dataIdx]['Item'];
                    map['fnsku' as any] = results.data[dataIdx]['FNSKU'];
                    map['notes' as any] = results.data[dataIdx]['Notes'];
                    map['default_units_per_case' as any] = results.data[dataIdx]['Units per case'];
                    map['number_of_case' as any] = results.data[dataIdx]['Number of cases'];
                    map['total_units' as any] = results.data[dataIdx]['Total Units'];
                    map['cost' as any] = results.data[dataIdx]['Cost'];
                    map['total' as any] = results.data[dataIdx]['Total'];
                    map['weight_lbs' as any] = results.data[dataIdx]['Weight (lbs)'];
                    map['box_type' as any] = results.data[dataIdx]['Box type'];
                    map['bag_size' as any] = results.data[dataIdx]['Bag Size'];
        
                    for(let caseIdx = 0; caseIdx<map['number_of_cases']; caseIdx++){
                        
                    }
                    
                    content.push(map); 
                }

                console.log("RESULTS: ", results);
                console.log("RESULTS LENGTH: ", results.data.length);
                console.log(Object.keys(content[0]).length)
                console.log("CONTENT: ", content);
                console.log("CONTENT LENGTH:", content.length);

                console.log("DATA IMPORTED");
                return content;
            }.bind(this)
        });
    },

    async UnprocessedProductListParse(file: any){
        console.log(file);
        return Papa.parse(file, {
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
                for (let dataIdx = 0; dataIdx<results.data.length; dataIdx++){
                    //console.log(results.data[0][this.columns[k].header]);
                    //results.data[dataIdx]['name'] = results.data[dataIdx]['Name'];
                    let map = [] as any[];

                    map['name' as any] = "";
                    map['item_num' as any] = "";
                    map['vendor' as any] = "";	
                    map['weight_lbs' as any] = "";
                    map['box_type' as any] = "";
                    map['box_cost' as any] = "";
                    map['bag_size' as any] = "";
                    map['bag_cost' as any] = "";
                    map['price_2021' as any] = "";
                    map['price_2022' as any] = "";
                    map['price_2023' as any] = "";
                    map['notes' as any] = "";
                    map['date_added' as any] = "";
                    map['upc' as any] = "";
                    map['fnsku' as any] = "";
                    map['asin' as any] = "";
                    map['do_we_carry' as any] = "";
                    map['process_time_per_unit_sec' as any] = "";
                    map['meltable' as any] = "";
                    map['map' as any] = "";
                    map['in_shipping_cost' as any] = "";
                    map['out_shipping_cost' as any] = "";
                    map['labor_cost' as any] = "";
                    map['item_cost' as any] = "";
                    map['misc_cost' as any] = "";
                    map['amz_fees_cost' as any] = "";
                    map['amz_fulfilment_cost' as any] = "";
                    map['30_day_storage_cost' as any] = "";
                    map['holiday_storage_cost' as any] = "";
                    map['total_cost' as any] = "";
                    map['total_holiday_cost' as any] = "";
                    map['products_needed_a' as any] = "";
                    map['qty_1' as any] = "";
                    map['products_needed_b' as any] = "";
                    map['qty_2' as any] = "";
                    map['products_needed_c' as any] = "";
                    map['qty_3' as any] = "";
                    map['products_needed_d' as any] = "";
                    map['qty_4' as any] = "";
                    map['products_needed_e' as any] = "";
                    map['qty_5' as any] = "";
                    map['products_needed_f' as any] = "";
                    map['qty_6' as any] = "";
                    map['default_units_per_case' as any] = "";

                    map['status' as any] = results.data[dataIdx]['Status'];
                    map['location' as any] = results.data[dataIdx]['Location'];
                    map['space' as any] = results.data[dataIdx]['Space'];
                    map['vendor' as any] = results.data[dataIdx]['Vendor'];
                    map['description' as any] = results.data[dataIdx]['Description'];
                    map['notes' as any] = results.data[dataIdx]['Notes'];
                    map['default_units_per_case' as any] = results.data[dataIdx]['Units Per Case'];
                    map['number_of_cases' as any] = results.data[dataIdx]['Number of Cases'];
                    map['total_units' as any] = results.data[dataIdx]['Total Units'];
                    map['cost' as any] = results.data[dataIdx]['Cost'];
                    map['total' as any] = results.data[dataIdx]['Total'];
                    
                    for(let caseIdx = 0; caseIdx<map['number_of_cases']; caseIdx++){
                        
                    }

                    content.push(map);
                    
                }

                console.log("RESULTS: ", results);
                console.log("RESULTS LENGTH: ", results.data.length);
                console.log(Object.keys(content[0]).length)
                console.log("CONTENT: ", content);
                console.log("CONTENT LENGTH:", content.length);

                console.log("DATA IMPORTED")

                return content;
            }.bind(this)
        });
    }

}

export default importAction
