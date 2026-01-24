
import { asColorArray, colorSimilarity, pixOfImageDataArray, type PositionRowData } from '../tools';
import type { ExecuteResult, ExecutorOption, IExecutor, ParseResult } from './Executor';

export class DefaultExecutor implements IExecutor {

    name = '默认';

    parse(data: string): ParseResult {
        return JSON.parse(data);
    }

    format(data: PositionRowData[], imageData: ImageData): string {
        return JSON.stringify(data);
    }

    execute(data: PositionRowData[], imageData: ImageData, option: ExecutorOption): ExecuteResult {
        let failPositions = [];
        for (let i = 0; i < data.length; i++) {
            const [x, y] = data[i].coordinate.split(',').map(Number);
            const colorRGBArray = pixOfImageDataArray(imageData, x, y);
            const similarity = colorSimilarity(colorRGBArray, asColorArray(data[i].color));
            if (similarity < 0.95) {
                failPositions.push(i);
            }
        }
        if (failPositions.length > 0) {
            return {
                success: false,
                message: `测试失败，第${failPositions.join(',')}个点测试失败`
            }
        } else {
            return {
                success: true,
                message: '测试成功'
            }
        }
    }

    colorSimilarity(color1: number[], color2: number[]): number {
        return colorSimilarity(color1, color2) * 100;
    }
}

export default new DefaultExecutor();
