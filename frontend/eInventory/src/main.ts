import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { pinia } from './stores';
import { useAuthStore } from './stores/auth';
import PrimeVue from 'primevue/config';
import Aura from '@primeuix/themes/aura';
import axios from 'axios';


import 'primeicons/primeicons.css'
import 'primeflex/primeflex.css';
//import 'primevue/resources/primevue.min.css';

import AutoComplete from 'primevue/autocomplete';
import Button from 'primevue/button';
//import ButtonGroup from 'primevue/buttongroup';
import Card from 'primevue/card';
import Checkbox from 'primevue/checkbox';
import Column from 'primevue/column';
import ColumnGroup from 'primevue/columngroup';   // optional
import DataTable from 'primevue/datatable';
import DataView from 'primevue/dataview';
import DatePicker from 'primevue/datepicker';
import Dialog from 'primevue/dialog';
import FileUpload from 'primevue/fileupload';
import InputGroup from 'primevue/inputgroup';
import InputGroupAddon from 'primevue/inputgroupaddon';
import InputMask from 'primevue/inputmask';
import InputNumber from 'primevue/inputnumber';
import InputText from 'primevue/inputtext';
import Message from 'primevue/message';
import MultiSelect from 'primevue/multiselect';
import OrderList from 'primevue/orderlist';
import Paginator from 'primevue/paginator';
import Popover from 'primevue/popover';
import Password from 'primevue/password';
import ProgressSpinner from 'primevue/progressspinner';
import RadioButton from 'primevue/radiobutton';
import Row from 'primevue/row';                   // optional
import Select from 'primevue/select';
import Tag from 'primevue/tag';
import Timeline from 'primevue/timeline';
import Toast from 'primevue/toast';
import ToastService from 'primevue/toastservice';
// import ToggleButton from 'primevue/togglebutton';
import ToggleSwitch from 'primevue/toggleswitch';
import Toolbar from 'primevue/toolbar';
import Tooltip from 'primevue/tooltip';

const appTitle = 'eChapps eInventory';
document.title = import.meta.env.PROD ? appTitle : `${appTitle} [LOCAL]`;

const app = createApp(App);

app.use(pinia);
app.use(router);
app.use(PrimeVue, {
	theme: {
		preset: Aura
	}
});
app.use(ToastService);

const authStore = useAuthStore(pinia);

axios.defaults.withCredentials = true;

//PRIME VUE COMPONENTS
app.component('AutoComplete', AutoComplete);
app.component('Button', Button);
//app.component('ButtonGroup', ButtonGroup);
app.component('Card', Card);
app.component('Checkbox', Checkbox);
app.component('Column', Column);
app.component('ColumnGroup', ColumnGroup);
app.component('DataTable', DataTable);
app.component('DataView', DataView);
app.component('DatePicker', DatePicker);
app.component('Dialog', Dialog);
app.component('FileUpload', FileUpload);
app.component('InputGroup', InputGroup);
app.component('InputGroupAddon', InputGroupAddon);
app.component('InputMask', InputMask);
app.component('InputNumber', InputNumber);
app.component('InputText', InputText);
app.component('Message', Message);
app.component('MultiSelect', MultiSelect);
app.component('OrderList', OrderList);
app.component('Paginator', Paginator);
app.component('Popover', Popover);
app.component('Password', Password);
app.component('ProgressSpinner', ProgressSpinner);
app.component('RadioButton', RadioButton);
app.component('Row', Row);
app.component('Select', Select);
app.component('Tag', Tag);
app.component('Timeline', Timeline);
app.component('Toast', Toast);
app.component('ToggleSwitch', ToggleSwitch);
app.component('Toolbar', Toolbar);
app.directive('Tooltip', Tooltip);



const startApp = async () => {
	await authStore.initialize();
	app.mount('#app');
};

startApp();
