import sequelize from "../config/server";
import { DataTypes } from 'sequelize';

const Product = sequelize.define("products", {
   amz_fees_cost: {
     type: DataTypes.DECIMAL,
   },
   amz_fulfilment_cost: {
     type: DataTypes.DECIMAL,
   },
   asin: {
     type: DataTypes.STRING(10),
   },
   bag_cost: {
     type: DataTypes.DECIMAL,
   },
   bag_size: {
     type: DataTypes.STRING,
   },
   box_cost: {
    type: DataTypes.DECIMAL,
   },
   box_type: {
    type: DataTypes.STRING,
   },
   date_added: {
    type: DataTypes.DATE,
   },
   default_units_per_case: {
    type: DataTypes.DECIMAL,
   },
   do_we_carry: {
    type: DataTypes.STRING,
   },
   fnsku: {
    type: DataTypes.STRING,
   },
   holiday_storage_cost: {
    type: DataTypes.DECIMAL,
   },
   in_shipping_cost: {
    type: DataTypes.DECIMAL,
   },
   item_cost: {
    type: DataTypes.DECIMAL,
   },
   item_num: {
    type: DataTypes.STRING,
   },
   labor_cost: {
    type: DataTypes.DECIMAL,
   },
   map: {
    type: DataTypes.DECIMAL,
   },
   meltable: {
    type: DataTypes.STRING,
   },
   misc_cost: {
    type: DataTypes.DECIMAL,
   },
   name: {
    type: DataTypes.STRING,
   },
   notes: {
    type: DataTypes.STRING,
   },
   out_shipping_cost: {
    type: DataTypes.DECIMAL,
   },
   price_2021: {
    type: DataTypes.DECIMAL,
   },
   price_2022: {
    type: DataTypes.DECIMAL,
   },
   price_2023: {
    type: DataTypes.DECIMAL,
   },
   process_time_per_unit_sec: {
    type: DataTypes.INTEGER,
   },
   products_needed_a: {
    type: DataTypes.INTEGER,

    references: {
        // This is a reference to another model
        model: Product,
  
        // This is the column name of the referenced model
        key: 'id',
        },
   },
   products_needed_b: {
    type: DataTypes.INTEGER,
   },
   products_needed_c: {
    type: DataTypes.INTEGER,
   },
   products_needed_d: {
    type: DataTypes.INTEGER,
   },
   products_needed_e: {
    type: DataTypes.INTEGER,
   },
   products_needed_f: {
    type: DataTypes.INTEGER,
   },
   qty_1: {
    type: DataTypes.INTEGER,
   },
   qty_2: {
    type: DataTypes.INTEGER,
   },
   qty_3: {
    type: DataTypes.INTEGER,
   },
   qty_4: {
    type: DataTypes.INTEGER,
   },
   qty_5: {
    type: DataTypes.INTEGER,
   },
   qty_6: {
    type: DataTypes.INTEGER,
   },
   storage_cost_30_day: {
    type: DataTypes.DECIMAL,
   },
   total_cost: {
    type: DataTypes.DECIMAL,
   },
   total_holiday_cost: {
    type: DataTypes.DECIMAL,
   },
   upc: {
    type: DataTypes.STRING,
   },
   vendor: {
    type: DataTypes.STRING,
   },
   weight_lbs: {
    type: DataTypes.INTEGER,
   },
});