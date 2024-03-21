import {
    getVendors,
    insertVendor,
    updateVendorById
} from '../models/VendorModel.js'

//get all vendors
export async function showVendors(req, res){
    try {
        const vendors = await getVendors();
        res.json(vendors);
    } catch (error) {
        console.error(error);
        res.sendStatus(500);
    }
};

//create new vendor
export async function createVendor(req, res){
    try {
        let data = req.body;
        const createdVendor = await insertVendor(data);
        //console.log(createdVendor);
        res.json(createdVendor);
    } catch (error) {
        console.error(error);
        res.sendStatus(500);
    }
};

// Update Vendor 
export async function updateVendor (req, res){
    try {
        const data = req.body;
        const id = req.params.id;

        const updatedVendor = await updateVendorById(data, id);
        res.json(updatedVendor);
    } catch (err) {
        console.error(err);
        res.sendStatus(500);
    }
}