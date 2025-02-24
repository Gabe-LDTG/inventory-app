var helper = {
    formatDate(rawDate: string) {
        var date = new Date(rawDate);
        //momentDate = this.eCase.date_received;
        //console.log("TESTING DATES: ", date);

        return date.getFullYear()+'-'+(date.getMonth()+1)+'-'+date.getDate();
    },

    getDate(){
        const date = new Date();
        console.log("TODAYS DATE ", date.getFullYear()+'-'+(date.getMonth()+1)+'-'+date.getDate());
        return date.getFullYear()+'-'+(date.getMonth()+1)+'-'+date.getDate();
    },

    /**
     * Description: Groups items together to get the total amount per item
     * @param itemArray {any[]} An array of individual records that needs to be grouped
     * @returns Gets an array where the values are records grouped together by product_id, status, 
     * and units_per_case
     * 
     * Created by: Gabe de la Torre
     * Date Created: 6-03-2024
     * Date Last Edited: 7-19-2024
     */
    groupProducts(itemArray: any[]){
        // get the items in the pool along with their amount
        let pool: (typeof itemArray)[number] & { amount: number } = Object.values(itemArray.reduce((map, item) => {
            const key = item.product_id + ':' + item.status + ':' + item.units_per_case;
            //console.log("KEY", key);
            //console.log("MAP", map);
            if (map[key]) { // if it already exists, incremenet
                map[key].amount++;
                //console.log(map[key].amount);
            }
            else // otherwise, add it to the map
                map[key] = { ...item, units_per_case: item.units_per_case, status: item.status, amount: 1 };
            return map;
        }, { } as { [product_id: number]: (typeof itemArray)[number] & { amount: number } }));

        //console.log("POOL", pool);
        return pool;
    },

    /**
     * Description: Groups products together to get the total amount per product based on a specified key
     * @param prodArray {any[]} An array of individual records that needs to be grouped
     * @param keyString {string} A string of fields that is used to group records together
     * @returns Gets an array where the values are records grouped together by product_id, units_per_case, 
     * and the contents of the keyString
     * 
     * Created by: Gabe de la Torre
     * Date Created: 7-19-2024
     * Date Last Edited: 7-19-2024
     */
    groupProductsByKey(prodArray: any[], keyArray: any[]){
        // get the products in the pool along with their amount
        let pool: (typeof prodArray)[number] & { amount: number } = Object.values(prodArray.reduce((map, product) => {
            let keyString = "";
            keyArray.forEach(key => keyString += ':'+product[key]);

            const key = product.product_id + ':' + product.units_per_case + keyString;
            if (map[key]) { // if it already exists, incremenet
                map[key].amount++;
            }
            else // otherwise, add it to the map
                map[key] = { ...product, units_per_case: product.units_per_case, location: product.location, amount: 1 };
            return map;
        }, { } as { [product_id: number]: (typeof prodArray)[number] & { amount: number } }));

        return pool;
    },

    /**
     * Groups products together to get the total amount per product based on a specified key. 
     * Displays the largest box quantity
     * @param prodArray {any[]} An array of individual records that needs to be grouped
     * @returns Gets an array where the values are records grouped together by product_id
     * 
     * Created by: Gabe de la Torre
     * Date Created: 2-24-2025
     * Date Last Edited: 2-24-2025
     */
    groupProductsById(prodArray: any[]){
        // get the products in the pool along with their amount
        let pool: (typeof prodArray)[number] & { amount: number } = Object.values(prodArray.reduce((map, product) => {

            const key = product.product_id
            if (map[key]) { // if it already exists, incremenet
                console.log("Amount: ", map[key].amount);
                console.log("Total Units: ", map[key].totalUnits);
                map[key].amount++;
                map[key].totalUnits += product.units_per_case;
                if(map[key].units_per_case < product.units_per_case)
                    map[key].units_per_case = product.units_per_case;
            }
            else // otherwise, add it to the map
                map[key] = { ...product, units_per_case: product.units_per_case, location: product.location, amount: 1, totalUnits: product.units_per_case};
            return map;
        }, { } as { [product_id: number]: (typeof prodArray)[number] & { amount: number } }));

        return pool;
    },

    /**
     * Description: Groups products together to get the total amount per product based on a specified key
     * @param itemArray {any[]} An array of individual records that needs to be grouped
     * @param keyString {string} A string of fields that is used to group records together
     * @returns Gets an array where the values are records grouped together by the contents of the keyString
     * 
     * Created by: Gabe de la Torre
     * Date Created: 7-19-2024
     * Date Last Edited: 7-19-2024
     */
    groupItemsByKey(itemArray: any[], keyArray: any[]){
        // get the items in the pool along with their amount
        let pool: (typeof itemArray)[number] & { amount: number } = Object.values(itemArray.reduce((map, item) => {
            let keyString = "";
            keyArray.forEach(key => keyString += ':'+item[key]);

            const key = keyString;
            if (map[key]) { // if it already exists, incremenet
                map[key].amount++;
            }
            else // otherwise, add it to the map
                map[key] = { ...item, units_per_case: item.units_per_case, location: item.location, amount: 1 };
            return map;
        }, { } as { [item_id: number]: (typeof itemArray)[number] & { amount: number } }));

        return pool;
    },
}

export default helper;