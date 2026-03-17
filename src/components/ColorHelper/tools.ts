import { ElNotification } from "element-plus";
import emitter from "./eventBus";

export type PositionRowData = {
    checked: boolean, // 是否选中
    anchor: 'N' | 'L' | 'C' | 'R' | 'T' | 'M' | 'B', // 锚点方向
    coordinate: string, // 坐标 x,y
    color: string, // 坐标颜色 0xRRGGBB
    similarity?: number, // 与图片上的相似度
}

export type RegionRowData = {
    checked: boolean;
    anchor: 'N' | 'L' | 'C' | 'R' | 'T' | 'M' | 'B', // 锚点方向
    x0: number;
    y0: number;
    x1: number;
    y1: number;
}

export type ScreenCapResult = { fileName: string, dataUrl: string };


/**
 * 节流函数（后执行）
 * @param fn 函数
 * @param delay 延迟时间
 * @returns 节流后的函数
 */
export function throttle<T extends (...args: any[]) => any>(fn: T, delay: number): (...args: Parameters<T>) => void {
    let timerId: ReturnType<typeof setTimeout> | null = null;

    return function (...args: Parameters<T>): void {
        if (timerId !== null) {
            clearTimeout(timerId);
        }
        timerId = setTimeout(() => {
            fn(...args);
            timerId = null;
        }, delay);
    };
}

/**
 * 防抖函数
 * @param fn 函数
 * @param wait 延迟时间
 * @returns 防抖后的函数
 */
export function debounce<T extends (...args: any[]) => any>(fn: T, wait: number): (...args: Parameters<T>) => void {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    return function (...args: Parameters<T>): void {
        if (timeoutId !== null) {
            clearTimeout(timeoutId);
        }
        timeoutId = setTimeout(() => {
            fn(...args);
        }, wait);
    };
}

export const fileToDataURL = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const result = e.target?.result;
            if (typeof result === 'string') {
                // 如果已经是字符串，则直接返回
                resolve(result);
            } else if (result instanceof ArrayBuffer) {
                // 如果是 ArrayBuffer，则转换为字符串
                const decoder = new TextDecoder('utf-8');
                const text = decoder.decode(result);
                resolve(text);
            } else {
                throw new Error('Unexpected result type from FileReader');
            }
        };
        reader.onerror = (e) => {
            reject(e);
        };
        reader.readAsDataURL(file);
    });
}


/**
 * 
 * @param bitMap 图片的ImageData
 * @param x 
 * @param y 
 * @returen rrggbb
 */
export const pixOfImageDataString = (bitMap: ImageData, x: number, y: number, needAlpha?: true): string => {
    const index = bitMap.width * y * 4 + x * 4;
    let ret = `${bitMap.data[index].toString(16).padStart(2, '0')}${bitMap.data[index + 1].toString(16).padStart(2, '0')}${bitMap.data[index + 2].toString(16).padStart(2, '0')}`;
    if (needAlpha) ret += bitMap.data[index + 3].toString(16).padStart(2, '0');
    return ret;
}

export const pixOfImageDataArray = (bitMap: ImageData, x: number, y: number, needAlpha?: boolean): number[] => {
    const index = bitMap.width * y * 4 + x * 4;
    const ret = [bitMap.data[index], bitMap.data[index + 1], bitMap.data[index + 2]];
    if (needAlpha) ret.push(bitMap.data[index + 3]);
    return ret;
}


