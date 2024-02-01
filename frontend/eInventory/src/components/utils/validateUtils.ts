import axios from "axios";
var validate = {

    getProducts(){
        let products;
        axios.get("http://localhost:5000/products").then(res => {
                products = res.data;
                console.log(products);
                return products;
            })
    },

    //Checks to make sure the name field is not empty
    validateName(name: string){
            let isErr = 0;

            // if the name field is empty
            if (!name) {
                //this.nameErrMSG = 'Name is a required field';
                isErr = 1;
            }
            else{
                //this.nameErrMSG = '';
                isErr = 0;
            }

            return isErr;
        },

    validateAsin(value: string){},

    //Checks all available products to make sure the fnsku being entered has not already been used
    validateFnskuCreate(inputFnsku: string, products: any){
            let isVal = true;

            /* if (inputFnsku != '') {
                for (let i = 0; i < this.products.length; i++) {
                    console.log(this.products[i].fnsku);
                    if (this.products[i].fnsku == inputFnsku){
                        console.log(this.products[i]);
                        this.fnskuErrMSG = "This fnsku is already in use";
                        isErr = 1;
                    }
                }
            } */
            if (isErr == 0) {
                //this.fnskuErrMSG = '';
            }

            return isErr;
        },

    //Checks to make sure the newly edited fnsku does not already exist
    //Differs from validateFnskuCreate by ignoring the fnsku if it is the product's own fnsku
    validateFnskuEdit(inputFnsku: string){
            let isErr = 0;

            if (inputFnsku != '') {
                /* for (let i = 0; i < this.products.length; i++) {
                    console.log(this.products[i].fnsku);
                    if (this.products[i].fnsku == inputFnsku && this.products[i].id != this.heldProduct.id){
                        console.log(this.products[i]);
                        console.log(this.heldProduct.id); 
                        this.fnskuErrMSG = "This fnsku is already in use";
                        isErr = 1;
                    }
                } */
            }
            if (isErr == 0) {
                //this.fnskuErrMSG = '';
            }

            return isErr;
        },
    validateUpc(value: string){},
    validateNotes(value: string){},
    

}

export default validate