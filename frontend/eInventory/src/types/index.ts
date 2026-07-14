import { type Database } from './database.types';
// This magical type forces TypeScript to visually flatten nested objects in tooltips and errors
export type Prettify<T> = { [K in keyof T]: T[K] } & {};

// ─── 1. EXTRACTED DATABASE TYPES ───
// Extract rows cleanly so you don't have to type out the massive nested path everywhere
export type AuditLog = Database['public']['Tables']['audit_logs']['Row'];
export type Case = Database['public']['Tables']['cases']['Row'];
export type Invoice = Database['public']['Tables']['invoices']['Row'];
export type Location = Database['public']['Tables']['locations']['Row'];
export type PicklistElement = Database['public']['Tables']['picklist_elements']['Row'];
export type Picklist = Database['public']['Tables']['picklists']['Row'];
export type PORawLine = Database['public']['Tables']['po_raw_lines']['Row'];
export type PORecipe = Database['public']['Tables']['po_recipes']['Row'];
export type POUnitAllocation = Database['public']['Tables']['po_unit_allocations']['Row'];
export type Product = Database['public']['Tables']['products']['Row'];
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type PurchaseOrder = Database['public']['Tables']['purchase_orders']['Row'];
export type RecipeElement = Database['public']['Tables']['recipe_elements']['Row'];
export type Recipe = Database['public']['Tables']['recipes']['Row'];
export type RequestToProcess = Database['public']['Tables']['requests_to_process']['Row'];
export type Vendor = Database['public']['Tables']['vendors']['Row'];

// ─── 2. CUSTOM UI / FRONTEND INTERFACES ───
// These do not exist in the database, but are needed for Vue components
export interface CasesWithLocationAndKeyProductFields extends Case {
    location_name: string;
    product_name: string;
    fnsku: string;
    asin: string;
    item_num: string;
    upc: string;
    is_processed: boolean;
};

export interface GroupedCasesWithLocationAndKeyProductFields extends CasesWithLocationAndKeyProductFields {
    amount: number;
    total_units: number;
};

export interface PORawLinesWithKeyProductFieldsAndAllocations extends PORawLine {
    product_name: string;
    product_upc: string;
    product_item_num: string;
    product_default_units_per_case: number;
    allocations: POUnitAllocation[];
    planned_fba_prep: number;
    received_fba_prep: number;
    planned_fbm: number;
    received_fbm: number;
    planned_store: number;
    received_store: number;
};

export interface InvoiceWithRawLinesAndAllocations extends Invoice {
    po_raw_lines: PORawLinesWithKeyProductFieldsAndAllocations[];
};

export interface PurchaseOrderWithDetails extends PurchaseOrder {
    grouped_boxes: GroupedCasesWithLocationAndKeyProductFields[];
    grouped_cases: GroupedCasesWithLocationAndKeyProductFields[];
    individual_boxes: CasesWithLocationAndKeyProductFields[];
    po_recipes: PORecipe[];
    po_raw_lines: PORawLinesWithKeyProductFieldsAndAllocations[];
    invoices: InvoiceWithRawLinesAndAllocations[];
    recipes: Recipe[];
    recipe_elements: RecipeElement[];
    vendor_name: string;
};

export interface PurchaseOrderPageDetails {
    total_count: number;
    page: number;
    rows_per_page: number;
    all_boxes: CasesWithLocationAndKeyProductFields[];
    all_po_recipes: PORecipe[];
    all_recipes: Recipe[];
    all_recipe_elements: RecipeElement[];
    all_products: Product[];
    all_po_raw_lines: PORawLinesWithKeyProductFieldsAndAllocations[];
    all_invoices: InvoiceWithRawLinesAndAllocations[];
    all_boxes_ids: number[];
    all_po_recipes_ids: number[];
    all_products_ids: number[];
    all_po_raw_lines_ids: number[];
    all_invoices_ids: number[];
    purchase_order_ids: number[];
    purchase_orders: PurchaseOrderWithDetails[];
};

export type CleanPOPageDetails = Prettify<PurchaseOrderPageDetails>;