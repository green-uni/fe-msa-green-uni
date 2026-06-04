<script setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();
const title = computed(() => route.meta?.title);

</script>

<template>
    <div class="page-location" v-if="title && !route.meta?.navTitle">
        <h1>
            <span class="arrow-circle">
                <font-awesome-icon icon="fa-solid fa-angle-right" />
            </span>
            {{ title }}
        </h1>
    </div>
</template>

<style scoped lang="scss">
.page-location{margin-bottom: 15px;}
h1 {
    font-size: $fs-xxl;font-weight: 500;display: inline-flex;align-items: center;gap: 10px;
    .arrow-circle{background: $font-color;width: 20px;height: 20px;border-radius: 50%;display: inline-flex;align-items: center;justify-content: center;}
    .arrow-circle svg{color: #fff;font-size: .5em;padding: 2px 0 0 1px;}
}
</style>