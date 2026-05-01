import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import { installArcoComponents } from "./plugins/arco";
import "./styles/main.less";

const app = createApp(App);

app.use(createPinia());
installArcoComponents(app);
app.mount("#root");
