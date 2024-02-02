import { requiredUnless } from "@vuelidate/validators";
import axios from "axios";

var action = {
    //AUTHENTICATION COMMANDS----------------------------------------------------------------------------------------
    //Add a user
    async addUser(u: any){
        //console.log(this.product);
        return axios.post("http://localhost:5000/users/create", {
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
        return axios.post("http://localhost:5000/users/validate", {
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

    //PRODUCT COMMANDS-----------------------------------------------------------------------------------------
    //Pulls all the products from the database using API
    async getProducts(){
        let products;
            
        return axios.get("http://localhost:5000/products").then(res => {
            products = res.data;

            //this.columns = Object.keys(this.products[0]);
            //was trying to separate the data pulled from DB from the data displayed, but it was screwing with validation and wasn't really working anyway
            //this.displayProducts = this.products;

            console.log("Product List Recieved\n",products);
            console.log("Keys", Object.keys(products[1]));

            return products;
        })
    },

    async getProcProducts(){
        let products;

        return axios.get("http://localhost:5000/products/processed").then(res => {
            products = res.data
            console.log(products);
            return products;
        });

    },

    async getUnprocProducts(){
        let products;

        return axios.get("http://localhost:5000/products/unprocessed").then(res => {
            products = res.data
            console.log(products);
            return products;
        })
    },

    //Used to search for a specific product by Id
    async getProductById(id: string){
        let specificProduct;
        //console.log(id);
        axios.get("http://localhost:5000/products/"+id)
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
    async addProduct(p: any){
            
        //console.log("UPC ______ ", this.upc);
        //console.log(this.fnsku);
            return axios.post("http://localhost:5000/products/create", {
            name: p.name,
            asin: p.asin,
            fnsku: p.fnsku,
            upc: p.upc,
            notes: p.notes,
            '30_day_storage_cost': p['30_day_storage_cost'],
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
            weight_lbs: p.weight_lbs

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
            return axios.delete("http://localhost:5000/products/"+id)
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
    async editProduct(p: any){

        console.log("PRODUCT NAME ", p.name);
        /* console.log(value.asin);
        console.log(value.fnsku);
        console.log(value.upc);
        console.log(value.notes); */
        console.log("PRODUCTS NEEDED A ",p.products_needed_a);
        return axios.put("http://localhost:5000/products/"+p.id, {
            name: p.name,
            asin: p.asin,
            fnsku: p.fnsku,
            upc: p.upc,
            notes: p.notes,
            '30_day_storage_cost': p['30_day_storage_cost'],
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
            weight_lbs: p.weight_lbs

        }).then((res) => {
            //location.reload();
            //this.refreshData();
            //this.editId = '';
            //alert("AHHH");
            console.log(res);
        }).catch(error => {
            console.log(error);
        });
    },

    //CASE COMMANDS-----------------------------------------------------------------------------------------
    //Get all cases
    getCases(){
        let cases;
        console.log("IN GET CASES");

        return axios.get("http://localhost:5000/cases").then(res => {
            cases = res.data;

            console.log('TESTING-------------------')
            console.log("Case List Recieved\n",cases);
            console.log("Keys", Object.keys(cases[1]));
            //console.log(this.cases.date_recieved.getMonth());

            return cases;
        })
    },
    
    //variables have to be named c rather than case because 
    //case is reserved and can't be used as a variable name
    //
    async getProcCases(){
        let cases;

        return axios.get("http://localhost:5000/cases/processed").then(res => {
            cases = res.data;
            console.log(cases);

            console.log(cases[0].date_recieved);

            console.log('TESTING-------------------')
            //console.log(this.cases.date_recieved.getMonth());

            return cases;
        })
    },

    async getUnprocCases(){
        let cases;
            
        return axios.get("http://localhost:5000/cases/unprocessed").then(res => {
            cases = res.data;
            console.log(cases);
            return cases;
        });
    },

    //
    async addCase(c: any){
        //console.log(this.product);
        return axios.post("http://localhost:5000/cases/create", {
            product_id: c.product_id,
            units_per_case: c.units_per_case,
            location: c.location,
            notes: c.notes,
            date_recieved: c.date_recieved,
        }).then((res) => {
            //location.reload();
            //this.refreshData();

        }).catch(error => {
            console.log(error);
        });
    },

    //
    async deleteCase(id: string){
        console.log(id);
        //if(confirm("Do you really want to delete?")){
        return axios.delete("http://localhost:5000/cases/"+id)
        .catch(error => {
            console.log(error);
        })
        //}
        //location.reload();
        //this.refreshData();
    },

    //
    async editCase(c: any){

        return axios.put("http://localhost:5000/cases/"+c.id, {
            product_id: c.product_id,
            units_per_case: c.units_per_case,
            location: c.location,
            notes: c.notes,
            date_recieved: c.date_recieved,

        }).then((res) => {
            //console.log(product_id);
            //location.reload();
            //this.refreshData();
            //this.editId = '';
        }).catch(error => {
            console.log(error);
        });
    },

    //
}

export default action;