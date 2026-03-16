<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import ImageBoard from './ImageBoard.vue';
import SettingsPopover from './SettingsPopover.vue';
import { ElNotification, type TabPaneName } from 'element-plus';
import { fileToDataURL } from './tools';
import AdbHelper from './AdbHelper.vue';
import { shortcutManager } from './shortcutManager';
import loadImage from './ImageBoard.vue';

let tabIndex = 1
const editableTabsValue = ref('1')
const editableTabs = ref([
    // {
    //     title: 'Tab 1',
    //     name: '1',
    //     src: undefined,
    // }
]);
const handleTabsEdit = (targetName: TabPaneName | undefined, action: 'remove' | 'add') => {
    if (action === 'add') {
        const newTabName = `${++tabIndex}`
        editableTabs.value.push({
            title: 'New Tab',
            name: newTabName,
            src: undefined,
        });
        editableTabsValue.value = newTabName;
    } else if (action === 'remove') {
        const tabs = editableTabs.value
        let activeName = editableTabsValue.value
        if (activeName === targetName) {
            tabs.forEach((tab, index) => {
                if (tab.name === targetName) {
                    const nextTab = tabs[index + 1] || tabs[index - 1]
                    if (nextTab) {
                        activeName = nextTab.name
                    }
                }
            })
        }

        editableTabsValue.value = activeName
        editableTabs.value = tabs.filter((tab) => tab.name !== targetName)
    }
}

const handleFileChange = async (file: any) => {
    // TODO 暂时不允许重复加载图片，后续再考重复加载的图片更新命名后新增页签加载
    if (editableTabs.value.find(tab => tab.name === file.name)) {
        ElNotification({
            message: `已切换至${file.name}`,
            type: 'info',
        });
        editableTabsValue.value = file.name;
        return;
    }
    const newTabName = file.name;
    const dataUrl = await fileToDataURL(file.raw);
    // console.log(dataUrl)
    editableTabs.value.push({
        title: newTabName,
        name: newTabName,
        src: dataUrl
    })
    editableTabsValue.value = newTabName;
}
const onDrop = (event: DragEvent) => {
    const files = event.dataTransfer?.files;
    if (!files) return;

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file.type.startsWith('image/')) continue;

        // 包装成和 Element Plus Upload 一样的对象
        handleFileChange({ raw: file, name: file.name });
    }
};
const screenCap = async (data: { fileName: string, dataUrl: string }) => {
    // console.log(dataUrl);
    editableTabs.value.push({
        title: data.fileName,
        name: data.fileName,
        src: data.dataUrl
    });
    editableTabsValue.value = data.fileName;
}

const settingsPopoverShown = ref(false);

// 注册全局快捷键
onMounted(() => {

    // ESC键 - 关闭设置弹窗或其他全局操作
    shortcutManager.register({
        shortcut: {
            id: 'global-esc',
            description: '关闭弹窗或取消操作',
            key: 'Escape',
            enabled: true,
            preventDefault: true,
            stopPropagation: true,
            handler: (event: KeyboardEvent | WheelEvent) => {
                // 关闭设置弹窗
                if (settingsPopoverShown.value) {
                    settingsPopoverShown.value = false;
                }
            }
        }
    });
});

// 组件卸载时清理
onUnmounted(() => {
    shortcutManager.unregister('global-esc');
});

const prefersDark = window.matchMedia('(prefers-color-scheme: dark)')
const updateDarkClass = (e?: MediaQueryListEvent) => {
    if ((e ? e.matches : prefersDark.matches)) {
        document.documentElement.classList.add('dark')
    } else {
        document.documentElement.classList.remove('dark')
    }
}
updateDarkClass()
prefersDark.addEventListener('change', updateDarkClass)
</script>

<template>
    <div class="color-helper-main-toolbar">
        <div style="display: flex;align-items: center; padding-left: 20px;">
            <el-upload multiple :on-change="handleFileChange" accept="image/*" :auto-upload="false"
                :show-file-list="false">
                <el-button type="primary">加载图片</el-button>
            </el-upload>
            <SettingsPopover :visible="settingsPopoverShown">
                <template #reference>
                    <el-button type="default" @click="settingsPopoverShown = true"
                        style="margin-left: 10px">设置</el-button>
                </template>
                <template #footer>
                    <el-button @click="settingsPopoverShown = false" size="small" type="primary"
                        style="margin-top: 10px;" link>关闭</el-button>
                </template>
            </SettingsPopover>
            <AdbHelper :on-screencap="screenCap">
            </AdbHelper>
        </div>
    </div>
    <div class="color-helper-main-container" @dragover.prevent @dragenter.prevent @drop.prevent="onDrop"
        style="position: relative;">
        <!-- 提示区域，当没有图片时显示 -->
        <div v-if="editableTabs.length === 0" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
              color: #999; font-size: 36px; text-align: center;">
            拖拽图片加载，或点击“加载图片”按钮
        </div>
        <el-tabs v-else v-model="editableTabsValue" type="border-card" editable @edit="handleTabsEdit"
            class="color-helper-tabs">
            <el-tab-pane v-for="item in editableTabs" :key="item.name" :label="item.title" :name="item.name">
                <ImageBoard :src="item.src" :actived="editableTabsValue === item.name"></ImageBoard>
            </el-tab-pane>
        </el-tabs>
    </div>
</template>
<style scoped>
:deep(.el-tabs__content) {
    padding-bottom: 0;
    padding-right: 0;
}

.color-helper-main-toolbar {
    display: flex;
    height: 42px;
    width: 100%;
    justify-content: space-between;
}

.color-helper-main-container {
    height: calc(100% - 42px);
}
</style>
<style>
/* 隐藏+按钮，tabs通过上传图片新增 */
/* 没有考虑好如何通过子组件加载的图片的图片的文件名反馈到tabs的标签名上 */
.color-helper-tabs .el-tabs__new-tab {
    display: none;
    margin-right: 10px;
}

.color-helper-tabs {
    height: 100%;
    overflow: auto;
}

.color-helper-tabs .el-tab-pane {
    height: 100%;
}
</style>
