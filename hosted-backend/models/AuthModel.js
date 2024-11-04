import { supabase } from "../config/supabase";

//get all values from testing
export async function getTests(){
    return await supabase.from('testing').select().then(([results, fields])=>results);
}