<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { adbHelper } from './tools';
import { onUnmounted } from 'vue';
import { ElNotification } from 'element-plus';
import { Plus, Loading, Setting } from '@element-plus/icons-vue';
import { watch } from 'vue';

const deviceIdOptions = ref<{ value: string, label: string, disabled?: boolean }[]>([]);
const deviceId = ref<string>(null);
const shown = ref<boolean>(false);
const loadingScreenCap = ref<boolean>(false);
const loadingDevices = ref<boolean>(false);
const loadingConnect = ref<boolean>(false);
const remoteDeviceId = ref<string>(null);
const muMuPath = ref<string>(null);
const screenPath = ref<string>(null);
let callbackId: number = null;

const $props = defineProps({
    onScreencap: {
        type: Function,
        required: false,
    }
});

watch(deviceId, (newVal, oldVal) => {
    adbHelper.setCurrentDeviceId(newVal);
});

const screencap = async () => {
    if (!deviceId.value) {
        await refreshDevices(true);
        if (deviceIdOptions.value.length > 0) {
            deviceId.value = deviceIdOptions.value[0].value;
        }
    }
    if ($props.onScreencap) {
        loadingScreenCap.value = true;
        try {
            const dataUrl = await adbHelper.screencap(deviceId.value);
            $props.onScreencap(dataUrl);
        } catch (e) {
            console.error(e);
        }
        loadingScreenCap.value = false;
    }
}

const connect = async () => {
    loadingConnect.value = true;
    try {
        const msg = await adbHelper.connect(remoteDeviceId.value);
        ElNotification({
            message: msg,
            type: 'info'
        })
    } catch (e) {
        console.log(e);
    }
    loadingConnect.value = false;
}

const refreshDevices = async (visible: boolean) => {
    if (!visible) return;
    loadingDevices.value = true;
    try {
        const devices: any[] = await adbHelper.devices();
        deviceIdOptions.value = devices.map(item => ({
            value: `${item.adb_host_ip}:${item.adb_port}`,
            label: item.name
        }));
        deviceIdOptions.value = devices.map(item => {
            // 计算对应的 ADB 端口
            const baseMuMuPort = 16384;  // 起始 MuMuManager 端口
            const interval = 32;          // 每个多开端口区间长度
            const baseAdbPort = 5555;     // 起始 ADB 端口
            const index = Math.floor((item.adb_port - baseMuMuPort) / interval);
            const adbPort = baseAdbPort + index * 2;
            return {
                value: `${item.adb_host_ip}:${adbPort}`,  // 可用 ADB 地址
                label: item.name
            };
        });
    } catch (e) {
        console.log(e);
    }
    loadingDevices.value = false;
}

const savePath = async (key: string, value: string) => {
    localStorage.setItem(key, value);
    const result = await adbHelper.setPath(key, value);
    console.log(result)
    if (result.length != 0) {
        ElNotification({
            message: '保存成功',
            type: 'success',
        });
    } else {
        ElNotification({
            message: '保存失败',
            type: 'error',
        });
    }
}
const loadPath = async (key: string, value: string) => {
    value = localStorage.getItem(key);
}
const localBridge = async () => {
    window.location.href = "colorhelperbridge://open?param=123";
}
onMounted(async () => {
    const savedmuMuPath = localStorage.getItem('muMuPath')
    if (savedmuMuPath) {
        muMuPath.value = savedmuMuPath
    }
    const savedScreenPath = localStorage.getItem('screenPath')
    if (savedScreenPath) {
        screenPath.value = savedScreenPath
    }
    callbackId = adbHelper.setCallback(function () {
        shown.value = true;
        // refreshDevices();
    }, function () {
        shown.value = false;
    });
});

onUnmounted(() => {
    adbHelper.removeCallback(callbackId);
});

// TODO 连接设备、截图

</script>

<template>
    <div v-if="shown">
        <el-form :inline="true">
            <el-form>
                <el-button @click="screencap" :disabled="loadingScreenCap" type="primary" style="width: 80px;
                margin-left: 20px;">
                    <el-icon v-if="loadingScreenCap" class="is-loading">
                        <Loading />
                    </el-icon>
                    <template v-if="!loadingScreenCap">ADB截图</template>
                </el-button>
                <el-select v-model="deviceId" @visible-change="refreshDevices" :loading="loadingDevices"
                    placeholder="选择设备" style="width: 200px;margin-left: 10px; margin-right: 10px;">
                    <el-option v-for="item in deviceIdOptions" :key="item.value" :label="item.label" :value="item.value"
                        :disabled="item.disabled" />
                </el-select>
                <el-popover placement="bottom" trigger="click" :width="300">
                    <template #reference>
                        <el-button>
                            <el-icon>
                                <Plus />
                            </el-icon>
                        </el-button>
                    </template>
                    <div>
                        <el-input v-model="remoteDeviceId" placeholder="IP[:PORT]"
                            style="width:200px; margin-right: 10px;" :readonly="loadingConnect">
                        </el-input>
                        <el-button @click="connect" type="primary" style="width: 60px">
                            <el-icon v-if="loadingConnect" class="is-loading">
                                <Loading />
                            </el-icon>
                            <template v-if="!loadingConnect">连接</template>
                        </el-button>
                    </div>
                </el-popover>
                <el-popover placement="bottom" trigger="click" :width="520">
                    <template #reference>
                        <el-button @click="loadPath('muMuPath', muMuPath)">
                            <el-icon>
                                <Setting />
                            </el-icon>
                        </el-button>
                    </template>
                    <div style="display:flex; align-items:center;">
                        <span>MuMu模拟器位置：</span>
                        <el-input v-model="muMuPath" placeholder="例如 D:\MuMuPlayer" style="width:295px;">
                        </el-input>
                        <el-button type="primary" @click="savePath('muMuPath', muMuPath)"
                            style="margin-left: 10px;">保存</el-button>
                    </div>
                    <div style="display:flex; align-items:center; margin-top: 20px;">
                        <span>默认截图保存位置：</span>
                        <el-input v-model="screenPath" placeholder="例如 C:\Users\用户名\Documents\MuMu共享文件夹\Screenshots"
                            style="width:295px;">
                        </el-input>
                        <el-button type="primary" @click="savePath('screenPath', screenPath)"
                            style="margin-left: 10px;">保存</el-button>
                    </div>
                </el-popover>
            </el-form>
        </el-form>
    </div>
    <div v-if="!shown">
        <el-button @click="localBridge" type="success" style="margin-left: 20px;">
            <el-icon v-if="loadingScreenCap" class="is-loading">
                <Loading />
            </el-icon>
            <template v-if="!loadingScreenCap">启用 ADB 连接（需本地桥应用）</template>
        </el-button>
    </div>
</template>
<style>
.el-popover {
    transition: all 0s ease;
    /* 改成 0.5 秒关闭/打开 */
}
</style>