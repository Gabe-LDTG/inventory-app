import { requiredUnless } from "@vuelidate/validators";
import axios from "axios";

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
        let products;
            
        return axios.get(BASE_URL+"/products",{
            withCredentials: true, // Now this is was the missing piece in the client side 
          }).then(res => {
            products = res.data;

            //this.columns = Object.keys(this.products[0]);
            //was trying to separate the data pulled from DB from the data displayed, but it was screwing with validation and wasn't really working anyway
            //this.displayProducts = this.products;

            //console.log("Product List received\n",products);
            //console.log("Keys", Object.keys(products[1]));

            return products;
        })
    },

    async getProcProducts(){
        let products;

        return axios.get(BASE_URL+"/products/processed").then(res => {
            products = res.data
            console.log(products);
            return products;
        });

    },

    async getUnprocProducts(){
        let products;

        return axios.get(BASE_URL+"/products/unprocessed").then(res => {
            products = res.data
            console.log(products);
            return products;
        })
    },

    //Used to search for a specific product by Id
    async getProductById(id: string){
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
    },

    //Posts a newly added product into the database using API
    async addProduct(p: any, r: any){            
        //console.log("UPC ______ ", this.upc);
        //console.log(this.fnsku);
        let addedProductId = await axios.post(BASE_URL+"/products/create", {
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
        });

        //console.log(addedProductId.data[0]['LAST_INSERT_ID()']);
        if(r){
            for(let recIdx = 0; recIdx < r.length; recIdx++){
                axios.post(BASE_URL+"/recipes/create",{
                    product_needed: r[recIdx].product_needed,
                    units_needed: r[recIdx].units_needed,
                    product_made: addedProductId.data[0]['LAST_INSERT_ID()'],
                })
            }
        }
        return addedProductId.data[0]['LAST_INSERT_ID()'];
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

        //let convertedP = JSON.stringify(p);

        //console.log("CONVERTED", convertedP);
        return axios.post(BASE_URL+"/products/batchInsert", p).then((res) => {
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

            console.log('TESTING-------------------')
            console.log("Case List received\n",cases);
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

            if(cases){
                console.log(cases);

                //console.log(cases[0].date_received);
            }

            console.log('TESTING-------------------')
            //console.log(this.cases.date_received.getMonth());

            return cases;
        })
    },

    async getUnprocCases(){
        let cases;
            
        return axios.get(BASE_URL+"/cases/unprocessed").then(res => {
            cases = res.data;
            console.log(cases);
            return cases;
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

    //PURCHASE ORDERS
    //Gets purchase orders
    async getPurchaseOrders(){
        let purchaseOrders;
            console.log("IN GET PURCHASE ORDERS");

            return axios.get(BASE_URL+"/purchaseOrders").then(res => {
                purchaseOrders = res.data;

                console.log('TESTING-------------------')
                console.log("Purchase Order List received\n",purchaseOrders);
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
            vendor: purchaseOrder.vendor,
        }).then((res) => {
            console.log(res);
            return res.data;

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
            vendor: purchaseOrder.vendor,
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

    //VENDORS--------------------------------------------------------------------------------------------
    //Get vendors
    async getVendors(){
        return axios.get(BASE_URL+"/vendors").then(res => {
            let vendors = res.data;
            console.log("VENDORS ", vendors)
            return vendors;
        })
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
        return axios.post(BASE_URL+"/vendors/"+vendor.vendor_id, {
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
        return axios.get(BASE_URL+"/recipes").then(res => {
            let recipes = res.data;
            //console.log("LOCATIONS ", recipes)
            return recipes;
        })
    },

    //Add a new recipe
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
    },

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

        }).catch(error => {
            console.log(error);
            throw error;
        });
    },

    //Edit a location
    async editLocation(location: any){
        return axios.post(BASE_URL+"/locations/"+location.location_id, {
            name: location.name,
        }).then((res) => {
            console.log(res);
            return res.data;

        }).catch(error => {
            console.log(error);
            throw error;
        });
    },
}

export default action;