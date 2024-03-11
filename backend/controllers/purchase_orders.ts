import {
    getPurchaseOrders,
    insertPurchaseOrder,
    deletePurchaseOrder,
    updatePurOrdById,
} from '../models/PurchaseOrderModel';

//get all purchase orders
export async function showPurchaseOrders(req: any,res: any){
    try {
        const purchaseOrders = await getPurchaseOrders();
        res.json(purchaseOrders);
        //console.log("SESSION ID: ",req.session.cookie);
    } catch (err) {
        console.error(err);
        res.sendStatus(500);
    }
};

//create new purchase order
export async function createPurchaseOrder (req: any,res: any){
    try {
        const data=req.body;
        let insertedPurchaseOrder = await insertPurchaseOrder(data);
        
        res.json(insertedPurchaseOrder);
    } catch (err) {
        console.error(err);
        res.sendStatus(500);
    }
};

//Delete PurchaseOrder
export async function deletePurchaseOrder(req, res){
    try {
        const id = req.params.id;

        const deletedPurchaseOrder = await deletePurchaseOrder(id);
        res.json(deletedPurchaseOrder);
    } catch (err) {
        console.error(err);
        res.status(500).send(err.message);
    }
}

// Update Purchase Order 
export async function updatePurchaseOrder (req: any,res: any){
    try {
        const data = req.body;
        const id = req.params.id;

        const updatedPurchaseOrder = await updatePurOrdById(data, id);
        res.json(updatedPurchaseOrder);
    } catch (err) {
        console.error(err);
        res.sendStatus(500);
    }
}