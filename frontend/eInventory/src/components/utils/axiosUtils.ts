import { requiredUnless } from "@vuelidate/validators";
import axios from "axios";
import { supabase } from "@/clients/supabase";
import type { NumericLiteral } from "typescript";

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
        //console.log("UPC ______ ", this.upc);
        //console.log(this.fnsku);

        console.log('Product: ', p, 'Recipe: ', r);

        // Typescript is VERY strict, and so it will be skipped for now :                   )
        /* let product: {
            name: String; 
            item_num: String; 
            upc: String; 
            vendor_id: Number;
            price_2023: Number;
            price_2022: Number;
            price_2021: Number;
            default_units_per_case: Number;
            map: Number;
            notes: String;
        } = {
            p.name,
            p.item_num,
            p.upc,
            p.vendor_id,
            p.price_2023,
            p.price_2022,
            p.price_2021,
            p.default_units_per_case,
            p.map,
            p.notes,
        }; */

        let record_array = [
            p.name,
            p.item_num,
            p.upc,
            p.vendor,
            p.price_2023,
            p.price_2022,
            p.price_2021,
            p.default_units_per_case,
            p.map,
            p.notes,
        ];

        let new_product = {} as any;

        const {data, error} = await supabase.rpc('add_raw_product_text', {product_record: record_array});
        if(error){
            console.error('Error calling RPC:', error);
            throw error;
        } else {
            console.log('Newly Added Product:', data);
            new_product = data;
        }

        return new_product;

        // For now, the add product function will be split into two: raw and processed. Might combine later,
        // if it is deemed for effecient
        /* let addedProductId = await axios.post(BASE_URL+"/products/create", {
            name: p.name,
            asin: p.asin,
            fnsku: p.fnsku,
            upc: p.upc,
            notes: p.notes,
            storage_cost_30_day: p.storage_cost_30_day,
            amz_fees_cost: p.amz_fees_cost,
            amz_fulfilment_cost: p.amz_fulfilment_cost,
            bag_cost: p.bag_cost,
            bag_size: p.bag_size,
            box_cost: p.box_cost,
            box_type: p.box_type,
            date_added: p.date_added,
            do_we_carry: p.do_we_carry,
            default_units_per_case: p.default_units_per_case,
            holiday_storage_cost: p.holiday_storage_cost,
            in_shipping_cost: p.in_shipping_cost,
            item_cost: p.item_cost,
            item_num: p.item_num,
            labor_cost: p.labor_cost,
            map: p.map,
            meltable: p.meltable,
            misc_cost: p.misc_cost,
            out_shipping_cost: p.out_shipping_cost,
            price_2021: p.price_2021,
            price_2022: p.price_2022,
            price_2023: p.price_2023,
            process_time_per_unit_sec: p.process_time_per_unit_sec,
            total_cost: p.total_cost,
            total_holiday_cost: p.total_holiday_cost,
            vendor: p.vendor,
            weight_lbs: p.weight_lbs,
            unit_box_cost: p.unit_box_cost,

        }).catch(error => {
            console.log(error);
            throw error;
        }); */

        //console.log(addedProductId.data[0]['LAST_INSERT_ID()']);
        //MOVE OVER TO THE addRecipe() FUNCTION AND THEN CALL THAT FUNCTION IN HERE
        if(r){
            /* console.log(r);

            /*
            * r['label' as any] = p.name + ' - ' + p.fnsku;
            * r['vendor_id' as any] = p.vendor;
            
            
            r['label' as any] = p.name + ' - ' + p.fnsku;
            r['vendor_id' as any] = p.vendor;

            let procRecEl = {} as any;
            let recElArray = [] as any[];
            procRecEl['product_id' as any] = addedProductId.data[0]['LAST_INSERT_ID()'];
            procRecEl['qty' as any] = 1;
            procRecEl['type' as any] = 'output';

            r.recipeElements.push(procRecEl);

            procRecEl = {};

            let addedRecipeId = await axios.post(BASE_URL+"/recipes/create",{
                label: r.label,
                vendor_id: r.vendor_id
            })

            r.recipeElements.forEach(async (recEl: any) => {
                recEl['recipe_id' as any] = addedRecipeId.data[0]['LAST_INSERT_ID()']

                let result = {} as any;
                result = Object.values(recEl);
                console.log("RESULT ", result);

                recElArray.push(result);

                result = {};
            })

            await axios.post(BASE_URL+"/recipeElements/batchInsert", recElArray).catch(error => {
                console.log(error);
                throw error;
            }); */
            /* for(let recIdx = 0; recIdx < r.length; recIdx++){
                axios.post(BASE_URL+"/recipes/create",{
                    product_needed: r[recIdx].product_needed,
                    units_needed: r[recIdx].units_needed,
                    product_made: addedProductId.data[0]['LAST_INSERT_ID()'],
                })
            } */
        }
        
        // return addedProductId.data[0]['LAST_INSERT_ID()'];
    },

    //Posts a newly added product into the database using API
    async addRawProductKey(p: any){
            
        //console.log("UPC ______ ", this.upc);
        //console.log(this.fnsku);
            return axios.post(BASE_URL+"/products/create", {
                vendor: p.vendor,
                name: p.name,
                item_num: p.item_num,
                price_2023: p.price_2023,
                price_2022: p.price_2022,
                price_2021: p.price_2021,
                default_units_per_case: p.default_units_per_case,
                map: p.map,
                notes: p.notes,
                upc: p.upc,

            }).then((res) => {
                //location.reload();
                //setInterval(this.refreshData, 1000);

                // if ANY fail validation
                //this.displayCreate = false;
                //alert('Form successfully submitted.')
                //this.refreshData();
            }).catch(error => {
                console.log(error);
                throw error;
            });
    },

    //Removes a product from the database using API
    async deleteProduct(id: string){
        //console.log(id);
        //if(confirm("Do you really want to delete?")){
            return axios.delete(BASE_URL+"/products/"+id)
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

    //Updates an already existing product in the database using API
    async editProduct(p: any, r: any){

        console.log("PRODUCT NAME ", p.name);
        /* console.log(value.asin);
        console.log(value.fnsku);
        console.log(value.upc);
        console.log(value.notes); */
        console.log("PRODUCTS NEEDED A ",p.products_needed_a);
        return axios.put(BASE_URL+"/products/"+p.product_id, {
            name: p.name,
            asin: p.asin,
            fnsku: p.fnsku,
            upc: p.upc,
            notes: p.notes,
            'storage_cost_30_day': p['storage_cost_30_day'],
            amz_fees_cost: p.amz_fees_cost,
            amz_fulfilment_cost: p.amz_fulfilment_cost,
            bag_cost: p.bag_cost,
            bag_size: p.bag_size,
            box_cost: p.box_cost,
            box_type: p.box_type,
            date_added: p.date_added,
            do_we_carry: p.do_we_carry,
            holiday_storage_cost: p.holiday_storage_cost,
            in_shipping_cost: p.in_shipping_cost,
            item_cost: p.item_cost,
            item_num: p.item_num,
            labor_cost: p.labor_cost,
            map: p.map,
            meltable: p.meltable,
            misc_cost: p.misc_cost,
            out_shipping_cost: p.out_shipping_cost,
            price_2021: p.price_2021,
            price_2022: p.price_2022,
            price_2023: p.price_2023,
            process_time_per_unit_sec: p.process_time_per_unit_sec,
            products_needed_a: p.products_needed_a,
            qty_1: p.qty_1,
            products_needed_b: p.products_needed_b,
            qty_2: p.qty_2,
            products_needed_c: p.products_needed_c,
            qty_3: p.qty_3,
            products_needed_d: p.products_needed_d,
            qty_4: p.qty_4,
            products_needed_e: p.products_needed_e,
            qty_5: p.qty_5,
            products_needed_f: p.products_needed_f,
            qty_6: p.qty_6,
            total_cost: p.total_cost,
            total_holiday_cost: p.total_holiday_cost,
            vendor: p.vendor,
            weight_lbs: p.weight_lbs,
            unit_box_cost: p.unit_box_cost,

        }).then((res) => {
            console.log(res);

            if(r){
                for(let recIdx = 0; recIdx < r.length; recIdx++){
                    axios.put(BASE_URL+"/recipes/" + r[recIdx].recipe_id,{
                        product_needed: r[recIdx].product_needed,
                        units_needed: r[recIdx].units_needed,
                    })
                }
            }
        }).catch(error => {
            console.log(error);
        });
    },

    //Batch insert products
    async batchInsertProduct(p: any){
        console.log("BATCH PRODUCT ", p)
        return axios.post(BASE_URL+"/products/batchInsert", p).catch(error => {
            console.log(error);
            throw error;
        });
    },

    //Batch insert raw products
    async batchInsertRawProducts(p: any[]){
        let productArray = [] as any[];
        p.filter(p => p.name).forEach(product => {
            if(!product.notes)
                product.notes = null;
            if(!product.map)
                product.map = null;
            if(!product.price_2021)
                product.price_2021 = null;
            if(!product.price_2022)
                product.price_2022 = null;
            if(!product.price_2023)
                product.price_2023 = 0;
            let tempArray = [product.name, 
                product.upc, product.notes, 
                product.default_units_per_case, 
                product.item_num, product.map, 
                product.price_2021, product.price_2022, product.price_2023, 
                product.vendor]
            productArray.push(tempArray);
        })
        console.log("BATCH PRODUCT ", p)
        return axios.post(BASE_URL+"/products/batchInsertRaw", productArray).catch(error => {
            console.log(error);
            throw error;
        });
    },

    //Batch delete products
    async batchDeleteProduct(p: any){
        //console.log(id);
        //if(confirm("Do you really want to delete?")){

            console.log(p);

            return axios.post(BASE_URL+"/products/batchDelete", p)
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
    
    //RECIPE COMMANDS---------------------------------------------------------------------------------------
    //Removes a product from the database using API
    async deleteRecipe(id: string){
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
    },

    //CASE COMMANDS-----------------------------------------------------------------------------------------
    //Get all cases
    async getCases(){
        let cases;
        console.log("IN GET CASES");

        return axios.get(BASE_URL+"/cases").then(res => {
            cases = res.data;

            //console.log('TESTING-------------------')
            //console.log("Case List received\n",cases);
            //console.log("Keys", Object.keys(cases[1]));
            //console.log(this.cases.date_received.getMonth());

            return cases;
        })
    },
    
    async getCasesIds(){
        let cases;
        console.log("IN GET CASES");

        return axios.get(BASE_URL+"/cases/id").then(res => {
            cases = res.data;

            console.log('TESTING-------------------')
            console.log("Case List received\n",cases);
            console.log("Keys", Object.keys(cases[1]));
            //console.log(this.cases.date_received.getMonth());

            return cases;
        })
    },

    //variables have to be named c rather than case because 
    //case is reserved and can't be used as a variable name
    //
    async getProcCases(){
        let cases;

        return axios.get(BASE_URL+"/cases/processed").then(res => {
            cases = res.data;

            /* if(cases){
                console.log(cases);

                //console.log(cases[0].date_received);
            } */

            //console.log('TESTING-------------------')
            //console.log(this.cases.date_received.getMonth());

            return cases;
        })
    },

    async getUnprocCases(){
        let cases;
            
        return axios.get(BASE_URL+"/cases/unprocessed").then(res => {
            cases = res.data;
            //console.log(cases);
            return cases;
        });
    },

    //
    async getUnprocDeliveredBoxes(){
        let boxes;
            
        return axios.get(BASE_URL+"/cases/unprocessed/delivered").then(res => {
            boxes = res.data;
            //console.log(cases);
            return boxes;
        });
    },

     //
     async getProcDeliveredCases(){
        let boxes;
            
        return axios.get(BASE_URL+"/cases/processed/delivered").then(res => {
            boxes = res.data;
            //console.log(cases);
            return boxes;
        });
    },

    //
    async addCase(c: any){
        //console.log(this.product);
        return axios.post(BASE_URL+"/cases/create", {
            product_id: c.product_id,
            units_per_case: c.units_per_case,
            location: c.location,
            notes: c.notes,
            date_received: c.date_received,
            status: c.status,
            purchase_order_id: c.purchase_order_id,
        }).then((res) => {
            //location.reload();
            //this.refreshData();

        }).catch(error => {
            console.log(error);
        });
    },

    //Add multiple cases at the same time
    async bulkAddCases(c: any){
        return axios.post(BASE_URL+"/cases/bulk",c).catch(error => {
            console.log(error);
        });
    },

    //
    async deleteCase(id: string){
        //console.log(id);
        //if(confirm("Do you really want to delete?")){
        return axios.delete(BASE_URL+"/cases/"+id)
        .catch(error => {
            console.log(error);
        })
        //}
        //location.reload();
        //this.refreshData();
    },

    //
    async editCase(c: any){

        return axios.put(BASE_URL+"/cases/"+c.case_id, {
            product_id: c.product_id,
            units_per_case: c.units_per_case,
            location: c.location,
            notes: c.notes,
            date_received: c.date_received,
            status: c.status,

        }).then((res) => {
            //console.log(product_id);
            //location.reload();
            //this.refreshData();
            //this.editId = '';
        }).catch(error => {
            console.log(error);
        });
    },

     //Edit multiple cases at the same time
     async bulkEditCases(c: any){
        return axios.post(BASE_URL+"/cases/bulkUpdate",c).catch(error => {
            console.log(error);
        });
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
        let purchaseOrders;
            // console.log("IN GET PURCHASE ORDERS");

            return axios.get(BASE_URL+"/purchaseOrders").then(res => {
                purchaseOrders = res.data;

                // console.log('TESTING-------------------')
                // console.log("Purchase Order List received\n",purchaseOrders);
                //console.log("Keys", Object.keys(purchaseOrders[1]));
                //console.log(this.cases.date_received.getMonth());

                return purchaseOrders;
            })
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
        return axios.get(BASE_URL+"/locations").then(res => {
            let locations = res.data;
            //console.log("LOCATIONS ", locations)
            return locations;
        })
    },

    //Add a location
    async addLocation(location: any){
        return axios.post(BASE_URL+"/locations/create", {
            name: location.name,
        }).then((res) => {
            console.log(res);
            return res.data;

            //return addedProductId.data[0]['LAST_INSERT_ID()'];

        }).catch(error => {
            console.log(error);
            throw error;
        });
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