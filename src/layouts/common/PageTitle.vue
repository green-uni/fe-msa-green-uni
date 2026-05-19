<script setup>
import { computed, ref } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();
const groupTitle = computed(() => route.meta?.groupTitle);
const subTitle = computed(() => route.meta?.subTitle);
const title = computed(() => route.meta?.title);

</script>

<template>
    <div class="page-location" v-if="title">
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
    font-size: var(--text-xxl);font-weight: 500;display: inline-flex;align-items: center;gap: 10px;
    .arrow-circle{background: var(--font-color);width: 25px;height: 25px;border-radius: 50%;display: inline-flex;align-items: center;justify-content: center;}
    .arrow-circle svg{color: #fff;font-size: .6em;}
}
</style>