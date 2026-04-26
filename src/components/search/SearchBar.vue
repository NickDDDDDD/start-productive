<script setup>
import { storeToRefs } from "pinia";
import { IconSearch } from "@arco-design/web-vue/es/icon";
import { useBoardStore } from "../../stores/board";

const board = useBoardStore();
const { searchTerm } = storeToRefs(board);
</script>

<template>
  <a-input
    v-model="searchTerm"
    class="search-bar"
    allow-clear
    placeholder="Search cards"
  >
    <template #prefix>
      <IconSearch />
    </template>
  </a-input>
</template>