export const asColorArray = (data: number | string | number[]): number[] => {
    if (typeof data === 'number') {
        return [data >> 16 & 0xff, data >> 8 & 0xff, data & 0xff];
    } else if (typeof data === 'string') {
        data = data.replace(/^#|^0x/, '');
        if (data.length === 6) {
            return [parseInt(data.slice(0, 2), 16), parseInt(data.slice(2, 4), 16), parseInt(data.slice(4, 6), 16)];
        }
    } else if (Array.isArray(data)) {
        return data;
    }
}

/**
 * 欧几里德距离的颜色相似度比较
 * @param color1 
 * @param color2 
 * @returns 
 */
export const colorSimilarity = (color1: number[], color2: number[]): number => {
    // 分别获取每个颜色的 RGB 分量
    const [r1, g1, b1] = color1;
    const [r2, g2, b2] = color2;

    // 计算每个分量之间的差值
    const rDiff = r1 - r2;
    const gDiff = g1 - g2;
    const bDiff = b1 - b2;

    // 计算欧几里得距离
    const distance = Math.sqrt(rDiff * rDiff + gDiff * gDiff + bDiff * bDiff);

    // 计算最大可能的距离
    const maxDistance = Math.sqrt(3 * (255 * 255));

    // 标准化距离，使得距离越小相似度越高
    const similarity = 1 - (distance / maxDistance);

    return similarity;
};


export function isColorLight(hexColor: string): boolean {
    // 验证输入是否为有效的十六进制颜色字符串
    if (!/^#([0-9A-F]{3}){1,2}$/i.test(hexColor)) {
        throw new Error('Invalid hex color format');
    }

    // 将十六进制颜色转换为 RGB 数组
    const rgb = hexToRgb(hexColor);

    // 计算灰度值
    const grayLevel = 0.299 * rgb[0] + 0.587 * rgb[1] + 0.114 * rgb[2];

    // 判断是否为浅色
    return grayLevel > 128; // 128 是一个常见的阈值

    function hexToRgb(hexColor: string): [number, number, number] {
        const r = parseInt(hexColor.slice(1, 3), 16);
        const g = parseInt(hexColor.slice(3, 5), 16);
        const b = parseInt(hexColor.slice(5, 7), 16);
        return [r, g, b];
    }
}

export function isImageLight(imageData: ImageData): boolean {
    let totalWeightedBrightness = 0;
    let totalWeight = 0;
    const totalPixels = imageData.width * imageData.height;
    const centerX = imageData.width / 2;
    const centerY = imageData.height / 2;

    // 遍历每个像素
    for (let y = 0; y < imageData.height; y++) {
        for (let x = 0; x < imageData.width; x++) {
            // 获取当前像素的索引位置
            const index = (y * imageData.width + x) * 4;

            // 提取 RGB 值
            const r = imageData.data[index];
            const g = imageData.data[index + 1];
            const b = imageData.data[index + 2];

            // 计算灰度值
            const grayLevel = 0.299 * r + 0.587 * g + 0.114 * b;

            // 计算到中心点的距离
            const distance = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));

            // 根据距离计算权重
            const weight = 1 / (1 + distance); // 可以根据实际情况调整权重公式

            // 累加加权亮度值
            totalWeightedBrightness += grayLevel * weight;
            totalWeight += weight;
        }
    }

    // 计算平均加权亮度
    const averageWeightedBrightness = totalWeightedBrightness / totalWeight;

    // 判断整体亮度
    return averageWeightedBrightness > 128;
}

/**
 * 一次性使用，在没有canvs元素时自动创建canvas元素获取图片的imageData对象
 * @param url 
 * @returns 
 */
export function parseToImageData(obj: string | File): Promise<ImageData> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            // 创建一个隐藏的Canvas
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;

            // 隐藏Canvas
            canvas.style.display = 'none';
            document.body.appendChild(canvas); // 添加到DOM中

            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.drawImage(img, 0, 0); // 绘制图片到Canvas
                const imageData = ctx.getImageData(0, 0, img.width, img.height);

                // 处理完成后清除Canvas内容
                ctx.clearRect(0, 0, canvas.width, canvas.height);

                // 解除Canvas与DOM的连接
                document.body.removeChild(canvas);

                resolve(imageData);
            } else {
                reject(new Error('Failed to get canvas context.'));
            }
        };
        img.onerror = () => {
            ElNotification.error({
                message: '图片加载失败',
                type: 'error',
            });
            reject(new Error('Image failed to load.'))
        };
        if (obj instanceof File) {
            img.src = URL.createObjectURL(obj);
        } else if (typeof obj === 'string') {
            img.src = obj;
        }
    });
}

const adbUrlContextPath = 'http://127.0.0.1:15919/color-helper-bridge/api';
class AdbHelper {

    private callbacks: { id: number, initCallback: Function, failCallback: Function, status: boolean }[] = [];
    private callbackIdCounter: number = 0;
    private lastHeartBeatTime: number = 0;
    private lastHeartBeatStatus: boolean = false;
    public status: boolean = false;
    public deviceId: string = '';

    constructor() {
        setInterval(this.heartBeatInterval.bind(this), 1000)
    }

    // 调用时一定要记录返回的id，在onUnmounted中调用removeCallback移除回调
    // 否则心跳状态变化后会导致空调用
    setCallback(initCallback: Function, failCallback: Function): number {
        ++this.callbackIdCounter;
        this.callbacks.push({
            id: this.callbackIdCounter,
            initCallback,
            failCallback,
            status: false,
        });
        // 注册后先马上心跳一下
        this.heartBeatInterval();
        return this.callbackIdCounter;
    }

