import type Point from "../scriptlib/Point";
import type { PositionRowData, RegionRowData } from "../tools";

export type ExecuteResult = {
    success: boolean, // 是否成功
    message: string, // 消息
    data?: Point[], // 成功数据，比色可不用返回，找色返回坐标
}

export type ParseResult = {
    positionData?: PositionRowData[],
    regionData?: RegionRowData[]
}

export type ExecutorOption = {
    executorName: string,
    executorMode: string,
    regions: RegionRowData[], // 区域
    similarity: number, // 相似度 [0-100]
}

export const executors = new Set<IExecutor>();
export function registerExecutor(executor: IExecutor) {
    executors.add(executor)
}

export interface IExecutor {

    name: string;

    /**
     * 解析string，返回行数据
     * @param data
     * @param imageData
     * @param mode
     */
    parse(data: string, imageData: ImageData, option: ExecutorOption): ParseResult;

    /**
     * 格式化数据
     * @param data
     * @param imageData
     * @param mode
     */
    format(data: PositionRowData[], imageData: ImageData, option: ExecutorOption): string;

    execute(data: PositionRowData[], imageData: ImageData, option: ExecutorOption): ExecuteResult;

    /**
     * 计算两个颜色的相似度，返回0~100
     * @param color1 [r, g, b]
     * @param color2 [r, g, b]
     */
    colorSimilarity(color1: number[], color2: number[]): number;
}
