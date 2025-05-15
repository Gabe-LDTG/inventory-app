var helper = {
    formatDate(rawDate: string) {
        var date = new Date(rawDate);
        //momentDate = this.eCase.date_received;
        //console.log("TESTING DATES: ", date);

        return date.getFullYear()+'-'+(date.getMonth()+1)+'-'+date.getDate();
    },

    formatDateTS(rawDate: Date | null) {
        //momentDate = this.eCase.date_received;
        //console.log("TESTING DATES: ", date);
        // console.log("Raw Date: ", rawDate);
        if(rawDate){
            const displayDate = new Date(rawDate);
            // console.log('Formatted Date: ', rawDate.getFullYear()+'-'+(rawDate.getMonth()+1)+'-'+rawDate.getDate());

            return (displayDate.getMonth()+1) + '/' + displayDate.getDate() + '/' + displayDate.getFullYear();
        }
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
                // console.log("Amount: ", map[key].amount);
                // console.log("Total Units: ", map[key].totalUnits);
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
     * Date Last Edited: 3-17-2025
     */
    groupItemsByKey(itemArray: any[], keyArray: any[]){
        // get the items in the pool along with their amount
        let pool: (typeof itemArray)[number] & { amount: number } = Object.values(itemArray.reduce((map, item) => {
            let keyString = "";
            keyArray.forEach(key => keyString += ':'+item[key]);

            const key = keyString;
            if (map[key]) { // if it already exists, incremenet
                map[key].amount++;
                map[key].total += item.units_per_case;
                    if(map[key].units_per_case < item.units_per_case)
                        map[key].units_per_case = item.units_per_case;
            }
            else // otherwise, add it to the map
                map[key] = { ...item, units_per_case: item.units_per_case, location: item.location, amount: 1, total: item.units_per_case };
            return map;
        }, { } as { [item_id: number]: (typeof itemArray)[number] & { amount: number } }));

        return pool;
    },

    statusStyle(data: string){
            // console.log("DATA ",data);
            if(data === '1 WORKING'){
                return { font: 'bold', backgroundColor: '#2e7d32', fontSize: '14px' };
            } else if (data === '1.25 PICKED'){
                return { font: 'bold', backgroundColor: '#43a047', fontSize: '14px' };
            } else if (data === '1.5 PICKLIST'){
                return { font: 'bold', color: '#145a32', backgroundColor: '#81c784', fontSize: '14px' };
            } else if (data === '2 READY'){
                return { font: 'bold', color: '#145a32', backgroundColor: '#c8e6c9', fontSize: '14px' };
            } else if (data === '3 AWAITING PLAN'){
                return { font: 'bold', color: '#d4ac0d', backgroundColor: '#fcf3cf', fontSize: '14px' };
            } else if (data === '4 INBOUND'){
                return { font: 'bold', color: '#21618c ', backgroundColor: '#aed6f1', fontSize: '14px' };
            } else if (data === '5 ON ORDER'){
                return { font: 'bold', backgroundColor: '#1976d2', fontSize: '14px' };
            } else if (data === '6 ISSUE'){
                return { font: 'bold', color: '#943126', backgroundColor: '#f5b7b1', fontSize: '14px' };
            } else if (data === '7 FLAGGED'){
                return { font: 'bold', color: '#fdedec', backgroundColor: '#cb4335', fontSize: '14px' };
            } else if (data === '0 COMPLETED') {
                return { font: 'bold', color: '#fdedec', backgroundColor: '#b90dc4', fontSize: '14px' };
            }
        },

        getRequestPriority(reqDeadline: Date | null){
            
            let today = new Date();
            let compareDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());

            if(reqDeadline){
                // console.log("Deadline: ", new Date(reqDeadline).getMonth() + 1, new Date(reqDeadline).getDate(), new Date(reqDeadline).getFullYear());
                // console.log("Compare Date: ", compareDate.getMonth() + 1, compareDate.getDate(), compareDate.getFullYear());
                // console.log("Tomorrow: ", compareDate.getMonth() + 1, compareDate.getDate() + 1 , compareDate.getFullYear());
                // console.log("Deadline Date: ", new Date(reqDeadline));
                // console.log("Tomorrow Date: ", new Date(compareDate.getFullYear(), compareDate.getMonth(), compareDate.getDate()));
                // console.log("Tomorrow Date: ", new Date(compareDate.getFullYear(), compareDate.getMonth(), compareDate.getDate() + 1));
                // console.log("Deadline < Compare Date: ", new Date(reqDeadline).valueOf() < compareDate.valueOf()); 
                // console.log("Deadline > Compare Date: ", new Date(reqDeadline).valueOf() > compareDate.valueOf());
                // console.log("Deadline <= Compare Date: ", new Date(reqDeadline).valueOf() <= compareDate.valueOf()); 
                // console.log("Deadline >= Compare Date: ", new Date(reqDeadline).valueOf() >= compareDate.valueOf()); 
                // console.log("Deadline == Compare Date: ", new Date(reqDeadline).valueOf() == new Date(compareDate.getFullYear(), compareDate.getMonth(), compareDate.getDate()).valueOf()); 

                if (compareDate.valueOf() === new Date(reqDeadline).valueOf()) {
                    return '0 MUST GO OUT TODAY';
                } else if (new Date(compareDate.getFullYear(), compareDate.getMonth(), compareDate.getDate() + 1).valueOf() <= new Date(reqDeadline).valueOf() && new Date(reqDeadline).valueOf() <= new Date(compareDate.getFullYear(), compareDate.getMonth(), compareDate.getDate() + 5).valueOf()){
                    return '1 This Week';
                } else if (new Date(compareDate.getFullYear(), compareDate.getMonth(), compareDate.getDate() + 6).valueOf() <= new Date(reqDeadline).valueOf() && new Date(reqDeadline).valueOf() <= new Date(compareDate.getFullYear(), compareDate.getMonth(), compareDate.getDate() + 14).valueOf()){
                    return '2 Weeks';
                } else if (new Date(compareDate.getFullYear(), compareDate.getMonth(), compareDate.getDate() + 15).valueOf() <= new Date(reqDeadline).valueOf() && new Date(reqDeadline).valueOf() <= new Date(compareDate.getFullYear(), compareDate.getMonth(), compareDate.getDate() + 21).valueOf()){
                    return '3 Weeks';
                } else if (new Date(compareDate.getFullYear(), compareDate.getMonth(), compareDate.getDate() + 22).valueOf() <= new Date(reqDeadline).valueOf() && new Date(reqDeadline).valueOf() <= new Date(compareDate.getFullYear(), compareDate.getMonth(), compareDate.getDate() + 31).valueOf()){
                    return '4 This Month';
                } else if (new Date(compareDate.getFullYear(), compareDate.getMonth(), compareDate.getDate() + 32).valueOf() <= new Date(reqDeadline).valueOf() && new Date(reqDeadline).valueOf() <= new Date(compareDate.getFullYear(), compareDate.getMonth(), compareDate.getDate() + 60).valueOf()){
                    return '5 Next Month';
                } else if (new Date(compareDate.getFullYear(), compareDate.getMonth(), compareDate.getDate() + 61).valueOf() <= new Date(reqDeadline).valueOf()){
                    return '6 Several Months';
                } else if (compareDate.valueOf() > new Date(reqDeadline).valueOf()) {
                    return '-1 LATE';
                } else {
                    return 'TBD';
                }
            } else {
                return 'TBD';
            }
        },

        priorityStyle(data: string){
            // console.log("DATA ",data);
            if(data === '0 MUST GO OUT TODAY'){
                return { font: 'bold', backgroundColor: '#4a148c', fontSize: '14px' };
            } else if (data === '1 This Week'){
                return { font: 'bold', backgroundColor: '#5e35b1', fontSize: '14px' };
            } else if (data === '2 Weeks'){
                return { font: 'bold', backgroundColor: '#7e57c2', fontSize: '14px' };
            } else if (data === '3 Weeks'){
                return { font: 'bold', color: '#673ab7', backgroundColor: '#d1c4e9', fontSize: '14px' };
            } else if (data === '4 This Month'){
                return { font: 'bold', color: '#673ab7', backgroundColor: '#ede7f6', fontSize: '14px' };
            } else if (data === '5 Next Month'){
                return { font: 'bold', color: '#311b92', backgroundColor: '#f5f5f5', fontSize: '14px' };
            } else if (data === '6 Several Months'){
                return { font: 'bold', color: '#311b92', backgroundColor: '#fafafa', fontSize: '14px' };
            } else if (data === '-1 LATE'){
                return { font: 'bold', backgroundColor: '#cb4335', fontSize: '14px' };
            } else {
                return { font: 'bold', color: '#311b92', backgroundColor: '#fafafa', fontSize: '14px' };
            }
        },
}

export default helper;