import { requiredUnless } from "@vuelidate/validators";
import axios from "axios";

var action = {
    //Pulls all the products from the database using API
    getProducts(){
        let products;
            
        axios.get("http://localhost:5000/products").then(res => {
            products = res.data;

            //this.columns = Object.keys(this.products[0]);
            //was trying to separate the data pulled from DB from the data displayed, but it was screwing with validation and wasn't really working anyway
            //this.displayProducts = this.products;

            console.log("Product List Recieved\n",products);
            console.log("Keys", Object.keys(products[1]));
        })
        return products;
    },

    //Used to search for a specific product by Id
    getProductById(id: string){
        let specificProduct;
        //console.log(id);
        axios.get("http://localhost:5000/products/"+id)
        .then(res => {
            specificProduct = res.data,
            console.log(specificProduct);
        })
        .catch(error => {
            console.log(error);
        })

        return specificProduct;
    },

    //Posts a newly added product into the database using API
    addProduct(product: any){
            
        //console.log("UPC ______ ", this.upc);
        //console.log(this.fnsku);
            axios.post("http://localhost:5000/products/create", {
            name: product.name,
            asin: product.asin,
            fnsku: product.fnsku,
            upc: product.upc,
            notes: product.notes,

            }).then((res) => {
                //location.reload();
                //setInterval(this.refreshData, 1000);

                // if ANY fail validation
                //this.displayCreate = false;
                alert('Form successfully submitted.')
                //this.refreshData();
            }).catch(error => {
                console.log(error);
            });
    },

    //Removes a product from the database using API
    deleteProduct(id: string){
        //console.log(id);
        if(confirm("Do you really want to delete?")){
            axios.delete("http://localhost:5000/products/"+id)
            .then(res => {
                //location.reload();
                //this.refreshData();
            })
            .catch(error => {
                console.log(error);
            })
        }
    },

    //Updates an already existing product in the database using API
    editProduct(value: any){

        axios.put("http://localhost:5000/products/"+value.id, {
            name: value.name,
            asin: value.asin,
            fnsku: value.fnsku,
            upc: value.upc,
            notes: value.notes,

        }).then((res) => {
            //location.reload();
            //this.refreshData();
            //this.editId = '';
        }).catch(error => {
            console.log(error);
        });
    },
}

export default action;