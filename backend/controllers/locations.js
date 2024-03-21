import {
    getLocations,
    insertLocation,
    updateLocationById
} from '../models/Locations.js'

//get all locations
export async function showLocations(req, res){
    try {
        const locations = await getLocations();
        res.json(locations);
    } catch (error) {
        console.error(error);
        res.sendStatus(500);
    }
};

//create new location
export async function createLocation(req, res){
    try {
        let data = req.body;
        const createdLocation = await insertLocation(data);
        console.log(createdLocation);
        res.json(createdLocation);
    } catch (error) {
        console.error(error);
        res.sendStatus(500);
    }
};

// Update Location 
export async function updateLocation (req, res){
    try {
        const data = req.body;
        const id = req.params.id;

        const updatedLocation = await updateLocationById(data, id);
        res.json(updatedLocation);
    } catch (err) {
        console.error(err);
        res.sendStatus(500);
    }
}