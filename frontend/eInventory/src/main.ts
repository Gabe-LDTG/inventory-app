import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import PrimeVue from 'primevue/config';

import 'primevue/resources/themes/saga-green/theme.css';
import 'primeicons/primeicons.css'
import '/node_modules/primeflex/primeflex.css';
//import 'primevue/resources/primevue.min.css';

import Button from 'primevue/button';
import Calendar from 'primevue/calendar';
import Column from 'primevue/column';
import ColumnGroup from 'primevue/columngroup';   // optional
import DataTable from 'primevue/datatable';
import Dialog from 'primevue/dialog';
import Dropdown from 'primevue/dropdown';
import FileUpload from 'primevue/fileupload';
import InputGroup from 'primevue/inputgroup';
import InputGroupAddon from 'primevue/inputgroupaddon';
import InputSwitch from 'primevue/inputswitch';
import InputText from 'primevue/inputtext';
import InputMask from 'primevue/inputmask';
import InputNumber from 'primevue/inputnumber';
import OrderList from 'primevue/orderlist';
import Password from 'primevue/password';
import Row from 'primevue/row';                   // optional
import Tag from 'primevue/tag';
import Toast from 'primevue/toast';
import ToastService from 'primevue/toastservice';
import Toolbar from 'primevue/toolbar';

const app = createApp(App);

app.use(router);
app.use(PrimeVue);
app.use(ToastService);

//PRIME VUE COMPONENTS
app.component('Button', Button);
app.component('Calendar', Calendar);
app.component('Column', Column);
app.component('ColumnGroup', ColumnGroup);
app.component('DataTable', DataTable);
app.component('Dialog', Dialog);
app.component('Dropdown', Dropdown);
app.component('FileUpload', FileUpload);
app.component('InputGroup', InputGroup);
app.component('InputGroupAddon', InputGroupAddon);
app.component('InputMask', InputMask);
app.component('InputNumber', InputNumber);
app.component('InputSwitch', InputSwitch);
app.component('InputText', InputText);
app.component('OrderList', OrderList);
app.component('Password', Password);
app.component('Row', Row);
app.component('Tag', Tag);
app.component('Toast', Toast);
app.component('Toolbar', Toolbar);


app.mount('#app');
