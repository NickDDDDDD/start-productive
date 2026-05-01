import Alert from "@arco-design/web-vue/es/alert";
import Button from "@arco-design/web-vue/es/button";
import Checkbox from "@arco-design/web-vue/es/checkbox";
import DatePicker from "@arco-design/web-vue/es/date-picker";
import Drawer from "@arco-design/web-vue/es/drawer";
import Dropdown from "@arco-design/web-vue/es/dropdown";
import Form from "@arco-design/web-vue/es/form";
import Input from "@arco-design/web-vue/es/input";
import InputNumber from "@arco-design/web-vue/es/input-number";
import Modal from "@arco-design/web-vue/es/modal";
import Popover from "@arco-design/web-vue/es/popover";
import Progress from "@arco-design/web-vue/es/progress";
import Select from "@arco-design/web-vue/es/select";
import Tag from "@arco-design/web-vue/es/tag";
import Textarea from "@arco-design/web-vue/es/textarea";
import TimePicker from "@arco-design/web-vue/es/time-picker";

import "@arco-design/web-vue/es/alert/style/css.js";
import "@arco-design/web-vue/es/button/style/css.js";
import "@arco-design/web-vue/es/checkbox/style/css.js";
import "@arco-design/web-vue/es/date-picker/style/css.js";
import "@arco-design/web-vue/es/drawer/style/css.js";
import "@arco-design/web-vue/es/dropdown/style/css.js";
import "@arco-design/web-vue/es/form/style/css.js";
import "@arco-design/web-vue/es/input/style/css.js";
import "@arco-design/web-vue/es/input-number/style/css.js";
import "@arco-design/web-vue/es/message/style/css.js";
import "@arco-design/web-vue/es/modal/style/css.js";
import "@arco-design/web-vue/es/popover/style/css.js";
import "@arco-design/web-vue/es/progress/style/css.js";
import "@arco-design/web-vue/es/select/style/css.js";
import "@arco-design/web-vue/es/tag/style/css.js";
import "@arco-design/web-vue/es/textarea/style/css.js";
import "@arco-design/web-vue/es/time-picker/style/css.js";

const components = [
  Alert,
  Button,
  Checkbox,
  DatePicker,
  Drawer,
  Dropdown,
  Form,
  Input,
  InputNumber,
  Modal,
  Popover,
  Progress,
  Select,
  Tag,
  Textarea,
  TimePicker,
];

export function installArcoComponents(app) {
  components.forEach((component) => {
    app.use(component);
  });
}
