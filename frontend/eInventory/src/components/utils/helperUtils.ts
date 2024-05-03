var helper = {
    formatDate(rawDate: string) {
        var date = new Date(rawDate);
        //momentDate = this.eCase.date_received;
        console.log("TESTING DATES: ", date);

        return date.getFullYear()+'-'+(date.getMonth()+1)+'-'+date.getDate();
    },

    getDate(){
        const date = new Date();
        console.log("TODAYS DATE ", date.getFullYear()+'-'+(date.getMonth()+1)+'-'+date.getDate());
        return date.getFullYear()+'-'+(date.getMonth()+1)+'-'+date.getDate();
    },
}

export default helper;