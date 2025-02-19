import { requiredUnless } from "@vuelidate/validators";
import axios from "axios";
import { supabase } from "@/clients/supabase";
import type { NumericLiteral } from "typescript";
// import { error } from "console";

const BASE_URL = "http://localhost:5000";

var action = {
    //AUTHENTICATION COMMANDS----------------------------------------------------------------------------------------
    //Add a user
    async addUser(u: any){
        //console.log(this.product);
        return axios.post(BASE_URL+"/users/create", {
            username: u.username,
            password: u.password
        }).then((res) => {
            //location.reload();
            //this.refreshData();
            console.log(res);

        }).catch(error => {
            console.log(error);
        });
    },

    async validatePassword(u: any){
        //console.log(this.product);
        return axios.post(BASE_URL+"/users/validate", {
            username: u.username,
            password: u.password
        },{
            withCredentials: true, // Now this is was the missing piece in the client side 
          }).then((res) => {
            //location.reload();
            //this.refreshData();
            console.log(res);
            return res.data;

        }).catch(error => {
            console.log(error.response);
            throw error.response.data;
        });
    },

    async getSessionUser(){
        let sessionUser;
            
        return axios.get(BASE_URL+"/sessionUser").then(res => {
            console.log(res.data);
            sessionUser = res.data;
            //console.log(sessionUser);
            return sessionUser;
        }).catch(error => {
            console.log(error);
            throw error;
        });
    },

    async logOut(){
        return axios.post(BASE_URL+"/logout").then(res => {
            console.log(res);
            return res;
        }).catch(error => {
            console.log(error);
            throw error;
        });
    },

    //PRODUCT COMMANDS-----------------------------------------------------------------------------------------
    //Pulls all the products from the database using API
    async getProducts(){
        let products = [] as any[];

        // const {data, error} = await supabase.rpc('get_all_product_keys_with_vendors');
        const {data, error} = await supabase.rpc('get_all_product_keys');
        if(error){
            console.error('Error calling RPC:', error);
        } else {
            console.log('Products:', data);
            products = data;
        }

        return products;
            
        /* return axios.get(BASE_URL+"/products",{
            withCredentials: true, // Now this is was the missing piece in the client side 
          }).then(res => {
            products = res.data;

            //this.columns = Object.keys(this.products[0]);
            //was trying to separate the data pulled from DB from the data displayed, but it was screwing with validation and wasn't really working anyway
            //this.displayProducts = this.products;

            //console.log("Product List received\n",products);
            //console.log("Keys", Object.keys(products[1]));

            return products;
        }) */
    },

    // Currently broken
    async nameFilter(){
        const {data, error} = await supabase.rpc('name_filter_text',{name_string: 'yay', select_function: 'get_all_product_keys()'});
                if(error){
                    console.error('Error calling RPC:', error);
                } else {
                    console.log('Filtered Name Products:', data);
                }
    },

    async getProcProducts(){
        let products = [] as any[];

        const {data, error} = await supabase.rpc('get_proc_product_keys');
        if(error){
            console.error('Error calling RPC:', error);
        } else {
            console.log('Function executed successfully:', data);
            products = data;
        }

        return products;
    },

    async getUnprocProducts(){
        let products = [] as any[];

        const {data, error} = await supabase.rpc('get_raw_product_keys');
        if(error){
            console.error('Error calling RPC:', error);
        } else {
            console.log('Function executed successfully:', data);
            products = data;
        }

        return products;
    },

    // !!!!!!!!!!!!!!UNUSED!!!!!!!!!!!!!!!!!!!!!!
    //Used to search for a specific product by Id
    /* async getProductById(id: string){
        let specificProduct;
        //console.log(id);
        axios.get(BASE_URL+"/products/"+id)
        .then(res => {
            specificProduct = res.data,
            console.log(specificProduct);
        })
        .catch(error => {
            console.log(error);
        })

        return specificProduct;
    }, */

    //Posts a newly added product into the database using API
    async addProduct(p: any, r: any){ 

        console.log('Product: ', p, 'Recipe: ', r);

        let recipe_elements = r['recipeElements'];

        console.log('Recipe Elements: ', recipe_elements);

        let element_array = [] as any[];

        recipe_elements.forEach((element: any) => {
            console.log(element.product_id);
            if(element.product_id)
                element_array.push(element);
        });

        console.log('Recipe Element Array: ', element_array);

        let record_array = [
            p.name, 
            p.item_num, 
            p.vendor_id, 
            p.weight_lbs, 
            p.box_type, 
            p.box_cost, 
            p.bag_size, 
            p.bag_cost, 
            p.price_2021, 
            p.price_2022, 
            p.price_2023, 
            p.notes, 
            p.date_added, 
            p.upc, 
            p.fnsku, 
            p.asin, 
            p.do_we_carry, 
            p.process_time_per_unit_sec, 
            p.meltable, 
            p.map, 
            p.in_shipping_cost,
            p.out_shipping_cost, 
            p.labor_cost, 
            p.item_cost, 
            p.misc_cost, 
            p.amz_fees_cost, 
            p.amz_fulfilment_cost, 
            p.storage_cost_30_day, 
            p.holiday_storage_cost, 
            p.total_cost, 
            p.total_holiday_cost, 
            p.default_units_per_case, 
            p.status, 
            p.unit_box_cost
        ];

        let new_product = {} as any;

        //MOVE OVER TO THE addRecipe() FUNCTION AND THEN CALL THAT FUNCTION IN HERE
        if(element_array.length > 0){
            console.log('Created processed product');

            let recipe_2Darray = [] as any[];

            element_array.forEach((recipe_element: any) => {
                recipe_2Darray.push([
                    recipe_element.product_id,
                    recipe_element.qty
                ])
            })

            console.log('2D Array', recipe_2Darray);

            const {data, error} = await supabase.rpc('add_processed_product_text', {
                product_record: record_array,
                recipe_array: recipe_2Darray
            });
            if(error){
                console.error(error);
                throw error;
            } else {
                console.log('Successfully Added Processed Product: ', data);
                new_product = data;
            }
        } else {    
            console.log('Creating raw product');
            const {data, error} = await supabase.rpc('add_raw_product_text', {product_record: record_array});
            if(error){
                console.error('Error calling RPC:', error);
                throw error;
            } else {
                console.log('Newly Added Raw Product:', data);
                new_product = data;
            }
        }

        return new_product;
    },

    //Removes a product from the database using API
    async deleteProduct(id: string){

        const {data, error} = await supabase.rpc('delete_product_by_id', {record_id: id});
        if (error){
            console.error('Error calling RPC: ', error);
            throw error;
        } else {
            console.log('Record deleted ', data);
        }
    },

    //Updates an already existing product in the database using API
    async editProduct(p: any, r: any){

        console.log('Product: ', p, 'Recipe: ', r);

        let record_array = [
            p.product_id,
            p.name, 
            p.item_num, 
            p.vendor_id, 
            p.weight_lbs, 
            p.box_type, 
            p.box_cost, 
            p.bag_size, 
            p.bag_cost, 
            p.price_2021, 
            p.price_2022, 
            p.price_2023, 
            p.notes, 
            p.date_added, 
            p.upc, 
            p.fnsku, 
            p.asin, 
            p.do_we_carry, 
            p.process_time_per_unit_sec, 
            p.meltable, 
            p.map, 
            p.in_shipping_cost,
            p.out_shipping_cost, 
            p.labor_cost, 
            p.item_cost, 
            p.misc_cost, 
            p.amz_fees_cost, 
            p.amz_fulfilment_cost, 
            p.storage_cost_30_day, 
            p.holiday_storage_cost, 
            p.total_cost, 
            p.total_holiday_cost, 
            p.default_units_per_case, 
            p.status, 
            p.unit_box_cost
        ];

        let recipe_elements = r;

        console.log('Recipe Elements: ', recipe_elements);

        let element_array = [] as any[];

        if(recipe_elements){
            recipe_elements.forEach((element: any) => {
                console.log(element.product_id);
                if(element.product_id)
                    element_array.push(element);
            });
        }
        

        if(element_array.length >0){
            console.log('Updated Processed Product')

            console.log('Created processed product');

            let recipe_2Darray = [] as any[];

            element_array.forEach((recipe_element: any) => {
                recipe_2Darray.push([
                    recipe_element.recipe_element_id,
                    recipe_element.product_id,
                    recipe_element.qty,
                    recipe_element.recipe_id
                ])
            })

            const {data, error} = await supabase.rpc('edit_processed_product_text', {
                product_record: record_array,
                recipe_array: recipe_2Darray
            })
            if(error){
                console.error('Error calling RPC: ', error);
                throw error;
            } else {
                console.log('Processed Product Key updated: ', data);
            }

        } else {
            console.log('Updated Raw Product')
            const {data, error} = await supabase.rpc('edit_raw_product_text',{product_record: record_array})
            if(error){
                console.error('Error calling RPC: ', error);
                throw error;
            } else {
                console.log('Raw Product key updated: ', data);
            }
        }
    },

    //Batch delete products
    async batchDeleteProduct(p: any){
        //console.log(id);
        //if(confirm("Do you really want to delete?")){

        console.log(p);

        let id_array = [] as any[];

        p.forEach((record: any) => {
            if(record.product_id)
                id_array.push(record.product_id)
        });

        console.log('id array: ', id_array);

        const {data, error} = await supabase.rpc('batch_delete_products_by_id', {id_array: id_array});
        if(error){
            console.error('Error calling RPC: ', error);
            throw error;
        } else {
            console.log('Batch Product(s) deleted: ', data);
        }
    },
    
    //RECIPE COMMANDS---------------------------------------------------------------------------------------
    //Removes a product from the database using API
    /* async deleteRecipe(id: string){
        //console.log(id);
        //if(confirm("Do you really want to delete?")){
            return axios.delete(BASE_URL+"/recipes/"+id)
            .then(res => {
                //location.reload();
                //this.refreshData();
            })
            .catch(error => {
                console.log(error.response.data);
                console.log(error.request.data);
                console.log(error);
                //console.log("########################AXIOS ERROR##############################")
                throw error.response.data;
            })
        //}
    }, */

    //CASE COMMANDS-----------------------------------------------------------------------------------------
    //Get all cases
    async getCases(){
        console.log("IN GET CASES");

        const {data, error} = await supabase.rpc('get_boxes_and_cases');
        if(error){
            console.error('Error calling RPC: ', error);
            throw error;
        } else {
            console.log('Boxes and cases: ', data)
            return data;
        }
    },

    //variables have to be named c rather than case because 
    //case is reserved and can't be used as a variable name
    //
    async getProcCases(){
        const {data, error} = await supabase.rpc('get_cases_by_type', {processed: true});
        if(error){
            console.error('Error calling RPC: ', error);
            throw error;
        } else {
            console.log('Processed cases: ', data);
            return data;
        }
    },

    async getUnprocCases(){
        const {data, error} = await supabase.rpc('get_cases_by_type', {processed: false});
        if(error){
            console.error('Error calling RPC: ', error);
            throw error;
        } else {
            console.log('Raw boxes: ', data);
            return data;
        }
    },

    //
    async getUnprocDeliveredBoxes(){
        const {data, error} = await supabase.rpc('get_delivered_cases_by_type', {processed: false});
        if(error){
            console.error('Error calling RPC: ', error);
            throw error;
        } else {
            console.log('Raw boxes (Delivered): ', data);
/*             
            const {count, error} = await supabase.rpc('get_table_count', {select_function: 'get_boxes_and_cases'});
                if(error){
                    console.error('Error calling RPC: ', error);
                    throw error;
                } else {
                    console.log('Boxes and cases Count: ', count)
                } */
            return data;
        }
    },

     //
     async getProcDeliveredCases(){
        const {data, error} = await supabase.rpc('get_delivered_cases_by_type', {processed: true});
        if(error){
            console.error('Error calling RPC: ', error);
            throw error;
        } else {
            console.log('Processed Cases (In house): ', data);
            return data;
        }
    },

    //
    async addCase(c: any){
        const {data, error} = await supabase.rpc('create_case',{record_array: [
            c.units_per_case,
            c.date_received,
            c.notes,
            c.product_id,
            c.location_id,
            c.status,
            c.purchase_order_id
        ]})
        if(error){
            console.error('Error calling RPC: ', error);
            throw error;
        } else {
            console.log('Box/Case created: ', data);
        }
    },

    //Add multiple cases at the same time
    async bulkCreateCases(c: any){
        const {data, error} = await supabase.rpc('bulk_create_cases',{record_array: [
            c.units_per_case,
            c.date_received,
            c.notes,
            c.product_id,
            c.location_id,
            c.status,
            c.purchase_order_id,
            c.amount
        ]})
        if(error){
            console.error('Error calling RPC: ', error);
            throw error;
        } else {
            console.log('Boxes/Cases created: ', data);
        }
    },

    //
    async bulkDeleteCase(id_array: number[]){
        const {data, error} = await supabase.rpc('bulk_delete_cases', {id_array: id_array})
        if(error){
            console.error('Error calling RPC: ', error);
            throw error;
        } else {
            console.log('Box(es)/Case(s) deleted: ', data);
        }
    },

    //
    async editCase(c: any){
        const {data, error} = await supabase.rpc('update_case',{record_array: [
            c.units_per_case,
            c.date_received,
            c.notes,
            c.product_id,
            c.location_id,
            c.status,
            c.case_id
        ]})
        if(error){
            console.error('Error calling RPC: ', error);
            throw error;
        } else {
            console.log('Box/Case updated: ', data);
        }
    },

     //Edit multiple cases at the same time
     async bulkEditCases(c: any){
        console.log(c);
        const {data, error} = await supabase.rpc('bulk_update_case',{record_array: c})
        if(error){
            console.error('Error calling RPC: ', error);
            throw error;
        } else {
            console.log('Box/Case updated: ', data);
        }
    },

    //Batch delete products
    async batchDeleteCases(c: any){
        //console.log(id);
        //if(confirm("Do you really want to delete?")){

            console.log(c);

            return axios.post(BASE_URL+"/cases/batchDelete", c)
            .then(res => {
                //location.reload();
                //this.refreshData();
            })
            .catch(error => {
                console.log(error.response.data);
                console.log(error.request.data);
                console.log(error);
                //console.log("########################AXIOS ERROR##############################")
                throw error.response.data;
            })
        //}
    },

    //PURCHASE ORDERS----------------------------------------------------------------------------------------
    //Gets purchase orders
    async getPurchaseOrders(){
        const {data, error} = await supabase.rpc('get_purchase_orders');
        if(error){
            console.error('Error calling RPC: ', error);
            throw error;
        } else {
            console.log('Purchase Orders: ', data);
            return data;
        }
    },

    //Create a purchase order
    async addPurchaseOrder(purchaseOrder: any){
        //console.log(this.product);
        return axios.post(BASE_URL+"/purchaseOrders/create", {
            purchase_order_name: purchaseOrder.purchase_order_name,
            status: purchaseOrder.status,
            notes: purchaseOrder.notes,
            date_ordered: purchaseOrder.date_ordered,
            date_received: purchaseOrder.date_received,
            vendor_id: purchaseOrder.vendor_id,
            discount: purchaseOrder.discount,
        }).then((res) => {
            console.log(res);
            return res.data[0]['LAST_INSERT_ID()'];

        }).catch(error => {
            console.log(error);
            throw error;
        });
    },

    //Edit a purchase order
    async editPurchaseOrder(purchaseOrder: any){
        return axios.put(BASE_URL+"/purchaseOrders/"+purchaseOrder.purchase_order_id, {
            purchase_order_name: purchaseOrder.purchase_order_name,
            status: purchaseOrder.status,
            notes: purchaseOrder.notes,
            date_ordered: purchaseOrder.date_ordered,
            date_received: purchaseOrder.date_received,
            vendor_id: purchaseOrder.vendor_id,
            discount: purchaseOrder.discount,
        }).then((res) => {
            //console.log(product_id);
            //location.reload();
            //this.refreshData();
            //this.editId = '';
        }).catch(error => {
            console.log(error);
            throw error;
        });
    },

    //Delete a purchase order
    async deletePurchaseOrder(id: any){
        return axios.delete(BASE_URL+"/purchaseOrders/"+id)
        .catch(error => {
            console.log(error);
        })
    },

    //Get Purchase Order Recipes
    async getPurchaseOrderRecipes(){
        return axios.get(BASE_URL+"/purchaseOrderRecipes").then(res => {
            let poRecipes = res.data;
            //console.log("PO RECIPES ", poRecipes)
            return poRecipes;
        })
    },

    //Add a Purchase Order Recipe
    async addPurchaseOrderRecipe(poRecipe: any){
        return axios.post(BASE_URL+"/purchaseOrderRecipes/create", {
            purchase_order_id: poRecipe.purchase_order_id,
            recipe_id: poRecipe.recipe_id,
            qty: poRecipe.qty
        }).then((res) => {
            console.log(res);
            return res.data;
        }).catch(error => {
            console.log(error);
            throw error;
        });
    },

    //Edit a Purchase Order Recipe
    async editPurchaseOrderRecipe(poRecipe: any){
        return axios.put(BASE_URL+"/purchaseOrderRecipes/"+poRecipe.po_recipe_id, {
            purchase_order_id: poRecipe.purchase_order_id,
            recipe_id: poRecipe.recipe_id,
            qty: poRecipe.qty
        }).then((res) => {
            console.log(res);
            return res.data;
        }).catch(error => {
            console.log(error);
            throw error;
        });
    },

    //Add multiple cases at the same time
    async bulkAddPurchaseOrderRecipe(poRecipe: any){
        return axios.post(BASE_URL+"/purchaseOrderRecipes/bulk",poRecipe).catch(error => {
            console.log(error);
        });
    },

    //VENDORS--------------------------------------------------------------------------------------------
    //Get vendors
    async getVendors(){
        const {data, error} = await supabase.rpc('get_vendors');
        if(error){
            console.error('Error calling RPC:', error);
        } else {
            console.log('Vendors:', data);
            return data;
        }
    },

    //Add a vendor
    async addVendor(vendor: any){
        return axios.post(BASE_URL+"/vendors/create", {
            vendor_name: vendor.vendor_name,
            vendor_nickname: vendor.vendor_nickname,
            contact_email: vendor.contact_email,
            contact_name: vendor.contact_name
        }).then((res) => {
            console.log(res);
            return res.data;

        }).catch(error => {
            console.log(error);
            throw error;
        });
    },

    //Edit a vendor
    async editVendor(vendor: any){
        return axios.put(BASE_URL+"/vendors/"+vendor.vendor_id, {
            vendor_name: vendor.vendor_name,
            vendor_nickname: vendor.vendor_nickname,
            contact_email: vendor.contact_email,
            contact_name: vendor.contact_name
        }).then((res) => {
            console.log(res);
            return res.data;

        }).catch(error => {
            console.log(error);
            throw error;
        });
    },

    //RECIPES--------------------------------------------------------------------------------------------
    //Get recipes
    async getRecipes(){
        const {data, error} = await supabase.rpc('get_recipes');
        if(error){
            console.error('Error calling RPC:', error);
        } else {
            console.log('RECIPES:', data);
            return data;
        }
    },

    //Get recipe elements
    async getRecipeElements(){
        const {data, error} = await supabase.rpc('get_recipe_elements');
        if(error){
            console.error('Error calling RPC:', error);
        } else {
            console.log('RECIPE ELEMENTS: ', data);
            return data;
        }
    },

    /* //Add a new recipe
    async addRecipe(recipe: any){
        return axios.post(BASE_URL+"/", {
            product_needed: recipe.product_needed,
            units_needed: recipe.units_needed,
            product_made: recipe.product_made,
        }).then((res) => {
            console.log(res);
            return res.data;

        }).catch(error => {
            console.log(error);
            throw error;
        });
    }, */

    //LOCATIONS------------------------------------------------------------------------------------------
    //Get locations
    async getLocations(){
        const {data, error} = await supabase.rpc('get_locations');
        if(error){
            console.error('Error calling RPC:', error);
        } else {
            console.log('LOCATIONS:', data);
            return data;
        }
    },

    //Add a location
    async addLocation(location: any){
        const {data, error} = await supabase.rpc('add_location', {location_record: [location.name]});
        if(error){
            console.error('Error calling RPC:', error);
        } else {
            console.log('LOCATION ADDED:', data);
            return data;
        }
    },

    //Edit a location
    async editLocation(location: any){
        return axios.put(BASE_URL+"/locations/"+location.location_id, {
            name: location.name,
        }).then((res) => {
            console.log(res);
            return res.data;

        }).catch(error => {
            console.log(error);
            throw error;
        });
    },

    //REQUESTS--------------------------------------------------------------------------------------------
    // Get requests
    async getRequests(){
        return axios.get(BASE_URL+"/requests").then(res => {
            const requests = res.data;
            //console.log("LOCATIONS ", locations)
            return requests;
        })
    },

    // Create a request
    async addRequest(request: {
        product_id: number; 
        purchase_order_id: number;
        notes: string, 
        status: string,
        labels_printed: boolean; 
        ship_label: boolean; 
        priority: string; 
        ship_to_amz: number; 
        deadline: Date; 
        warehouse_qty: number;
    }){
        return axios.post(BASE_URL+"/requests/create", {
            product_id: request.product_id,
            purchase_order_id: request.purchase_order_id,
            notes: request.notes,
            status: request.status,
            labels_printed: request.labels_printed,
            ship_label: request.ship_label,
            priority: request.priority,
            ship_to_amz: request.ship_to_amz,
            deadline: request.deadline,
            warehouse_qty: request.warehouse_qty,
        }).then((res) => {
            console.log(res);
            return res.data;

        }).catch(error => {
            console.log(error);
            throw error;
        });
    },

    // Update a request
    async editRequest(request: {
        request_id: number; 
        product_id: number; 
        purchase_order_id: number; 
        notes: string, 
        status: string,
        labels_printed: boolean; 
        ship_label: boolean; 
        priority: string; 
        ship_to_amz: number; 
        deadline: Date; 
        warehouse_qty: number;
    }){
        return axios.put(BASE_URL+"/requests/"+request.request_id, {
            product_id: request.product_id,
            purchase_order_id: request.purchase_order_id,
            notes: request.notes,
            status: request.status,
            labels_printed: request.labels_printed,
            ship_label: request.ship_label,
            priority: request.priority,
            ship_to_amz: request.ship_to_amz,
            deadline: request.deadline,
            warehouse_qty: request.warehouse_qty,
        }).then((res) => {
            console.log(res);
            return res.data;

        }).catch(error => {
            console.log(error);
            throw error;
        });
    },

    //Delete a request
    async deleteRequest(id: number){
        return axios.delete(BASE_URL+"/requests/"+id)
        .catch(error => {
            console.log(error);
        })
    },

    // Batch insert requests into the database
    async batchInsertRequests(request: any[]){
        return axios.post(BASE_URL+"/requests/batchInsert",request).catch(error => {
            console.log(error);
        });
    },

    // Batch update requests into the database
    async batchUpdateRequests(request: any[]){
        return axios.post(BASE_URL+"/requests/batchUpdate",request).catch(error => {
            console.log(error);
        });
    },

    //PICKLISTS--------------------------------------------------------------------------------------------
    // Get picklists
    async getPicklists(){
        return axios.get(BASE_URL+"/picklists").then(res => {
            const picklists = res.data;
            //console.log("LOCATIONS ", locations)
            return picklists;
        })
    },

    // Create a picklist
    async addPicklist(picklist: {
        label: string; 
    }){
        return axios.post(BASE_URL+"/picklists/create", {
            label: picklist.label
        }).then((res) => {
            console.log(res);
            return res.data;

        }).catch(error => {
            console.log(error);
            throw error;
        });
    },

    // Update a picklist
    // router.put("/picklists/:id", updatePicklist);
    async editPicklist(picklist: {
        picklist_id: number;
        label: string; 
    }){
        return axios.put(BASE_URL+"/picklists/"+picklist.picklist_id, {
            label: picklist.label
        }).then((res) => {
            console.log(res);
            return res.data;

        }).catch(error => {
            console.log(error);
            throw error;
        });
    },

    // Delete a picklist
    // router.delete("/picklists/:id", deletePicklist);
    async deletePicklist(id: number){
        return axios.delete(BASE_URL+"/picklists/"+id)
        .catch(error => {
            console.log(error);  
        })
    },

    // Get picklist elements
    async getPicklistElements(){
        return axios.get(BASE_URL+"/picklistElements").then(res => {
            const picklistElements = res.data;
            //console.log("LOCATIONS ", locations)
            return picklistElements;
        })
    },

    // Create a picklist element
    async addPicklistElement(picklistElement: {
        picklist_id: number;
        recipe_id: number;
        case_qty: number;
        notes: string;
    }){
        return axios.post(BASE_URL+"/picklistElements/create", {
            picklist_id: picklistElement.picklist_id,
            recipe_id: picklistElement.recipe_id,
            case_qty: picklistElement.case_qty,
            notes: picklistElement.notes
        }).then((res) => {
            return res.data;
        }).catch(error => {
            console.log(error);
            throw error;
        });
    },

    // Update a picklist element
    // router.put("/picklistElements/:id", updatePicklistElement);
    async updatePicklistElement(picklistElement: {
        picklist_element_id: number;
        picklist_id: number;
        recipe_id: number;
        case_qty: number;
        notes: string;
    }){
        return axios.put(BASE_URL+"/picklistElements/"+picklistElement.picklist_element_id, {
            picklist_id: picklistElement.picklist_id,
            recipe_id: picklistElement.recipe_id,
            case_qty: picklistElement.case_qty,
            notes: picklistElement.notes
        }).then((res) => {
            return res.data;
        }).catch(error => {
            console.log(error);
            throw error;
        });
    },

    // Delete a picklist element
    // router.delete("/picklistElements/:id", deletePicklistElement);
    async deletePicklistElement(id: number){
        return axios.delete(BASE_URL+"/picklistElements"+id)
        .catch(error => {
            console.log(error);
            throw error;
        });
    },

    // Batch insert picklist elements
    // router.post("/picklistElements/batchInsert", batchInsertPicklistElements)
    async batchInsertPicklistElements(picklistElement: {
        picklist_id: number;
        recipe_id: number;
        case_qty: number;
        notes: string;
    }){
        return axios.post(BASE_URL+"/picklistElements/batchInsert", picklistElement)
        .catch(error => {
            console.log(error);
            throw error;
        });
    },

    // Batch update picklist elements
    // router.post("/picklistElements/batchUpdate", batchUpdatePicklistElements);
    async batchUpdatePicklistElements(picklistElement: {
        picklist_element_id: number;
        picklist_id: number;
        recipe_id: number;
        case_qty: number;
        notes: string;
    }){
        return axios.post(BASE_URL+"/picklistElements/batchUpdate", picklistElement)
        .catch(error => {
            console.log(error);
            throw error;
        });
    },

}

export default action;