<script setup lang="ts">
import { computed, ref, watch, onMounted } from 'vue';
import { executors as innerExecutors } from './executor/Executor';
import emitter from './eventBus';

const $props = defineProps({
    visible: {
        type: Boolean,
        required: true,
        default: false
    }
});

// 执行器
const executors = computed(() => {
    return Array.from(innerExecutors);
});
const executorModel = ref<string>();
watch(executorModel, (newVal, oldVal) => {
    localStorage.setItem('ColorHelper.Settings.default.executor', newVal);
    emitter.emit('Event.ColorHelper.Settings.change', {
        key: 'ColorHelper.Settings.default.executor',
        value: newVal
    });
});
const executorOptions = ref(executors.value.map((executor) => {
    return {
        value: executor.name,
        label: executor.name,
    }
}));

// 执行器模式
const executorModeModel = ref<string>();
const modeOptions = ref([
    { value: '比色', label: '比色' },
    { value: '找色', label: '找色' },
]);
watch(executorModeModel, (newVal, oldVal) => {
    localStorage.setItem('ColorHelper.Settings.default.executorMode', newVal);
    emitter.emit('Event.ColorHelper.Settings.change', {
        key: 'ColorHelper.Settings.default.executorMode',
        value: newVal
    });
});

// 相似度[0-100]
const similarityModel = ref<string>();
watch(similarityModel, (newVal, oldVal) => {
    localStorage.setItem('ColorHelper.Settings.default.similarity', newVal);
    emitter.emit('Event.ColorHelper.Settings.change', {
        key: 'ColorHelper.Settings.default.similarity',
        value: newVal
    });
});

const zoomModel = ref<string>();
watch(zoomModel, (newVal, oldVal) => {
    localStorage.setItem('ColorHelper.Settings.default.zoom', newVal);
    emitter.emit('Event.ColorHelper.Settings.change', {
        key: 'ColorHelper.Settings.default.zoom',
        value: newVal
    });
});
// // 准心移动模式
// const crossHairMoveMode = ref<string>();
// const crossHairMoveOptions = ref([
//     { value: '跟随', label: '跟随' },
//     { value: '滑动', label: '滑动' },
// ]);
// watch(crossHairMoveMode, (newVal, oldVal) => {
//     localStorage.setItem('ColorHelper.Settings.default.crossHairMoveMode', newVal);
//     emitter.emit('Event.ColorHelper.Settings.change', {
//         key: 'ColorHelper.Settings.default.crossHairMoveMode',
//         value: newVal
//     });
// });


onMounted(() => {
    // 初始化一些配置
    // 执行器
    let executorVal = localStorage.getItem('ColorHelper.Settings.default.executor');
    if (!executorVal) {
        executorVal = executors.value[0].name;
        localStorage.setItem('ColorHelper.Settings.default.executor', executorVal);
    }
    executorModel.value = executorVal;

    // 模式
    let modeVal = localStorage.getItem('ColorHelper.Settings.default.executorMode');
    if (!modeVal) {
        modeVal = modeOptions.value[0].value;
        localStorage.setItem('ColorHelper.Settings.default.executorMode', modeVal);
    }
    executorModeModel.value = modeVal;

    // 相似度
    let similarityVal = localStorage.getItem('ColorHelper.Settings.default.similarity');
    if (!similarityVal) {
        similarityVal = '95';
        localStorage.setItem('ColorHelper.Settings.default.similarity', similarityVal);
    }
    similarityModel.value = similarityVal;

    // 缩放
    let zoomVal = localStorage.getItem('ColorHelper.Settings.default.zoom');
    if (!zoomVal) {
        zoomVal = '100';
        localStorage.setItem('ColorHelper.Settings.default.zoom', zoomVal);
    }
    zoomModel.value = zoomVal;
    // // 准心移动模式
    // let crossHairMoveModeVal = localStorage.getItem('ColorHelper.Settings.default.crossHairMoveMode');
    // if (!crossHairMoveModeVal) {
    //     crossHairMoveModeVal = crossHairMoveOptions.value[0].value;
    //     localStorage.setItem('ColorHelper.Settings.default.crossHairMoveMode', crossHairMoveModeVal);
    // }
    // crossHairMoveMode.value = crossHairMoveModeVal;
});

</script>

<template>
    <el-popover placement="bottom" :visible="$props.visible" :width="400">
        <template #reference>
            <slot name="reference"></slot>
        </template>
        <div>
            <el-form class="settings-popover-form">
                <el-row :gutter="20">
                    <el-col :span="12">
                        <el-form-item label="执行器">
                            <el-select-v2 v-model="executorModel" placeholder="选择执行器" :options="executorOptions" />
                        </el-form-item>
                    </el-col>
                    <el-col :span="12">
                        <el-form-item label="执行器模式">
                            <el-select-v2 v-model="executorModeModel" placeholder="选择执行器模式" :options="modeOptions" />
                        </el-form-item>
                    </el-col>
                </el-row>
                <el-row :gutter="20">
                    <el-col :span="12">
                        <el-form-item label="相似度">
                            <el-input v-model="similarityModel" placeholder="请输入相似度：0-100">
                                <template #suffix>%</template>
                            </el-input>
                        </el-form-item>
                    </el-col>
                    <el-col :span="12">
                        <el-form-item label="默认缩放">
                            <el-input v-model="zoomModel" placeholder="请输入缩放：">
                                <template #suffix>%</template>
                            </el-input>
                        </el-form-item>
                    </el-col>
                    <!-- <el-col :span="12">
                        <el-form-item label="准心移动模式">
                            <el-select-v2 v-model="crossHairMoveMode" placeholder="选择准心移动模式"
                                :options="crossHairMoveOptions" />
                        </el-form-item>
                    </el-col> -->
                </el-row>
            </el-form>
        </div>
        <div style="text-align: right;">
            <slot name="footer"></slot>
        </div>
    </el-popover>
</template>

<style></style>