    removeCallback(id: number) {
        this.callbacks = this.callbacks.filter(callback => callback.id !== id);
    }

    async heartBeat(): Promise<boolean> {
        if (Date.now() - this.lastHeartBeatTime < 500) return this.lastHeartBeatStatus; // 5秒内重复心跳，直接返回上次的状态
        this.lastHeartBeatTime = Date.now();
        return fetchWithTimeout(adbUrlContextPath + '/heartbeat', {
            method: 'GET'
        }, 3000).then(response => response.json()).then(data => {
            this.lastHeartBeatStatus = !data.error;
            return this.lastHeartBeatStatus;
        }).catch(error => {
            this.lastHeartBeatStatus = false;
            return this.lastHeartBeatStatus;
        });
    }

    async heartBeatInterval(): Promise<void> {
        if (await this.heartBeat()) {
            // 心跳成功 首次心跳成功调用回调以在界面上添加相关元素
            for (let i = 0; i < this.callbacks.length; i++) {
                if (!this.callbacks[i].status) {
                    try {
                        this.callbacks[i].initCallback();
                    } catch (e) {
                        console.error(e);
                    }
                    this.callbacks[i].status = true;
                }
            }
            if (!this.status) {
                if (this.deviceId) {
                    emitter.emit('Event.ColorHelper.AdbHelper.canScreencapStatusChange', true);
                }
                this.status = true;
            }
        } else {
            // 心跳失败 如果之前已初始化过，调用回调用以在界面上删除相关元素
            for (let i = 0; i < this.callbacks.length; i++) {
                try {
                    this.callbacks[i].failCallback();
                } catch (e) {
                    console.error(e);
                }
                this.callbacks[i].status = false;
            }
            if (this.status) {
                emitter.emit('Event.ColorHelper.AdbHelper.canScreencapStatusChange', false);
                this.status = false;
            }
        }
    }

    getStatus(): boolean {
        return this.status;
    }

    canScreencap(): boolean {
        return this.status && !!this.deviceId;
    }

    setCurrentDeviceId(deviceId: string) {
        if (this.deviceId !== deviceId && this.status) {
            emitter.emit('Event.ColorHelper.AdbHelper.canScreencapStatusChange', true);
        }
        this.deviceId = deviceId;
    }
    getCurrentDeviceId(): string {
        return this.deviceId;
    }


    async devices(deviceIdMode: string): Promise<string[]> {
        return fetch(adbUrlContextPath + '/adb/devices', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                deviceIdMode
            })
        }).then(response => response.json()).then(data => {
            if (data.error) {
                ElNotification({
                    message: `设备列表获取失败：${data.message}`,
                    type: 'error',
                });
                throw new Error(data.message);
            }
            return data.data;
        });
    }

    async connect(deviceId: string): Promise<string> {
        return fetch(adbUrlContextPath + '/adb/connect', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                deviceId
            })
        }).then(response => response.json()).then(data => {
            if (data.error) {
                ElNotification({
                    message: `设备连接失败：${data.message}`,
                    type: 'error',
                });
                throw new Error(data.message);
            }
            return data.message;
        })
    }

    async screencap(deviceId?: string): Promise<ScreenCapResult> { // 返回图片的base64
        return fetch(adbUrlContextPath + '/adb/shell/screencap', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                deviceId: deviceId || this.deviceId
            })
        }).then(response => response.json()).then(data => {
            if (data.error) {
                ElNotification({
                    message: `截图失败：${data.message}`,
                });
                throw new Error(data.message);
            }
            return data.data;
        })
    }
}


const adbHelper = new AdbHelper();
export { adbHelper };

async function fetchWithTimeout(resource: RequestInfo, options?: RequestInit, timeout?: number): Promise<Response> {
    const { signal, ...rest } = options || {};
    const controller = new AbortController();
    const id = setTimeout(() => {
        controller.abort(); // 超时后取消请求
    }, timeout || 5000);

    const request = fetch(resource, {
        ...rest,
        signal: controller.signal, // 使用控制器的信号
    });

    try {
        const response = await Promise.race([
            request,
            new Promise((_, reject) => {
                // 当超时发生时，reject promise
                setTimeout(() => {
                    clearTimeout(id); // 清除定时器
                    reject(new Error('Request timed out'));
                }, timeout || 5000);
            }),
        ]) as Response;

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        return response;
    } catch (error) {
        throw error;
    }
}

