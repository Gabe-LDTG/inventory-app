//import connection
import db from "../config/database.js";

const getProd = 'SELECT * FROM products';
const prodToInsert = '(name, asin, fnsku, upc, notes, 30_day_storage_cost, amz_fees_cost, amz_fulfilment_cost, bag_cost, bag_size, box_cost, box_type, date_added, do_we_carry, holiday_storage_cost, in_shipping_cost, item_cost, item_num, labor_cost, map, meltable, misc_cost, out_shipping_cost, price_2021, price_2022, price_2023, process_time_per_unit_sec, total_cost, total_holiday_cost, vendor, weight_lbs)';
const whereProc = 'WHERE (fnsku IS NOT NULL OR asin IS NOT NULL) AND (fnsku <> "" OR asin <> "")';
const whereUnproc = 'WHERE (fnsku IS NULL AND asin IS NULL) OR (fnsku = "" AND asin = "") OR (fnsku IS NULL AND asin = "") OR (fnsku = "" AND asin IS NULL)';
//WHERE upc IS NOT NULL AND 

//get all products
export const getProducts=(result)=>{
    db.query(getProd,(err,results)=>{
        if(err){
            console.log(err);
            result(err,null);
        }else{
            result(null, results);
        }
    });
}

//get processed products (has fnsku and/or asin)
export const getProcProducts=(result)=>{
    db.query("SELECT * FROM products "+whereProc,(err,results)=>{
        if(err){
            console.log(err);
            result(err,null);
        }else{
            result(null, results);
        }
    });
}

//get unprocessed products (has upc and/or no fnsku)
export const getUnprocProducts=(result)=>{
    db.query("SELECT * FROM products "+whereUnproc,(err,results)=>{
        if(err){
            console.log(err);
            result(err,null);
        }else{
            result(null, results);
        }
    });
}

//get single produt
export const getProductById = (id,result)=>{
    db.query(
        "SELECT * FROM products WHERE id = ?",
        [id],
        (err,results) => {
            if (err) {
                console.log(err);
                result(err, null);
            } else {
                result(null, results);
            }
        }
    );
};

//insert product to database
export const insertProduct=(data,result)=>{
    let info = [data.name, data.asin, data.fnsku, data.upc, data.notes, data['30_day_storage_cost'], data.amz_fees_cost, data.amz_fulfilment_cost, data.bag_cost, data.bag_size, data.box_cost, data.box_type, data.date_added, data.do_we_carry, data.holiday_storage_cost, data.in_shipping_cost, data.item_cost, data.item_num, data.labor_cost, data.map, data.meltable, data.misc_cost, data.out_shipping_cost, data.price_2021, data.price_2022, data.price_2023, data.process_time_per_unit_sec, data.total_cost, data.total_holiday_cost, data.vendor, data.weight_lbs];
    db.query("INSERT INTO products "+prodToInsert+" VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", info,(err,results)=>{
        if (err) {
            console.log(err);
            result(err, null);
        } else {
            console.log(results);
            result(null, results);
        }
    });
}

// Update Product to Database
export const updateProductById = (data, id, result) => {
    //console.log("_________________________________________________")
    //console.log(data);
    let info = [data.name, data.asin, data.fnsku, data.upc, data.notes, data['30_day_storage_cost'], data.amz_fees_cost, data.amz_fulfilment_cost, data.bag_cost, data.bag_size, data.box_cost, data.box_type, data.date_added, data.do_we_carry, data.holiday_storage_cost, data.in_shipping_cost, data.item_cost, data.item_num, data.labor_cost, data.map, data.meltable, data.misc_cost, data.out_shipping_cost, data.price_2021, data.price_2022, data.price_2023, data.process_time_per_unit_sec, data.total_cost, data.total_holiday_cost, data.vendor, data.weight_lbs, id];
    db.query("UPDATE products SET name = ?, asin = ?, fnsku = ?, upc = ?, notes = ?, 30_day_storage_cost = ?, amz_fees_cost = ?, amz_fulfilment_cost = ?, bag_cost = ?, bag_size = ?, box_cost = ?, box_type = ?, date_added = ?, do_we_carry = ?, holiday_storage_cost = ?, in_shipping_cost = ?, item_cost = ?, item_num = ?, labor_cost = ?, map = ?, meltable = ?, misc_cost = ?, out_shipping_cost = ?, price_2021 = ?, price_2022 = ?, price_2023 = ?, process_time_per_unit_sec = ?, total_cost = ?, total_holiday_cost = ?, vendor = ?, weight_lbs = ? WHERE id = ?", info,(err,results)=>{
        if (err) {
            console.log(err);
            result(err, null);
        } else {
            result(null, results);
        }
    });
}

//Delete Product from Database
export const deleteProductById = (id, result) => {
    db.query("DELETE FROM products WHERE id = ?", [id], (err,results) => {
        if(err) {
            console.log(err);
            result(err, null);
        } else {
            result(null, results);
        }
    });
}