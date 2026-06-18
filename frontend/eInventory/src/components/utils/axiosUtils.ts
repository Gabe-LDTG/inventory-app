import { requiredUnless } from "@vuelidate/validators";
import axios from "axios";
import { supabase } from "@/clients/supabase";
import type { NumericLiteral } from "typescript";
import helper from "./helperUtils";
import type ProcessedCases from "@/views/ProcessedCases.vue";
// import { error } from "console";

const BASE_URL = "http://localhost:5000";

var action = {
    // AUTH COMMANDS--------------------------------------------------------------------------------------------
    async getSessionUser(){
        try {
            const { data, error } = await supabase.auth.getSession();
            if (error) {
                console.error('Error getting auth session:', error);
                return null;
            }

            return data?.session?.user ?? null;
        } catch (error) {
            console.error('Error getting auth session:', error);
            return null;
        }
    },

    async getSessionUserId(){
        const sessionUser = await this.getSessionUser();
        return sessionUser?.id ?? null;
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
    },

    async getProductsById(id_array: number[]){
        let products = [] as any[];
        const {data, error} = await supabase
            .from('products')
            .select('*')
            .in('product_id', id_array);
        if(error){
            console.error('Error getting products by ID:', error);
        } else {
            products = data;
        }
        return products;
    },

    async getAllProductsForVendor(vendor_id: number){
        let products = [] as any[];
        console.log('Getting all products for vendor with ID: ', vendor_id);
        const {data, error} = await supabase
            .from('products')
            .select('*')
            .eq('vendor_id', vendor_id);
        if(error){
            console.error('Error getting all products for vendor:', error);
        } else {
            products = data;
        }
        return products;

    },

    async getRawProductsForVendor(vendor_id: number){
        let products = [] as any[];
        console.log('Getting raw products for vendor with ID: ', vendor_id);
        const {data, error} = await supabase
            .from('products')
            .select('*')
            .eq('vendor_id', vendor_id)
            .is('fnsku', null)
            .is('asin', null);
        if(error){
            console.error('Error getting raw products for vendor:', error);
        } else {
            products = data;
        }
        return products;
    },

    async getProcessedProductsForVendor(vendor_id: number){
        let products = [] as any[];
        console.log('Getting processed products for vendor with ID: ', vendor_id);
        const {data, error} = await supabase
            .from('products')
            .select('*')
            .eq('vendor_id', vendor_id)
            .or('fnsku.neq.null,asin.neq.null');
        if(error){
            console.error('Error getting processed products for vendor:', error);
        } else {
            products = data;
        }
        return products;
    },

    async getProductsForPOPage(po_id_array: number[]){
        let products = [] as any[];
        console.log('Getting products for PO page with PO IDs: ', po_id_array);
        const {data, error} = await supabase
            .from('products')
            .select(`
                *,
                cases(purchase_order_id)
                `)
            .in('cases.purchase_order_id', po_id_array);
        if(error){
            console.error('Error getting products for PO page:', error);
        } else {
            console.log('Products for PO page:', data);
            products = data;
        }
        return products;
    },

    async getProductsLazy(first: number, last: number, processed: number, filter_column: string, filter_data: string){
        let products = [] as any[];

        /**
         * NEED TO FIX. SUPABASE COUNT QUERY NOT WORKING. FOR NOW, GRABBING ALL RECORDS AND JUST DOING A LENGTH VARIABLE
         */
        const {data: countData, error: countError} = await supabase
        .from('products')
        .select('*');
        if (countError){
            console.error(countError);
        } else {
            console.log('Count Data: ', countData);
            let max = 100000000;
            if(countData)
                max = countData.length;
        
            console.log('Max: ', max);
            let startBuffer = first - 50;
            let endBuffer = last + 50;

            if(startBuffer < 0)
                startBuffer = 0;
            if(endBuffer > max)
                endBuffer = max;

            

            const query = supabase
            .from('products')
            .select('*')
            .range(startBuffer, endBuffer);

            if(processed === 1){
                query.or('fnsku.neq.null,asin.neq.null');
                
            } else if(processed === 2){
                query.or('fnsku.eq.null,asin.eq.null, fnsku.eq."",asin.eq.""');
            } 

            if(filter_data !== ''){
                if (filter_column === 'name')
                    query.ilike('name', `%${filter_data}%`);
                else if (filter_column === 'item_num')
                    query.ilike('item_num', `%${filter_data}%`);
                else if (filter_column === 'vendor_name')
                    query.ilike('vendor_name', `%${filter_data}%`);
                else if (filter_column === 'status')
                    query.ilike('status', `%${filter_data}%`);
                else
                    query.or(`name.ilike.%${filter_data}%,notes.ilike.%${filter_data}%,status.ilike.%${filter_data}%`);
            }

            const {data, error} = await query;
            if(error){
                console.error('Error calling RPC:', error);
            } else {
                console.log('Products:', data);
                products = data;
            }
            
        }
        return products;
        
    },

    /**
     * @description Gets a page of products based on the inputted parameters. Uses server-side pagination to only pull the necessary records for each page, as opposed to getProducts() which pulls all records at once.
     * @param page The page number to retrieve (1-based index)
     * @param rowsPerPage The number of rows to display per page
     * @param processed 0 for all products, 1 for processed products only, 2 for unprocessed products only
     * @param filter_column The column to filter by (e.g. 'name', 'item_num', 'vendor_name', 'status', or '' for all columns)
     * @param filter_data The value to filter by (e.g. 'Widget' to filter the name column for products with 'Widget' in the name)
     * @returns An array of products for the specified page and filters
     * @author Gabe de la Torre-Garcia
     */
    async getProductsPage(
        page: number,
        rowsPerPage: number,
        processed: number,
        filter_column: string,
        filter_data: string
    ){
        let products: any[] = [];
    
        // page is 1-based here; convert to 0-based indices
        const from = (page - 1) * rowsPerPage;
        const to   = from + rowsPerPage - 1;
    
        try {
            const query = supabase
                .from('products')
                .select('*')
                .order('product_id', { ascending: true });
    
            if(processed === 1){
                query.is('is_processed', true);
                
            } else if(processed === 2){
                query.is('is_processed', false);
            } 
    
            if (filter_data !== '') {
                if (filter_column === 'name')
                    query.ilike('name', `%${filter_data}%`);
                else if (filter_column === 'item_num')
                    query.ilike('item_num', `%${filter_data}%`);
                else if (filter_column === 'vendor_name')
                    query.ilike('vendor_name', `%${filter_data}%`);
                else if (filter_column === 'status')
                    query.ilike('status', `%${filter_data}%`);
                else
                    query.or(`name.ilike.%${filter_data}%,notes.ilike.%${filter_data}%,status.ilike.%${filter_data}%`);
            }
    
            const { data, error } = await query.range(from, to);
    
            if (error) {
                console.error('Error calling RPC (getProductsPage):', error);
            } else {
                console.log('Products page:', data);
                products = data ?? [];
            }
        } catch (err) {
            console.error('Error in getProductsPage:', err);
        }
    
        return products;
    },

    async getProductsCount(
        processed: number,
        filter_column: string,
        filter_data: string
    ){
        try {
            const query = supabase
                .from('products')
                .select('*', { count: 'exact', head: true });

            if (processed === 1) {
                query.or('fnsku.neq.null,asin.neq.null');
            } else if (processed === 2) {
                query.is('fnsku', null).is('asin', null);
            }

            if (filter_data !== '') {
                if (filter_column === 'name')
                    query.ilike('name', `%${filter_data}%`);
                else if (filter_column === 'item_num')
                    query.ilike('item_num', `%${filter_data}%`);
                else if (filter_column === 'vendor_name')
                    query.ilike('vendor_name', `%${filter_data}%`);
                else if (filter_column === 'status')
                    query.ilike('status', `%${filter_data}%`);
                else
                    query.or(`name.ilike.%${filter_data}%,notes.ilike.%${filter_data}%,status.ilike.%${filter_data}%`);
            }

            const { count, error } = await query;
                
            if (error) {
                throw error;
            }
            return count ?? 0;
        } catch (err) {
            console.error('Error fetching products count:', err);
            return 0;
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

    // page: number, rowsPerPage: number, 
    async getFilteredProductKeys(filter_column: string, filter_data: string, processed: number){
        let products = [] as any[];
        // const from = (page - 1) * rowsPerPage;
        // const to = from + rowsPerPage - 1;

        const query = supabase
            .from('products')
            .select('*');
            // .range(from, to);



        if(processed === 1){
            query.neq('fnsku', null).neq('asin', null).neq('fnsku', '').neq('asin', '');
        } else if(processed === 2){
            query.eq('fnsku', null).eq('asin', null).eq('fnsku', '').eq('asin', '');
        } 

        if(filter_data !== ''){
            if (filter_column === 'name')
                query.ilike('name', `%${filter_data}%`);
            else if (filter_column === 'item_num')
                query.ilike('item_num', `%${filter_data}%`);
            else if (filter_column === 'vendor_name')
                query.ilike('vendor_name', `%${filter_data}%`);
            else if (filter_column === 'status')
                query.ilike('status', `%${filter_data}%`);
            else
                query.or(`name.ilike.%${filter_data}%,notes.ilike.%${filter_data}%,status.ilike.%${filter_data}%`);
        }

        const {data, error} = await query;
        if(error){
            console.error('Error calling RPC:', error);
        } else {
            console.log('Filtered Products:', data);
            products = data;
        }

        return products;

    },

    async getAutoCompleteProductKeys(displayValue: number, vendor_id: number){
        let products = [] as any[];
        
        console.log('Display Value: ', displayValue, 'Vendor ID: ', vendor_id); 

        const query = supabase
            .from('products')
            .select('*');

        if(displayValue === 1){
            // query.neq('fnsku', null).neq('asin', null).neq('fnsku', '').neq('asin', '');
            query.or('fnsku.neq.null,asin.neq.null');
            
        } else if(displayValue === 2){
            query.is('fnsku', null).is('asin', null);
            // query.or('fnsku.eq.null,asin.eq.null,fnsku.eq."",asin.eq.""');
        } 
        if(vendor_id !== 0){
            query.eq('vendor_id', vendor_id);
        }

        const {data, error} = await query;
        if(error){
            console.error('Error calling RPC:', error);
        } else {
            console.log('Filtered Products:', data);
            products = data;
        }

        return products;
    },

    

    /* WORKING ON PAGINATION
    
    // Step 1: First, get the first 25 unique product_ids from the cases table
        const { data: uniqueProductIds, error: productIdsError } = await supabase
        .from('cases')
        .select('product_id', { count: 'exact' })
        .distinct()
        .range(0, 24);  // This gets the first 25 unique product_ids

        if (productIdsError) {
        console.error('Error fetching unique product IDs:', productIdsError);
        return;
        }

        // Step 2: Use these product_ids to fetch related records
        const { data: relatedRecords, error: recordsError } = await supabase
        .from('requests_to_process')  // or whichever table you're querying
        .select(`
            *,
            products(product_id, fnsku, asin, name, default_units_per_case, cases(*), recipe_elements(*)),
            purchase_orders(purchase_order_id, purchase_order_name, status, po_recipes(*))
        `)
        .in('product_id', uniqueProductIds.map(item => item.product_id))
        .neq('status', '0 COMPLETED')
        .neq('status', '5 ON ORDER')
        .order('status');

        if (recordsError) {
        console.error('Error fetching related records:', recordsError);
        return;
        }

        console.log('Related Records:', relatedRecords);
    */

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

        let product : {
            name: string;
            item_num: number;
            vendor_id: number;
            weight_lbs: number;
            box_type: string;
            box_cost: number;
            bag_size: string;
            bag_cost: number;
            price_2021: number;
            price_2022: number;
            price_2023: number;
            notes: string;
            date_added: Date;
            upc: string;
            fnsku: string;
            asin: string;
            do_we_carry: string;
            process_time_per_unit_sec: number;
            meltable: string;
            map: number;
            in_shipping_cost: number;
            out_shipping_cost: number;
            labor_cost: number;
            item_cost: number;
            misc_cost: number;
            amz_fees_cost: number;
            amz_fulfilment_cost: number;
            storage_cost_30_day: number;
            holiday_storage_cost: number;
            total_cost: number;
            total_holiday_cost: number;
            default_units_per_case: number;
            status: string;
            unit_box_cost: number;
            is_processed: boolean;
        } = {
            name: p.name, 
            item_num: p.item_num, 
            vendor_id: p.vendor_id,
            weight_lbs: p.weight_lbs,
            box_type: p.box_type,
            box_cost: p.box_cost,
            bag_size: p.bag_size,
            bag_cost: p.bag_cost,
            price_2021: p.price_2021,
            price_2022: p.price_2022,
            price_2023: p.price_2023,
            notes: p.notes,
            date_added: p.date_added,
            upc: p.upc,
            fnsku: p.fnsku,
            asin: p.asin,
            do_we_carry: p.do_we_carry,
            process_time_per_unit_sec: p.process_time_per_unit_sec,
            meltable: p.meltable,
            map: p.map,
            in_shipping_cost: p.in_shipping_cost,
            out_shipping_cost: p.out_shipping_cost,
            labor_cost: p.labor_cost,
            item_cost: p.item_cost,
            misc_cost: p.misc_cost,
            amz_fees_cost: p.amz_fees_cost,
            amz_fulfilment_cost: p.amz_fulfilment_cost,
            storage_cost_30_day: p.storage_cost_30_day,
            holiday_storage_cost: p.holiday_storage_cost,
            total_cost: p.total_cost,
            total_holiday_cost: p.total_holiday_cost,
            default_units_per_case: p.default_units_per_case,
            status: p.status,
            unit_box_cost: p.unit_box_cost,
            is_processed: p.is_processed
        };

        //MOVE OVER TO THE addRecipe() FUNCTION AND THEN CALL THAT FUNCTION IN HERE
        if(element_array.length > 0){
            console.log('Created processed product');

            const recipeElements = [] as any[];

            element_array.forEach((recipe_element: any) => {
                recipeElements.push({
                    product_id: recipe_element.product_id,
                    qty: recipe_element.qty
                });
            })

            console.log('2D Array', recipeElements);

            const {data, error} = await supabase.rpc('create_product_key', {
                new_product_data: product,
                new_recipe_data: recipeElements
            });
            if(error){
                console.error(error);
                throw error;
            } else {
                console.log('Successfully Added Processed Product');
            }
        } else {    
            console.log('Creating raw product');
            const {data, error} = await supabase.rpc('create_product_key', {new_product_data: product});
            if(error){
                console.error('Error calling RPC:', error);
                throw error;
            } else {
                console.log('Newly Added Raw Product:');
            }
        }

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

        let product : {
            product_id: number;
            name: string;
            item_num: number;
            vendor_id: number;
            weight_lbs: number;
            box_type: string;
            box_cost: number;
            bag_size: string;
            bag_cost: number;
            price_2021: number;
            price_2022: number;
            price_2023: number;
            notes: string;
            date_added: Date;
            upc: string;
            fnsku: string;
            asin: string;
            do_we_carry: string;
            process_time_per_unit_sec: number;
            meltable: string;
            map: number;
            in_shipping_cost: number;
            out_shipping_cost: number;
            labor_cost: number;
            item_cost: number;
            misc_cost: number;
            amz_fees_cost: number;
            amz_fulfilment_cost: number;
            storage_cost_30_day: number;
            holiday_storage_cost: number;
            total_cost: number;
            total_holiday_cost: number;
            default_units_per_case: number;
            status: string;
            unit_box_cost: number;
            is_processed: boolean;
        } = {
            product_id: p.product_id,
            name: p.name, 
            item_num: p.item_num, 
            vendor_id: p.vendor_id,
            weight_lbs: p.weight_lbs,
            box_type: p.box_type,
            box_cost: p.box_cost,
            bag_size: p.bag_size,
            bag_cost: p.bag_cost,
            price_2021: p.price_2021,
            price_2022: p.price_2022,
            price_2023: p.price_2023,
            notes: p.notes,
            date_added: p.date_added,
            upc: p.upc,
            fnsku: p.fnsku,
            asin: p.asin,
            do_we_carry: p.do_we_carry,
            process_time_per_unit_sec: p.process_time_per_unit_sec,
            meltable: p.meltable,
            map: p.map,
            in_shipping_cost: p.in_shipping_cost,
            out_shipping_cost: p.out_shipping_cost,
            labor_cost: p.labor_cost,
            item_cost: p.item_cost,
            misc_cost: p.misc_cost,
            amz_fees_cost: p.amz_fees_cost,
            amz_fulfilment_cost: p.amz_fulfilment_cost,
            storage_cost_30_day: p.storage_cost_30_day,
            holiday_storage_cost: p.holiday_storage_cost,
            total_cost: p.total_cost,
            total_holiday_cost: p.total_holiday_cost,
            default_units_per_case: p.default_units_per_case,
            status: p.status,
            unit_box_cost: p.unit_box_cost,
            is_processed: p.is_processed
        };

        let elementArray = r;

        console.log('Recipe Elements: ', elementArray);
        

        if(elementArray.length >0){
            console.log('Updated Processed Product')

            console.log('Created processed product');

            let recipeElements = [] as any[];

            elementArray.forEach((element: any) => {
                if (element.product_id){
                    recipeElements.push({
                        recipe_element_id: element.recipe_element_id,
                        product_id: element.product_id,
                        qty: element.qty,
                        recipe_id: element.recipe_id
                    });
                }
            })

            const {data, error} = await supabase.rpc('update_product_key', {
                updated_product_data: product,
                updated_recipe_data: recipeElements
            })
            if(error){
                console.error('Error calling RPC: ', error);
                throw error;
            } else {
                console.log('Processed Product Key updated');
            }

        } else {
            console.log('Updated Raw Product')
            const {data, error} = await supabase.rpc('update_product_key',{updated_product_data: product})
            if(error){
                console.error('Error calling RPC: ', error);
                throw error;
            } else {
                console.log('Raw Product key updated');
            }
        }
    },

    //Batch delete products
    async batchDeleteProduct(p: any){
        //console.log(id);
        //if(confirm("Do you really want to delete?")){

        // console.log(p);

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
    /**
     * Subscribes to changes for the specified case IDs. When a change occurs, the provided onChange callback will be invoked with the change payload.
     * @param case_ids An array of case IDs to subscribe to for changes
     * @param onChange A callback function that will be invoked when a change occurs for any of the specified case IDs
     * @returns A subscription object that can be used to unsubscribe from the changes
     */
    subscribeToCaseChanges(
        case_ids: number[],
        onChange: (payload: any) => void
    ) {
        const scopedIds = Array.from(
            new Set((case_ids || []).filter((id) => Number.isFinite(id)))
        ) as number[];

        if (scopedIds.length === 0) {
            return null;
        }

        const channelNonce = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        let channel = supabase.channel(`case-changes-${scopedIds.join('-')}-${channelNonce}`);

        scopedIds.forEach((case_id) => {
            channel = channel.on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'cases',
                    filter: `case_id=eq.${case_id}`,
                },
                (payload: any) => {
                    onChange(payload);
                }
            );
        });

        return channel.subscribe();
    },
    
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

    /**
     * @description Gets a page of cases based on the inputted parameters. Uses server-side pagination to only pull the necessary records for each page, as opposed to getCases() which pulls all records at once.
     * @param page The page number to retrieve (1-based index)
     * @param rowsPerPage The number of rows to display per page
     * @param processed 0 for all cases, 1 for processed cases only, 2 for unprocessed boxes only
     * @param filter_column The column to filter by (e.g. 'name', 'item_num', 'vendor_name', 'status', or '' for all columns)
     * @param filter_data The value to filter by (e.g. 'Widget' to filter the name column for cases with 'Widget' in the name)
     * @returns An array of cases for the specified page and filters
     * @author Gabe de la Torre-Garcia
     * 
     * @TODO NEED TO FIX PAGINATION BEFORE IT CAN BE IMPLEMENTED. GRAB ALL CASES OR BOXES LINKED TO PRODUCTS PER PAGE, RATHER THAN GRABBING 25 CASES OR BOXES. THEY CANNOT BE GROUPED THAT WAY.
     */
    async getCasesPage(
        page: number,
        rowsPerPage: number,
        processed: number,
        filter_column: string,
        filter_data: string
    ){
        let cases: any[] = [];
    
        // page is 1-based here; convert to 0-based indices
        const from = (page - 1) * rowsPerPage;
        const to   = from + rowsPerPage - 1;
    
        try {
            const query = supabase
                .from('cases')
                .select(`
                    *,  
                    products(product_id, fnsku, asin, item_num, upc, name)
                    `)
                .order('case_id', { ascending: true });
    
            if(processed === 1){
                query.or('fnsku.neq.null,asin.neq.null', {referencedTable: 'products'});
                
            } else if(processed === 2){
                query.is('products.fnsku', null).is('products.asin', null);
            } 
    
            if (filter_data !== '') {
                if (filter_column === 'name')
                    query.ilike('name', `%${filter_data}%`);
                else if (filter_column === 'item_num')
                    query.ilike('item_num', `%${filter_data}%`);
                else if (filter_column === 'vendor_name')
                    query.ilike('vendor_name', `%${filter_data}%`);
                else if (filter_column === 'status')
                    query.ilike('status', `%${filter_data}%`);
                else
                    query.or(`name.ilike.%${filter_data}%,notes.ilike.%${filter_data}%,status.ilike.%${filter_data}%`);
            }
    
            const { data, error } = await query.range(from, to);
    
            if (error) {
                console.error('Error calling RPC (getProductsPage):', error);
            } else {
                console.log('Cases page:', data);
                cases = data ?? [];
            }
        } catch (err) {
            console.error('Error in getCasesPage:', err);
        }
        if(processed === 1){
            console.log('Processed cases page: ', cases);
        } else if(processed === 2){
            console.log('Unprocessed boxes page: ', cases);
        }
        return cases;
    },

    async getCasesCount(
        processed: number,
        filter_column: string,
        filter_data: string
    ){
        try {
            const query = supabase
                .from('cases')
                .select(`
                    *,  
                    products(fnsku, asin, item_num, upc, name)
                    `, { count: 'exact', head: true })
                // .filter('products.fnsku', 'neq', null)
                // .filter('products.asin', 'neq', null)

            if (processed === 1) {
                query.or('fnsku.neq.null,asin.neq.null', {referencedTable: 'products'});
            } else if (processed === 2) {
                query.is('products.fnsku', null).is('products.asin', null);
            }

            if (filter_data !== '') {
                if (filter_column === 'name')
                    query.ilike('name', `%${filter_data}%`);
                else if (filter_column === 'item_num')
                    query.ilike('item_num', `%${filter_data}%`);
                else if (filter_column === 'vendor_name')
                    query.ilike('vendor_name', `%${filter_data}%`);
                else if (filter_column === 'status')
                    query.ilike('status', `%${filter_data}%`);
                else
                    query.or(`name.ilike.%${filter_data}%,notes.ilike.%${filter_data}%,status.ilike.%${filter_data}%`);
            }

            const { count, error } = await query;
                
            if (error) {
                throw error;
            }
            if(processed === 1){
                console.log('Processed cases page count: ', count);
            } else if(processed === 2){
                console.log('Unprocessed boxes page count: ', count);
            }
            return count ?? 0;
        } catch (err) {
            console.error('Error fetching cases count:', err);
            return 0;
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

    async getProcrocCasesForPOPage(po_id_array: number[]){
        const {data, error} = await supabase.rpc('get_cases_by_type_for_po', {processed: true, po_ids: po_id_array});

        if(error){
            console.error('Error calling RPC: ', error);
            throw error;
        } else {
            console.log('Processed cases for purchase orders: ', data);
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

    async getUnprocCasesForPOPage(po_id_array: number[]){
        let boxes: any[] = [];
        const {data, error} = await supabase.rpc('get_cases_by_type_for_po', {processed: false, po_ids: po_id_array});

        if(error){
            console.error('Error calling RPC: ', error);
            throw error;
        } else {
            console.log('Raw boxes for purchase orders: ', data);
            boxes = data;
            return boxes;
        }
    },

    async getInboundBoxes(po_id: number){
        try {
            const query = supabase
                .from('cases')
                .select(`
                    case_id,
                    purchase_order_id,
                    product_id,
                    units_per_case,
                    status,
                    invoice_id,
                    notes,
                    products(product_id, fnsku, asin, item_num, upc, name)
                    `)
                .eq('purchase_order_id', po_id)
                .is('invoice_id', null)
                .is('products.fnsku', null)
                .is('products.asin', null);
            const {data, error} = await query;
            if(error){
                console.error('Error fetching inbound boxes: ', error);
                throw error;
            }

            return (data || [])
                .filter((box: any) => {
                    const normalizedStatus = (box.status || '').toLowerCase();
                    return normalizedStatus !== 'canceled' && normalizedStatus !== 'cancelled';
                })
                .map((box: any) => ({
                    ...box,
                    product_name: box.products?.name || `Product #${box.product_id}`,
                    item_num: box.products?.item_num || '',
                    fnsku: box.products?.fnsku || '',
                    upc: box.products?.upc || ''
                }));
        } catch (error) {
            console.error('Error fetching inbound boxes: ', error);
            throw error;
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
            return data.sort((a: any, b: any) => a.product_name.localeCompare(b.product_name));
        }
    },

     //
     async getProcDeliveredCases(){

        const {data, error: oldError} = await supabase.rpc('get_delivered_cases_by_type', {processed: true});
            if(oldError){
                console.error('Error calling RPC: ', oldError);
                throw oldError;
            } else { 
                console.log('Processed cases (Delivered): ', data);
                return data.sort((a: any, b: any) => a.product_name.localeCompare(b.product_name));
            }
    },

    /**
     * Inserts a single case or box into the database
     * @param c An object containing either case or box data
     */
    async addCase(c: any){
        const {data, error} = await supabase.rpc('create_case',{record_array: [
            c.units_per_case,
            c.date_received,
            c.notes,
            c.product_id,
            c.location_id,
            c.status,
            c.purchase_order_id,
            c.request_id
        ]})
        if(error){
            console.error('Error calling RPC: ', error);
            throw error;
        } else {
            console.log('Box/Case created: ', data);
            return data;
        }
    },

    /**
     * Inserts a case/box and links it to an invoice when provided.
     * Falls back to direct insert if the RPC return payload does not include a case id.
     * @TODO Need to create an RPC function to handle the complexity of this process. 
     */
    async addCaseWithInvoice(c: {
        units_per_case: number;
        date_received: string | null;
        notes: string | null;
        product_id: number;
        location_id: number | null;
        status: string | null;
        purchase_order_id: number | null;
        request_id: number | null;
        invoice_id: number | null;
    }){
        const baseCasePayload = {
            units_per_case: c.units_per_case,
            date_received: c.date_received,
            notes: c.notes,
            product_id: c.product_id,
            location_id: c.location_id,
            status: c.status,
            purchase_order_id: c.purchase_order_id,
            request_id: c.request_id,
        };

        const createdCase = await this.addCase(baseCasePayload);
        const createdCaseId = Number(createdCase?.case_id || 0);

        if (c.invoice_id == null) {
            return createdCase;
        }

        if (createdCaseId > 0) {
            const {data, error} = await supabase
                .from('cases')
                .update({ invoice_id: c.invoice_id })
                .eq('case_id', createdCaseId)
                .select()
                .single();

            if (error) {
                console.error('Error linking case to invoice:', error);
                throw error;
            }

            return data;
        }

        const {data, error} = await supabase
            .from('cases')
            .insert({
                ...baseCasePayload,
                invoice_id: c.invoice_id,
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating case with invoice:', error);
            throw error;
        }

        return data;
    },

    /* picklistData: {label: string, picklistElements: {notes: string, request_id: number, lane_location: string, usedCaseIds: number[]}[]}){
        try {
            console.log("Picklist Data: ", picklistData);
            const {data, error} = await supabase.rpc('create_picklist', {picklist_data: picklistData});
             */
    // Adds multiple cases at the same time (Loops through an inputted amount)
    /**
     * Inserts the same case or box value into the database c.amount of times 
     * @param c An object containing case or box data to be inserted multiple times
     */
    async batchCreateCases(c: any){
        const casesData: {
            units_per_case: number,
            date_received: string | null,
            notes: string | null,
            product_id: number,
            location_id: number,
            status: string | null,
            purchase_order_id: number | null,
            request_id: number | null,
            amount: number 
        } = {
            units_per_case: c.units_per_case,
            date_received: c.date_received ?? null,
            notes: c.notes ?? null,
            product_id: c.product_id,
            location_id: c.location_id,
            status: c.status ?? null,
            purchase_order_id: c.purchase_order_id ?? null,
            request_id: c.request_id ?? null,
            amount: c.amount
        };
        const {data, error} = await supabase.rpc('batch_create_casesobj',{cases_data: casesData})
        if(error){
            console.error('Error calling RPC: ', error);
            throw error;
        } else {
            console.log('Boxes/Cases created: ', data);
        }
    },

    /**
     * Takes a 2D Array of cases or boxes and bulk inserts them into the database
     * @param c A 2D Array of cases or boxes
     */
    async bulkCreateCases(c: any){
        const {data, error} = await supabase.rpc('bulk_create_cases',{record_array: c})
        if(error){
            console.error('Error calling RPC: ', error);
            throw error;
        } else {
            console.log('Boxes/Cases created: ', data);
        }
    },

    /**
     * Inserts multiple cases or boxes into the database based on an array of case/box objects. This is more efficient than batchCreateCases() when the cases/boxes being inserted have different values, as it allows for bulk insertion without needing to loop through each case/box individually on the client side.
     * @param case_array An array of case or box objects with the same structure as the input for addCase() and batchCreateCases(). The RPC will loop through the array and insert each case or box into the database.
     */
    async createMultipleCasesByType(case_array: {
        product_id: number,
        units_per_case: number,
        amount: number,
        date_received: string | null,
        notes: string | null,
        location_id: number | null,
        status: string | null,
        purchase_order_id: number | null,
        request_id: number | null,
        invoice_id: number | null
    }[]){
        const {data, error} = await supabase.rpc('create_multiple_cases_by_type',{received_box_data: case_array})
        if(error){
            console.error('Error calling RPC: ', error);
            throw error;
        } else {
            console.log('Boxes/Cases created: ', case_array);
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

    async bulkEditCasesV2(c: {
        case_id: number,
        product_id: number,
        units_per_case: number,
        date_received: string | null,
        notes: string | null,
        location_id: number | null,
        status: string | null,
        purchase_order_id: number | null,
        request_id: number | null
    }[]){
        console.log(c);
        const {data, error} = await supabase.rpc('bulk_update_case_v2',{case_array: c})
        if(error){
            console.error('Error calling RPC: ', error);
            throw error;
        } else {
            console.log('Box/Case updated: ', data);
        }
    },


    // @TODO Need to make a db function in supabse to edit multiple cases at the same time.
    async editMultipleCases(c: any){
        console.log(c);
        const {data, error} = await supabase.rpc('',{record_array: c})
        if(error){
            console.error('Error calling RPC: ', error);
            throw error;
        } else {
            console.log('Box/Case updated: ', data);
        }
    },


    //RECORD LOCKS------------------------------------------------------------------------------------------
    /**
     * Fetches the current active lock for a single record.
     *
     * @param table_name The table namespace used in the lock row (e.g. 'purchase_orders').
     * @param record_id The primary key value of the locked record.
     * @returns The active lock payload when present and not expired; otherwise null.
     */
    async getRecordEditLock(table_name: string, record_id: string | number){
        const { data, error } = await supabase.rpc('get_record_lock', {
            p_table_name: table_name,
            p_record_id: String(record_id),
        });

        if (error) {
            console.error('Error getting record lock:', error);
            throw error;
        }

        if (!data?.editor_user_id) {
            return null;
        }

        const lockExpiresAt = data.heartbeat_at ? new Date(data.heartbeat_at).getTime() : 0;
        if (!lockExpiresAt || lockExpiresAt < Date.now()) {
            return null;
        }

        return data;
    },

    /**
     * Attempts to acquire or renew a pessimistic lock for the current user.
     *
     * @param table_name The table namespace used in the lock row.
     * @param record_id The primary key value of the record to lock.
     * @param editor_name Display name saved with the lock for read-only notices.
     * @param ttl_seconds Lease length in seconds before lock expiration.
     * @returns RPC payload containing acquired flag and lock details.
     */
    async acquireRecordEditLock(table_name: string, record_id: string | number, editor_name: string, ttl_seconds = 120){
        const { data, error } = await supabase.rpc('acquire_record_lock', {
            p_table_name: table_name,
            p_record_id: String(record_id),
            p_editor_name: editor_name,
            p_ttl_seconds: ttl_seconds,
        });

        if (error) {
            console.error('Error acquiring record lock:', error);
            throw error;
        }

        return data;
    },

    /**
     * Refreshes (heartbeats) the caller lock lease for a record.
     *
     * @param table_name The table namespace used in the lock row.
     * @param record_id The primary key value of the locked record.
     * @param ttl_seconds New lease duration in seconds from now.
     * @returns RPC payload containing refreshed flag and lock details when successful.
     */
    async refreshRecordEditLock(table_name: string, record_id: string | number, ttl_seconds = 120){
        const { data, error } = await supabase.rpc('refresh_record_lock', {
            p_table_name: table_name,
            p_record_id: String(record_id),
            p_ttl_seconds: ttl_seconds,
        });

        if (error) {
            console.error('Error refreshing record lock:', error);
            throw error;
        }

        return data;
    },

    /**
     * Releases the caller owned lock for a record.
     *
     * @param table_name The table namespace used in the lock row.
     * @param record_id The primary key value of the locked record.
     * @returns RPC payload with released flag.
     */
    async releaseRecordEditLock(table_name: string, record_id: string | number){
        const { data, error } = await supabase.rpc('release_record_lock', {
            p_table_name: table_name,
            p_record_id: String(record_id),
        });

        if (error) {
            console.error('Error releasing record lock:', error);
            throw error;
        }

        return data;
    },

    /**
     * Subscribes to realtime changes for lock rows scoped to a table namespace.
     *
     * @param table_name The table namespace to filter lock events by.
     * @param onChange Callback invoked for any insert/update/delete lock event.
     * @returns Supabase realtime channel subscription object.
     */
    subscribeToRecordLocks(table_name: string, onChange: () => void){
        const channelNonce = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        return supabase
            .channel(`record-locks-${table_name}-${channelNonce}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'record_locks', filter: `table_name=eq.${table_name}` }, () => {
                onChange();
            })
            .subscribe();
    },


    //PURCHASE ORDERS----------------------------------------------------------------------------------------
    /**
     * Subscribes to realtime changes for only the provided purchase order ids.
     * This is intended for conservative realtime usage on paginated table views.
     *
     * @param purchase_order_ids The PO ids to watch (typically current visible page ids).
     * @param onChange Callback invoked for insert/update/delete events on matched rows.
     * @returns Supabase realtime channel subscription object, or null when no ids are provided.
     */
    subscribeToPurchaseOrderChanges(
        purchase_order_ids: number[],
        onChange: (payload: any) => void
    ){
        const scopedIds = Array.from(
            new Set((purchase_order_ids || []).filter((id) => Number.isFinite(id)))
        ) as number[];

        if (scopedIds.length === 0) {
            return null;
        }

        const channelNonce = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        let channel = supabase.channel(`purchase-order-changes-${scopedIds.join('-')}-${channelNonce}`);

        scopedIds.forEach((purchase_order_id) => {
            channel = channel.on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'purchase_orders',
                    filter: `purchase_order_id=eq.${purchase_order_id}`,
                },
                (payload: any) => {
                    onChange(payload);
                }
            );
        });

        return channel.subscribe();
    },

    /**
     * Subscribes to realtime changes for only the provided purchase order recipe ids.
     * This is intended for conservative realtime usage on paginated table views that show recipe details.
     * @param purchase_order_recipe_ids An array of purchase order recipe IDs to subscribe to for changes
     * @param onChange A callback function that will be invoked when a change occurs for any of the specified purchase order recipe IDs
     * @returns A subscription object that can be used to unsubscribe from the changes
     */
    subscribeToPurchaseOrderRecipeChanges(
        purchase_order_recipe_ids: number[],
        onChange: (payload: any) => void
    ){
        const scopedIds = Array.from(
            new Set((purchase_order_recipe_ids || []).filter((id) => Number.isFinite(id)))
        ) as number[];

        if (scopedIds.length === 0) {
            return null;
        }

        const channelNonce = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        let channel = supabase.channel(`purchase-order-recipe-changes-${scopedIds.join('-')}-${channelNonce}`);

        scopedIds.forEach((purchase_order_recipe_id) => {
            channel = channel.on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'purchase_order_recipes',
                    filter: `purchase_order_recipe_id=eq.${purchase_order_recipe_id}`,
                },
                (payload: any) => {
                    onChange(payload);
                }
            );
        });

        return channel.subscribe();
    },

    /**
     * Subscribes to realtime changes for only the provided purchase order raw line ids.
     * This is intended for conservative realtime usage on paginated table views that show raw line details.
     * @param purchase_order_raw_line_ids An array of purchase order raw line IDs to subscribe to for changes
     * @param onChange A callback function that will be invoked when a change occurs for any of the specified purchase order raw line IDs
     * @returns A subscription object that can be used to unsubscribe from the changes
     */
    subscribeToPurchaseOrderRawLineChanges(
        purchase_order_raw_line_ids: number[],
        onChange: (payload: any) => void
    ){
        const scopedIds = Array.from(
            new Set((purchase_order_raw_line_ids || []).filter((id) => Number.isFinite(id)))
        ) as number[];

        if (scopedIds.length === 0) {
            return null;
        }

        const channelNonce = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        let channel = supabase.channel(`purchase-order-raw-line-changes-${scopedIds.join('-')}-${channelNonce}`);

        scopedIds.forEach((purchase_order_raw_line_id) => {
            channel = channel.on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'purchase_order_raw_lines',
                    filter: `purchase_order_raw_line_id=eq.${purchase_order_raw_line_id}`,
                },
                (payload: any) => {
                    onChange(payload);
                }
            );
        });

        return channel.subscribe();
    },

    /**
     * Subscribes to realtime changes for one specific purchase order row.
     * Use this when you want conservative realtime usage while a single PO is open.
     *
     * @param purchase_order_id The specific purchase order id to watch.
     * @param onChange Callback invoked for insert/update/delete events on that row.
     * @returns Supabase realtime channel subscription object.
     */
    subscribeToSinglePurchaseOrderChange(
        purchase_order_id: number,
        onChange: (payload: any) => void
    ){
        return supabase
            .channel(`purchase-order-${purchase_order_id}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'purchase_orders',
                    filter: `purchase_order_id=eq.${purchase_order_id}`,
                },
                (payload: any) => {
                    onChange(payload);
                }
            )
            .subscribe();
    },


    //Gets purchase orders
    async getPurchaseOrders(){
        // const {data, error} = await supabase.rpc('get_purchase_orders');

        const query = supabase
            .from('purchase_orders')
            .select('*')
            .order('purchase_order_id');

        const {data, error} = await query;
        if(error){
            console.error('Error calling RPC: ', error);
            throw error;
        } else {
            console.log('Purchase Orders: ', data);
            return data;
        }
    },

    /**
     * @description Gets a page of purchase orders based on the inputted parameters. Uses server-side pagination to only pull the necessary records for each page, as opposed to getPurchaseOrders() which pulls all records at once.
     * @param page The page number to retrieve (1-based index)
     * @param rowsPerPage The number of rows to display per page
     * @param filter_data The value to filter by (e.g. 'Widget' to filter the name column for purchase orders with 'Widget' in the name)
     * @returns An array of purchase orders for the specified page and filters
     * @author Gabe de la Torre-Garcia
     */
    async getPurchaseOrdersPage(
        page: number,
        rows_per_page: number,
        filter_field: string,
        filter_data: string,
        sort_field: string,
        sort_order: number
    ): Promise<{
        total_count: number;
        page: number;
        rows_per_page: number;
        purchase_order_ids: number[];
        purchase_orders: any[];
        all_products: any[];
        all_boxes: any[];
        all_recipes: any[];
        all_po_recipes: any[];
        all_recipe_elements: any[];
        all_po_raw_lines: any[];
        all_invoices: any[];
        all_boxes_ids: number[];
        all_po_recipes_ids: number[];
        all_products_ids: number[];
        all_po_raw_lines_ids: number[];
        all_invoices_ids: number[];
    }>{
        let result = {
            total_count: 0,
            page,
            rows_per_page: rows_per_page,
            purchase_order_ids: [] as number[],
            purchase_orders: [] as any[],
            all_products: [] as any[],
            all_boxes: [] as any[],
            all_recipes: [] as any[],
            all_po_recipes: [] as any[],
            all_recipe_elements: [] as any[],
            all_po_raw_lines: [] as any[],
            all_invoices: [] as any[],
            all_boxes_ids: [] as number[],
            all_po_recipes_ids: [] as number[],
            all_products_ids: [] as number[],
            all_po_raw_lines_ids: [] as number[],
            all_invoices_ids: [] as number[],
        };
    
        try {
            
            const { data, error } = await supabase.rpc('get_purchase_orders_with_details', {
                in_page: page, 
                in_rows_per_page: rows_per_page, 
                in_filter_field: filter_field,
                in_filter_data: filter_data,
                in_sort_field: sort_field,
                in_sort_order: sort_order
            });
    
            if (error) {
                console.error('Error calling RPC (getPurchaseOrdersDetails):', error);
            } else {
                console.log('Purchase Orders page data:', data);
                result = data ?? result;
            }
        } catch (err) {
            console.error('Error in getPurchaseOrdersPage:', err);
        }
        return result;
    },

     /**
     * @description Gets a page of purchase orders based on the inputted parameters. Uses server-side pagination to only pull the necessary records for each page, as opposed to getPurchaseOrders() which pulls all records at once.
     * @param page The page number to retrieve (1-based index)
     * @param rowsPerPage The number of rows to display per page
     * @param filter_data The value to filter by (e.g. 'Widget' to filter the name column for purchase orders with 'Widget' in the name)
     * @returns An array of purchase orders for the specified page and filters
     * @author Gabe de la Torre-Garcia
     */
    async getPurchaseOrdersPageV2(
        page: number,
        rowsPerPage: number,
        filter_data: string
    ){
        let purchaseOrders: any[] = [];
    
        // page is 1-based here; convert to 0-based indices
        const from = (page - 1) * rowsPerPage;
        const to   = from + rowsPerPage - 1;
    
        try {
            
            const { data, error } = await supabase.rpc('get_purchase_orders_with_details', {in_page: page, in_rows_per_page: rowsPerPage, in_filter_data: filter_data});
    
            if (error) {
                console.error('Error calling RPC (getPurchaseOrdersPage):', error);
            } else {
                console.log('Purchase Orders page:', data);
                purchaseOrders = data ?? [];
            }
        } catch (err) {
            console.error('Error in getPurchaseOrdersPage:', err);
        }
    
        return purchaseOrders;
    },

    async getPurchaseOrdersCount(
        filter_data: string
    ){
        try {
            const query = supabase
                .from('purchase_orders')
                .select('*', { count: 'exact', head: true });

            if (filter_data !== '') {
                query.or(`purchase_order_name.ilike.%${filter_data}%,notes.ilike.%${filter_data}%`);
            }

            const { count, error } = await query;
                
            if (error) {
                throw error;
            }
            return count ?? 0;
        } catch (err) {
            console.error('Error fetching purchase orders count:', err);
            return 0;
        }
    },

    async getNewestPurchaseOrdersByVendor(vendor_id: number){
        const {data, error} = await supabase
            .from('purchase_orders')
            .select('*')
            .eq('vendor_id', vendor_id)
            .order('purchase_order_id', { ascending: false })
            .limit(5); // Adjust the limit as needed
        if(error){
            console.error('Error calling RPC: ', error);
            throw error;
        } else {
            console.log('Newest Purchase Orders for Vendor: ', data);
            return data;
        }
    },

    //Create a purchase order
    async addPurchaseOrder(purchaseOrder: any){
        const {data, error} = await supabase.rpc('create_purchase_order', {record_array: [
            purchaseOrder.purchase_order_name,
            purchaseOrder.status,
            purchaseOrder.notes,
            purchaseOrder.date_ordered,
            purchaseOrder.date_received,
            purchaseOrder.vendor_id,
            purchaseOrder.discount
        ]});
        if(error){
            console.error('Error calling RPC: ', error);
            throw error;
        } else {
            console.log('Purchase Order Created: ', data);
            return data.purchase_order_id;
        }
    },

    //Edit a purchase order
    async editPurchaseOrder(purchaseOrder: any){
        const {data, error} = await supabase.rpc('update_purchase_order', {record_array: [
            purchaseOrder.purchase_order_name,
            purchaseOrder.status,
            purchaseOrder.notes,
            purchaseOrder.date_ordered,
            purchaseOrder.date_received,
            purchaseOrder.vendor_id,
            purchaseOrder.discount,
            purchaseOrder.purchase_order_id
        ]});
        if(error){
            console.error('Error calling RPC: ', error);
            throw error;
        } else {
            console.log('Purchase Order Updated: ', data);
            return data;
        }
    },

    //Delete a purchase order
    async deletePurchaseOrder(id: any){

        const {data, error} = await supabase.from('purchase_orders').delete().eq('purchase_order_id', id);
        if(error){
            console.error('Error calling RPC: ', error);
            throw error;
        } else {
            console.log('Purchase Order Deleted: ', data);
            return data;
        }

    },

    // Get requests linked to a purchase order
    async getPurchaseOrderRequests(po_id: number){
        const {data, error} = await supabase.rpc('check_for_po_requests', {po_id: po_id});
        if(error){
            console.error('Error fetching purchase order requests: ', error);
            throw error;
        } else {
            console.log('Purchase Order Requests: ', data);
            return data;
        }
    },

    //Get Purchase Order Recipes
    async getPurchaseOrderRecipes(){
        const query = supabase.from('po_recipes').select('*');
        /* 
        if(filter_column)
            query.eq(filter_column, filter_data);
         */
        const {data, error} = await query;
        if(error){
            console.error('Error calling RPC: ', error);
            throw error;
        } else {
            console.log('PO Recipes: ', data);
            return data;
        }
    },

    //Get Purchase Order Recipes
    async getPurchaseOrderRecipesForPOPage(poIds: number[]){
        const query = supabase
            .from('po_recipes')
            .select('*')
            .in('purchase_order_id', poIds);

        /* 
        if(filter_column)
            query.eq(filter_column, filter_data);
         */
        const {data, error} = await query;
        if(error){
            console.error('Error calling RPC: ', error);
            throw error;
        } else {
            console.log('PO Recipes for POs: ', data);
            return data;
        }
    },

    //Add a Purchase Order Recipe
    async addPurchaseOrderRecipe(poRecipe: any){
        const {data, error} = await supabase.rpc('create_po_recipe', {record_array: {
            purchase_order_id: poRecipe.purchase_order_id,
            recipe_id: poRecipe.recipe_id,
            qty: poRecipe.qty
        }});
        if(error){
            console.error('Error calling RPC: ', error);
            throw error;
        } else {
            console.log('Purchase Order Recipe Created: ', data);
            return data;
        }
    },

    //Edit a Purchase Order Recipe
    async editPurchaseOrderRecipe(poRecipe: any){
        const {data, error} = await supabase.rpc('update_po_recipe', {record_array: [
            poRecipe.purchase_order_id,
            poRecipe.recipe_id,
            poRecipe.qty,
            poRecipe.po_recipe_id
        ]});
        if(error){
            console.error('Error calling RPC: ', error);
            throw error;
        } else {
            console.log('Purchase Order Recipe Updated: ', data);
            return data;
        }
    },

    //Add multiple cases at the same time
    async bulkAddPurchaseOrderRecipe(poRecipe: any){
        const {data, error} = await supabase.rpc('bulk_create_po_recipe', {record_array: poRecipe});
        if(error){
            console.error('Error calling RPC: ', error);
            throw error;
        } else {
            console.log(data);
            return data;
        }
    },

    async getAllPurchaseOrderRawLines(){
        const {data, error} = await supabase
            .from('po_raw_lines')
            .select('*');
        if(error){
            console.error('Error calling RPC: ', error);
            throw error;
        } else {
            console.log('Purchase Order Raw Lines: ', data);
            return data;
        }
    },

    // Get raw lines for a single purchase order (only gets raw lines for the specified purchase order, rather than all raw lines for all purchase orders)
    async getCurrentPurchaseOrderRawLines(po_id: number){
        const {data, error} = await supabase
            .from('po_raw_lines')            
            .select(`*, products(product_id, item_num, upc, name, price_2023)`)
            .eq('purchase_order_id', po_id);
        if(error){
            console.error('Error calling RPC: ', error);
            throw error;
        } else {
            console.log('Current Purchase Order Raw Lines: ', data);
            return data;
        }
    },

    /**
     * Creates a single raw line item for a purchase order.
     */
    async addPurchaseOrderRawLine(rawLine: {
        product_id: number;
        purchase_order_id: number;
        invoice_id?: number | null;
        total_units: number;
        store?: number;
        fbm?: number;
        fba_prep?: number;
        notes?: string | null;
        status: string;
    }){
        const payload = {
            product_id: rawLine.product_id,
            purchase_order_id: rawLine.purchase_order_id,
            invoice_id: rawLine.invoice_id ?? null,
            total_units: rawLine.total_units,
            store: rawLine.store ?? 0,
            fbm: rawLine.fbm ?? 0,
            fba_prep: rawLine.fba_prep ?? 0,
            notes: rawLine.notes ?? null,
            status: rawLine.status,
        };

        const {data, error} = await supabase.rpc('create_po_raw_line', {
            received_raw_line_data: payload,
        });

        if(error){
            console.error('Error creating purchase order raw line:', error);
            throw error;
        } else {
            console.log('Purchase Order Raw Line Created:', data);
            return data;
        }
    },

    /**
     * Creates multiple raw line items for a purchase order in one insert call.
     */
    async bulkAddPurchaseOrderRawLines(rawLines: {
        product_id: number;
        purchase_order_id: number;
        invoice_id?: number | null;
        total_units: number;
        store?: number;
        fbm?: number;
        fba_prep?: number;
        notes?: string | null;
        status: string;
    }[]){
        if (!Array.isArray(rawLines) || rawLines.length === 0) {
            return [];
        }

        const payload = rawLines.map((rawLine) => ({
            product_id: rawLine.product_id,
            purchase_order_id: rawLine.purchase_order_id,
            invoice_id: rawLine.invoice_id ?? null,
            total_units: rawLine.total_units,
            store: rawLine.store ?? 0,
            fbm: rawLine.fbm ?? 0,
            fba_prep: rawLine.fba_prep ?? 0,
            notes: rawLine.notes ?? null,
            status: rawLine.status,
        }));

        const {data, error} = await supabase.rpc('bulk_create_po_raw_lines', {
            record_array: payload,
        });

        if(error){
            console.error('Error creating purchase order raw lines:', error);
            throw error;
        } else {
            console.log('Purchase Order Raw Lines Created:', data);
            return data;
        }
    },

    /**
     * Edits a single raw line item for a purchase order.
     */
    async editPurchaseOrderRawLine(po_raw_line: {
        po_raw_line_id: number;
        product_id: number;
        purchase_order_id: number;
        invoice_id?: number | null;
        total_units: number;
        store?: number;
        fbm?: number;
        fba_prep?: number;
        notes?: string | null;
        status: string;
    }){
        const payload = {
            po_raw_line_id: po_raw_line.po_raw_line_id,
            product_id: po_raw_line.product_id,
            purchase_order_id: po_raw_line.purchase_order_id,
            invoice_id: po_raw_line.invoice_id ?? null,
            total_units: po_raw_line.total_units,
            store: po_raw_line.store ?? 0,
            fbm: po_raw_line.fbm ?? 0,
            fba_prep: po_raw_line.fba_prep ?? 0,
            notes: po_raw_line.notes ?? null,
            status: po_raw_line.status,
        };

        console.log("Raw line payload to update: ", payload);

        const {data, error} = await supabase.rpc('edit_po_raw_line', {
            received_raw_line_data: payload,
        });

        if(error){
            console.error('Error editing purchase order raw line:', error);
            throw error;
        } else {
            console.log('Purchase Order Raw Line Updated:', data);
            return data;
        }
    },

    async bulkEditPurchaseOrderRawLines(po_raw_lines: {
        po_raw_line_id: number;
        product_id: number;
        purchase_order_id: number;
        invoice_id?: number | null;
        total_units: number;
        store?: number;
        fbm?: number;
        fba_prep?: number;
        notes?: string | null;
        status: string;
    }[]){
        if (!Array.isArray(po_raw_lines) || po_raw_lines.length === 0) {
            return [];
        }

        const payload = po_raw_lines.map((rawLine) => ({
            po_raw_line_id: rawLine.po_raw_line_id,
            product_id: rawLine.product_id,
            purchase_order_id: rawLine.purchase_order_id,
            invoice_id: rawLine.invoice_id ?? null,
            total_units: rawLine.total_units,
            store: rawLine.store ?? 0,
            fbm: rawLine.fbm ?? 0,
            fba_prep: rawLine.fba_prep ?? 0,
            notes: rawLine.notes ?? null,
            status: rawLine.status,
        }));

        const {data, error} = await supabase.rpc('bulk_edit_raw_lines', {
            received_raw_line_data: payload,
        });

        if(error){
            console.error('Error editing purchase order raw lines:', error);
            throw error;
        } else {
            console.log('Purchase Order Raw Lines Updated:', po_raw_lines);
            return data;
        }
    },

    /**
     * Deletes a single raw line item by primary key.
     */
    async deletePurchaseOrderRawLine(po_raw_line_id: number){
        const {data, error} = await supabase
            .from('po_raw_lines')
            .delete()
            .eq('po_raw_line_id', po_raw_line_id)
            .select();

        if(error){
            console.error('Error deleting purchase order raw line:', error);
            throw error;
        } else {
            console.log('Purchase Order Raw Line Deleted:', data);
            return data;
        }
    },

    /**
     * Deletes multiple raw line items by primary key list.
     */
    async bulkDeletePurchaseOrderRawLines(po_raw_line_ids: number[]){
        if (!Array.isArray(po_raw_line_ids) || po_raw_line_ids.length === 0) {
            return [];
        }

        const {data, error} = await supabase
            .from('po_raw_lines')
            .delete()
            .in('po_raw_line_id', po_raw_line_ids)
            .select();

        if(error){
            console.error('Error deleting purchase order raw lines:', error);
            throw error;
        } else {
            console.log('Purchase Order Raw Lines Deleted:', data);
            return data;
        }
    },

    // INVOICES--------------------------------------------------------------------------------------------
    // Get invoices
    async getInvoices(){
        const {data, error} = await supabase
            .from('invoices')
            .select();
        if(error){
            console.error('Error calling RPC:', error);
        } else {
            console.log('Invoices:', data);
            return data;
        }
    },

    // Get invoices for a specific purchase order
    async getInvoicesForPurchaseOrder(po_id: number){
        const {data, error} = await supabase
            .from('invoices')
            .select()
            .eq('purchase_order_id', po_id);
        if(error){
            console.error('Error calling RPC:', error);
        } else {
            console.log('Invoices for Purchase Order:', data);
            return data;
        }
    },

    // Add an invoice
    async addInvoice(invoice: {
        invoice_name: string;
        total_cost: number;
        purchase_order_id: number;
        date_shipped: string | null;
        date_due: string | null;
        date_paid: string | null;
        card: number;
        filed: boolean;
        notes: string | null;
    }){
        const {data, error} = await supabase.rpc('create_invoice', {
            invoice_data: {
                invoice_name: invoice.invoice_name,
                purchase_order_id: invoice.purchase_order_id,
                total_cost: invoice.total_cost,
                date_shipped: invoice.date_shipped,
                date_due: invoice.date_due,
                date_paid: invoice.date_paid,
                card: invoice.card,
                filed: invoice.filed,
                notes: invoice.notes
            }
        });
        if(error){
            console.error('Error calling RPC:', error);
        } else {
            console.log('Invoice Created:', data);
            return data;
        }
    },

    // Add an invoice, and links raw line items to that invoice at the same time
    async addInvoiceWithRawLines(invoice: {
        invoice_name: string;
        total_cost: number;
        purchase_order_id: number;
        date_shipped: string | null;
        date_due: string | null;
        date_paid: string | null;
        card: number;
        filed: boolean;
        notes: string | null;
        status: string;
    }, rawLineIds: number[]){
        const {data, error} = await supabase.rpc('create_invoice_with_raw_lines', {
            invoice_data: {
                invoice_name: invoice.invoice_name,
                purchase_order_id: invoice.purchase_order_id,
                total_cost: invoice.total_cost,
                date_shipped: invoice.date_shipped,
                date_due: invoice.date_due,
                date_paid: invoice.date_paid,
                card: invoice.card,
                filed: invoice.filed,
                notes: invoice.notes,
                status: invoice.status
            },
            raw_line_ids: rawLineIds
        });
        if(error){
            console.error('Error calling RPC:', error);
            throw error;
        } else {
            console.log('Invoice with Raw Lines Created:', data);
            return data;
        }
    },

    // Edit an invoice
    async editInvoice(invoice: {
        invoice_id: number;
        invoice_name: string;
        total_cost: number;
        purchase_order_id: number;
        date_shipped: string | null;
        date_due: string | null;
        date_paid: string | null;
        card: number;
        filed: boolean;
        notes: string | null;
    }){
        const {data, error} = await supabase.rpc('update_invoice', {
            invoice_data: {
                invoice_id: invoice.invoice_id,
                invoice_name: invoice.invoice_name,
                purchase_order_id: invoice.purchase_order_id,
                total_cost: invoice.total_cost,
                date_shipped: invoice.date_shipped,
                date_due: invoice.date_due,
                date_paid: invoice.date_paid,
                card: invoice.card,
                filed: invoice.filed,
                notes: invoice.notes
            }
        });
        if(error){
            console.error('Error editing invoice:', error);
            throw error;
        } else {
            console.log('Invoice Updated:', data);
            return data;
        }
    },

    // Delete an invoice
    async deleteInvoice(invoice_id: number){
        const {data, error} = await supabase
            .from('invoices')
            .delete()
            .eq('invoice_id', invoice_id);
        if(error){
            console.error('Error deleting invoice:', error);
            throw error;
        } else {
            console.log('Invoice Deleted:', data);
            return data;
        }
    },

    //VENDORS--------------------------------------------------------------------------------------------
    //Get vendors
    async getVendors(): Promise<any[]> {
        const {data, error} = await supabase
            .from('vendors')
            .select('*')
            .order('vendor_name');
        if(error){
            console.error('Error calling RPC:', error);
            return [];
        } else {
            // console.log('Vendors:', data);
            return data ?? [];
        }
    },

    //Add a vendor
    async addVendor(vendor: any){
        const {data, error} = await supabase.rpc('create_vendor', { record_array: [
            vendor.vendor_name,
            vendor.vendor_nickname,
            vendor.contact_email,
            vendor.contact_name
        ]});
        if(error){
            console.error('Error calling RPC:', error);
        } else {
            console.log('Vendor Created:', data);
            return data;
        }
    },

    //Edit a vendor
    async editVendor(vendor: any){
        try {
            const {data, error} = await supabase
                .from('vendors')
                .update({
                    vendor_name: vendor.vendor_name,
                    vendor_nickname: vendor.vendor_nickname,
                    contact_email: vendor.contact_email,
                    contact_name: vendor.contact_name
                })
                .eq('vendor_id', vendor.vendor_id);
            if(error){
                console.error('Error editing vendor:', error);
                throw error;
            } else {
                console.log('Vendor Updated:', data);
                return data;
            }
        } catch (error) {
            console.error('Error editing vendor:', error);
            throw error;
        }
    },

    async getVendorsForPOPage(poVendorIds: number[]){
        const query = supabase
            .from('vendors')
            .select('*')
            .in('vendor_id', poVendorIds);

        /* 
        if(filter_column)
            query.eq(filter_column, filter_data);
         */
        const {data, error} = await query;
        if(error){
            console.error('Error calling RPC: ', error);
            throw error;
        } else {
            // console.log('Vendors for POs: ', data);
            return data;
        }
    },

    async getRecipesAndElementsForVendors(vendorId: number){
        console.log("Getting recipes and elements for vendor ID: ", vendorId);
        const {data, error} = await supabase.rpc('get_recipes_and_elements_for_vendors', {ven_id: vendorId});
        if(error){
            console.error('Error calling RPC:', error);
            throw error;
        } else {
            console.log('RECIPES AND ELEMENTS FOR VENDOR: ', data);
            return data;
        }
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

    async getRecipesAndElementsForPOs(poIds: number[]){
        const {data, error} = await supabase.rpc('get_recipes_for_pos', {po_ids: poIds});
        if(error){
            console.error('Error calling RPC:', error);
        } else {
            console.log('RECIPES AND ELEMENTS FOR POs:', data);
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

    async editRecipeElement(recipeElement: any){
        const {data, error} = await supabase
            .from('recipe_elements')
            .update({
                product_id: recipeElement.product_id,
                qty: recipeElement.qty
            })
            .eq('recipe_element_id', recipeElement.recipe_element_id);
        if(error){
            console.error('Error calling RPC:', error);
            throw error;
        } else {
            console.log('Recipe Element Updated:', data);
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
            // console.log('LOCATIONS:', data);
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
    /**
     * @description Gets a page of requests-to-process records based on paging, search, and sort options.
     * Mirrors the purchase order page loader pattern so RTP can be driven by backend RPC pagination.
     *
     * NOTE: This expects a Supabase RPC named `get_requests_to_process_with_details`.
     * If your SQL function name or arg names differ, update this call accordingly.
     */
    async getRequestsToProcessPage(
        page: number,
        rows_per_page: number,
        filter_field: string,
        filter_data: string,
        sort_field: string,
        sort_order: number,
        status_exclude: string
    ): Promise<{
        total_count: number;
        page: number;
        rows_per_page: number;
        requests_to_process: any[];
        all_purchase_orders: any[];
        all_po_recipes: any[];
        all_recipes: any[];
        all_recipe_elements: any[];
        all_products: any[];
    }> {
        let result = {
            total_count: 0,
            page,
            rows_per_page,
            requests_to_process: [] as any[],
            all_purchase_orders: [] as any[],
            all_po_recipes: [] as any[],
            all_recipes: [] as any[],
            all_recipe_elements: [] as any[],
            all_products: [] as any[],
        };

        try {
            const { data, error } = await supabase.rpc('get_requests_to_process_with_details', {
                in_page: page,
                in_rows_per_page: rows_per_page,
                in_filter_field: filter_field,
                in_filter_data: filter_data,
                in_sort_field: sort_field,
                in_sort_order: sort_order,
                in_status_exclude: status_exclude,
            });

            if (error) {
                console.error('Error calling RPC (getRequestsToProcessPage):', error);
                throw error;
            }

            console.log('Requests to Process page data:', data);
            result = data ?? result;
        } catch (err) {
            console.error('Error in getRequestsToProcessPage:', err);
            throw err;
        }

        return result;
    },

    // Get requests
    async getRequests(status: string){
        /**@TODO move filtering and data collection to a backend function 4-15-26 */
        const validPoStatuses = ['Ordered', 'Inbound', 'Partially Delivered', 'Delivered'];

        const nullPoQuery = supabase
            .from('requests_to_process')
            .select('*')
            .order('request_id')
            .is('purchase_order_id', null)
            .filter('status', 'neq', status);

        const linkedPoQuery = supabase
            .from('requests_to_process')
            .select('*, purchase_orders!inner(status)')
            .order('request_id')
            .filter('status', 'neq', status)
            .in('purchase_orders.status', validPoStatuses);

        const [nullPoResult, linkedPoResult] = await Promise.all([nullPoQuery, linkedPoQuery]);

        if (nullPoResult.error) {
            console.error('Error calling RPC: ', nullPoResult.error);
            throw nullPoResult.error;
        }

        if (linkedPoResult.error) {
            console.error('Error calling RPC: ', linkedPoResult.error);
            throw linkedPoResult.error;
        }

        const normalizedLinked = (linkedPoResult.data || []).map((row: any) => {
            const { purchase_orders, ...requestRow } = row;
            return requestRow;
        });

        const merged = [...(nullPoResult.data || []), ...normalizedLinked]
            .sort((a: any, b: any) => (a.request_id || 0) - (b.request_id || 0));

        console.log('Requests to Process: ', merged);
        return merged;
    },

    async getRequestedRecipes(){
        const query = supabase
        .from('po_recipes')
        .select(`
            *,  
            purchase_orders!inner(status, purchase_order_name),
            recipes!inner(*, products!inner(*))
            `)
        // .filter('products.fnsku', 'neq', null)
        // .filter('products.asin', 'neq', null)
        // .eq('recipes.recipe_elements.type', 'output')
        .in('purchase_orders.status', ['Ordered','Inbound', 'Partially Delivered', 'Delivered']);

        const {data, error} = await query;
        if(error){
            console.error('Error calling RPC: ', error);
            throw error;
        } else {
            console.log('Requested recipes: ', data);
            const flattenedData = data.map(recipeItem => ({
                ...recipeItem,
                product_name: recipeItem.recipes.products.name,
                product_id: recipeItem.recipes.products.product_id,
                fnsku: recipeItem.recipes.products.fnsku,
                asin: recipeItem.recipes.products.asin,
                units_per_case: recipeItem.recipes.products.default_units_per_case,
                bag_size: recipeItem.recipes.products.bag_size,
                box_size: recipeItem.recipes.products.box_size

            }));
            console.log("Flattened recipes: ", flattenedData);
            return flattenedData;
        }
    },

    async getRequestedBoxes(){
        const query = supabase
            .from('cases')
            .select(`
                *,  
                products!inner(item_num, upc, name)
                `)
            .or('item_num.neq.null,upc.neq.null', {referencedTable: 'products'})
            .neq('status', 'Draft');

        const {data, error} = await query;
        if(error){
            console.error('Error calling RPC: ', error);
            throw error;
        } else {
            // console.log('Requested boxes: ', data);
            const flattenedData = data.map(boxItem => ({
                ...boxItem,
                product_name: boxItem.products.name
            }));
            console.log("Requested boxes: ", flattenedData);
            return flattenedData;
        }
    },

    async getDeliveredBoxes(){
        const query = supabase
            .from('cases')
            .select(`
                *,  
                products!inner(item_num, upc, name),
                locations!inner(*)
                `)
            .or('item_num.neq.null,upc.neq.null', {referencedTable: 'products'})
            .or('status.neq.Draft, status.neq.Submitted, status.neq.Ordered, status.neq.Inbound, status.neq.Partially Delivered');

        const {data, error} = await query;
        if(error){
            console.error('Error calling RPC: ', error);
            throw error;
        } else {
            console.log('Delivered boxes: ', data);
            const flattenedData = data.map(boxItem => ({
                ...boxItem,
                product_name: boxItem.products.name,
                location_name: boxItem.locations.name
            }));
            console.log("Requested boxes: ", flattenedData);
            return flattenedData;
        }
    },

    /**
     * Grabs cases that are planned in PO's but haven't been processed yet
     * @returns An array of processed cases for the request to process page
     */
    async getRequestedCases(){
        const query = supabase
            .from('cases')
            .select(`
                *,  
                products!inner(fnsku, asin, name)
                `)
            .or('fnsku.neq.null,asin.neq.null', {referencedTable: 'products'})
            .in('status', ['Submitted','Ordered','Inbound','Ready']);

        const {data, error} = await query;
        if(error){
            console.error('Error calling RPC: ', error);
            throw error;
        } else {
            console.log('Requested cases: ', data);
            const flattenedData = data.map(caseItem => ({
                ...caseItem,
                product_name: caseItem.products.name
            }));
            console.log("Flattened cases: ", flattenedData);
            return flattenedData;
        }
    },

    // Create a request
    async addRequest(request: {
        product_id: number; 
        purchase_order_id: number | null;
        notes: string | null, 
        status: string,
        labels_printed: boolean; 
        ship_label: boolean; 
        priority: string; 
        ship_to_amz: number; 
        deadline: Date | null; 
        warehouse_qty: number;
        container_qty: number;
    }){
        /* const {data,error} = await supabase.rpc('create_request', {record_array: [
            request.product_id,
            request.purchase_order_id,
            request.notes,
            request.status,
            request.labels_printed,
            request.ship_label,
            request.priority,
            request.ship_to_amz,
            request.deadline,
            request.warehouse_qty,
            request.container_qty
        ]}) */
        const {data, error } = await supabase
            .from('requests_to_process')
            .insert({
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
                container_qty: request.container_qty
            })
            .select();
        if(error){
            console.error('Error calling RPC: ', error);
            throw error;
        } else {
            console.log('Request added: ', data);
        }
    },

    // Update a request
    async editRequest(request: {
        product_id: number; 
        purchase_order_id: number | null;
        notes: string | null, 
        status: string,
        labels_printed: boolean; 
        ship_label: boolean; 
        priority: string; 
        ship_to_amz: number; 
        deadline: Date | null; 
        warehouse_qty: number;
        request_id: number;
        container_qty: number;
    }){
        console.log('Request in utils: ', request);
        /* const {data,error} = await supabase.rpc('update_request', {record_array: [
            request.product_id, request.purchase_order_id, request.notes,
            request.status, request.labels_printed, request.ship_label,
            request.priority, request.ship_to_amz, request.deadline,
            request.warehouse_qty, request.request_id, request.container_qty
        ]}) */
        const {data, error} = await supabase
            .from('requests_to_process')
            .update({
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
                container_qty: request.container_qty
            })
            .eq('request_id', request.request_id)
            .select();
        if(error){
            console.error('Error calling RPC: ', error);
            throw error;
        } else {
            console.log('Request updated: ', data);
        }
    },

    //Delete a request
    async deleteRequest(id: number){
        const query = supabase.from('requests_to_process').delete().eq('request_id', id).select();

        const {data,error} = await query;
        if(error){
            console.error('Error calling RPC: ', error);
            throw error;
        } else {
            console.log('Request deleted: ', data);
        }
    },

    // Batch insert requests into the database
    /* async batchInsertRequests(request: any[]){
        return axios.post(BASE_URL+"/requests/batchInsert",request).catch(error => {
            console.log(error);
        });
    }, */

    // Batch update requests into the database
    /* async batchUpdateRequests(request: any[]){
        return axios.post(BASE_URL+"/requests/batchUpdate",request).catch(error => {
            console.log(error);
        });
    }, */

    // Grabbing requests for picklists
    async getRequestsForPick(){
        try {
            const {data: usedRequestIds, error: idQueryError} = await supabase
                .from('picklist_elements')
                .select('request_id');

                if(idQueryError){
                    throw idQueryError
                } else {
                    console.log('Used Req Ids: ', usedRequestIds);
                    console.log('Array length', usedRequestIds.length);
                    let requestIds: number[] = [];
                    usedRequestIds.forEach(record => {
                        if(requestIds.includes(record.request_id) === false)
                            requestIds.push(record.request_id);
                    });
                    console.log("Request Id Array: ", requestIds);
                    const query =  supabase
                        .from('requests_to_process')
                        .select(`
                            *,
                            products(product_id, fnsku, asin, name, default_units_per_case, cases(*), recipe_elements(*)),
                            purchase_orders(purchase_order_id, purchase_order_name, status, po_recipes(*))
                            `)
                        .neq('status', '0 COMPLETED')
                        .neq('status', '5 ON ORDER')
                        // .eq('purchase_orders.po_recipes.recipe_id', 'products.recipe_elements[0].recipe_id')
                        .or('ship_to_amz.neq.0, warehouse_qty.neq.0')
                        .or('fnsku.neq.null,asin.neq.null', {referencedTable: 'products'})
                        .or('status.eq.Delivered, status.eq.Partially Delivered', {referencedTable: 'purchase_orders'})
                        .order('status');

                    /* if(usedRequestIds.length > 0)
                        query.not('request_id','in', requestIds) */
                    
                    const { data, error } = await query;
                    if(error){
                        throw error;
                    } else {
                        console.log('Request data for picklist: ', data);
                        const flattenedData = data.map(request => ({
                            ...request,
                            reqPriority: helper.getRequestPriority(request.deadline),
                            purchase_order_name: request.purchase_order_id != null ? request.purchase_orders.purchase_order_name : '',
                            product_name: request.products.name,
                            asin: request.products.asin,
                            fnsku: request.products.fnsku,
                            default_units_per_case: request.products.default_units_per_case,
                            recipe_id: request.products.recipe_elements[0].recipe_id
                        }));
                        // console.log("Flattened requests: ", flattenedData);
                        return flattenedData;
                    }
                }
        } catch (error) {
            console.error('Error calling RPC: ', error);
        }
    },

    //PICKLISTS--------------------------------------------------------------------------------------------
    // Get picklists
    async getPicklists(){
        try {
            const query = supabase
                .from('picklists')
                .select(`
                    *,
                    requests_to_process(*, products(name), picklist_elements(*, cases(*, locations(name), products(name))))
                    `);
                
            const {data, error} = await query;
            if(error)
                throw error;
            else{
                console.log("Picklists: ", data);
                return data;
            }
        } catch (error) {
            console.error('Error grabbing data: ', error);
        }
    },

    async getPicklistLabels(){
        try {
            const {data: labels, error} = await supabase
                .from('picklists')
                .select('label');
            if(error)
                throw error;
            else{
                return labels;
            }
        } catch (error) {
            console.error("Error grabbing labels: ", error);
        }
    },

    
    async generatePicklistElement(recipe_id: Number){
        try {
            const query = supabase
                .from('recipes')
                .select(`
                    *,
                    recipe_elements(*, products(*, cases(*, locations(*))))
                    `)
                .eq('recipe_id', recipe_id)
                .eq('recipe_elements.type', 'input')
                .eq('recipe_elements.products.cases.status', 'Ready');

            const {data, error} = await query;
            if(error){
                throw error;
            } else {
                // console.log('Required fields:', data);
                return data[0];
            }

        } catch (error) {
            console.error("Error calling RPC: ", error);
        }
    },

    /**
     * Generates a picklist and updates all boxes being used in the picklist to contain a status of "picked"
     * @param picklistData The data for the newly created picklist, including picklist element data 
     * @returns 
     */
    async addPicklist( picklistData: {label: string, picklistElements: {notes: string, request_id: number, lane_location: string, usedCaseIds: number[]}[]}){
        try {
            console.log("Picklist Data: ", picklistData);
            const {data, error} = await supabase.rpc('create_picklist', {picklist_data: picklistData});
            if (error)
                throw error;
            else {
                console.log('Data inserted successfully');
            }
        } catch(error) {
            // console.error("Error calling RPC: ", error);
            throw error;
        }
    },

    async editPicklistElement(fieldName: string, fieldValue: any, picklistElementId: number){
        try {
            const {data, error} = await supabase
                .from('picklist_elements')
                .update({[fieldName]: fieldValue})
                .eq('picklist_element_id', picklistElementId);
            if (error)
                throw error;
            else {
                console.log('Picklist element updated successfully', data);
            }
        } catch(error) {
            console.error("Error calling RPC: ", error);
            throw error;
        }
    },

    async editPickedStatus(usedCaseIds: number[], status: string){
        try {
            console.log("Used Case Ids: ", usedCaseIds);
            console.log("Status: ", status);
            const {data, error} = await supabase
                .from('cases')
                .update({status: status})
                .in('case_id', usedCaseIds);
            if (error)
                throw error;
            else {
                console.log('Cases updated successfully', data);
            }
        } catch(error) {
            // console.error("Error calling RPC: ", error);
            throw error;
        }
    },

    // Update a picklist
    // router.put("/picklists/:id", updatePicklist);
    async editPicklist(picklist: {
        picklist_id: number;
        label: string; 
    }){
        
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