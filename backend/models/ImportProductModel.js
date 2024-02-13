//import connection
import db from "../config/database.js";

//insert product to database
export async function insertProcessedProductKey(data){
    let info = [
        data.name,
        data.date_added,
        data.do_we_carry,
        data.vendor,
        data.fnsku,
        data.asin,
        data.default_units_per_case,
        data.weight_lbs,
        data.box_type,
        data.box_cost,
        data.bag_size,
        data.process_time_per_unit_sec,
        data.meltable,
        data.products_needed_a,
        data.item_num_1,
        data.qty_1,
        data.products_needed_b,
        data.item_num_2,
        data.qty_2,
        data.products_needed_c,
        data.item_num_3,
        data.qty_3,
        data.products_needed_d,
        data.item_num_4,
        data.qty_4,
        data.products_needed_e,
        data.item_num_5,
        data.qty_5,
        data.products_needed_f,
        data.item_num_6,
        data.qty_6,
        data.bag_cost,
        data.in_shipping_cost,
        data.out_shipping_cost,
        data.labor_cost,
        data.item_cost,
        data.misc_cost,
        data.amz_fees_cost,
        data.amz_fulfiment_cost,
        data.storage_cost_30_day,
        data.holiday_storage_cost,
        data.total_cost,
        data.total_holiday_cost,
        data.notes,
    ];
    return db.query("INSERT INTO products "+prodToInsert+" VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", info).then(([results, fields])=>results);
}

//insert product to database
export async function insertRawProductKey(data){
    let info = [
        data.vendor, 
        data.name,
        data.item_num, 
        data.price_2021, 
        data.price_2022, 
        data.price_2023, 
        data.default_units_per_case,
        data.map, 
        data.upc, 
        data.notes,   
        ];
    return db.query("INSERT INTO products "+prodToInsert+" VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", info).then(([results, fields])=>results);
}

//insert product to database
export async function insertProcessedProductList(data){
    let info = [
        data.status,
        data.location,
        data.space,
        data.vendor,
        data.asin,
        data.item,
        data.fnsku,
        data.notes,
        data.default_units_per_case,
        data.number_of_cases,
        data.total_units,
        data.cost,
        data.total,
        data.weight_lbs,
        data.box_type,
        data.bag_size,
    ];
    return db.query("INSERT INTO products "+prodToInsert+" VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", info).then(([results, fields])=>results);
}

//insert product to database
export async function insertUnprocessedProductList(data){
    let info = [
        data.status,
        data.location,
        data.space,
        data.vendor,
        data.description,
        data.notes,
        data.default_units_per_case,
        data.number_of_cases,
        data.total_units,
        data.cost,
        data.total,
    ];
    return db.query("INSERT INTO products "+prodToInsert+" VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", info).then(([results, fields])=>results);
}