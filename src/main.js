import { createApp } from "vue";
import { createPinia } from "pinia";
import ArcoVue from "@arco-design/web-vue";
import "@arco-design/web-vue/dist/arco.css";
import App from "./App.vue";
import "./styles/main.less";

createApp(App).use(createPinia()).use(ArcoVue).mount("#root");
