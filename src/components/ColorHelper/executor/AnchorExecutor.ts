
import AnchorGraphicHelper from '../scriptlib/AnchorGraphicHelper';
import type { ExecuteResult, ExecutorOption, IExecutor, ParseResult } from './Executor';
import { asColorArray, pixOfImageDataArray, type PositionRowData, type RegionRowData } from '../tools';
import Point from '../scriptlib/Point';

export class AnchorExecutor implements IExecutor {

	name = '锚点';

	/**
	 *
{
	desc: [1280, 720,
		[
			["L", 63, 107, 0x0d0e0e],
			["C", 348, 167, 0x181817],
			["L", 177, 140, 0x212121],
		]
	],
	oper: [
		["C", 1280, 720, 256, 340, 256, 342, 1000],
		["C", 1280, 720, 173, 224, 288, 328, 1000],
		["C", 1280, 720, 175, 224, 288, 328, 1000],
	],
	??
	region: ["L", 1280, 720, 79, 86, 1020, 631]
}
	 */
	parse(data: string, imageData: ImageData, option: ExecutorOption): ParseResult {
		if (data.includes('desc:')) {
			data = data.replace(/^.*?(?=desc:)/, '')          // 保留 desc:
				.match(/desc:[\s\S]*\]/)?.[0] || ''   // 从 desc: 开头到最后一个 ]
					.trim();
		} else if (data.includes('oper:')) {
			data = data.replace(/^.*?(?=oper:)/, '')          // 保留 oper:
				.match(/oper:[\s\S]*\]/)?.[0] || ''   // 从 oper: 开头到最后一个 ]
					.trim();
		}
		let str = data.replace(/(none|center|right|left|top|middle|bottom)/ig, (match) => `"${match[0].toUpperCase()}"`.trim());
		if (!str.startsWith('{')) {
			str = '{' + str;
		}
		if (!str.endsWith('}')) {
			str = str + '}';
		} // 外层加上大括号
		let temp: any;
		temp = (new Function(`return ${str}`)).apply(null);
		let desc: any;
		let oper: any;
		if (Array.isArray(temp)) {
			let infered = false;
			if (temp.length > 0) {
				if (Array.isArray(temp[0])) {
					if (temp[0].length === 4) {
						infered = true;
						desc = [imageData.width, imageData.height, temp];
					}
					if (temp[0].length === 8) {
						infered = true;
						oper = temp;
					}
				}
			}
			if (!infered && temp.length === 7) {
				if (typeof temp[0] === 'string' && typeof temp[1] === 'number' && typeof temp[6] === 'number') {
					oper = [temp];
				}
			}
			if (!infered && temp.length === 3) {
				if (typeof temp[0] === 'number' && typeof temp[1] === 'number' && Array.isArray(temp[2])) {
					desc = temp;
				}
			}

		} else if (typeof temp === 'object') {
			desc = temp.desc;
			oper = temp.oper;
		}

		const retPositionData = desc && desc[2].map((d: any) => {
			const row = {
				checked: true,
				anchor: d[0],
				coordinate: `${d[1]},${d[2]}`,
				color: `0x${(d[3] >> 16 & 0xff).toString(16).padStart(2, '0')}${(d[3] >> 8 & 0xff).toString(16).padStart(2, '0')}${(d[3] & 0xff).toString(16).padStart(2, '0')}`,
				similarity: this.colorSimilarity(pixOfImageDataArray(imageData, d[1], d[2]), asColorArray(d[3]))
			};
			return row;
		});

		const retRegionData = oper?.map((o: any) => {
			const row = {
				checked: true,
				anchor: o[0],
				x0: o[3],
				y0: o[4],
				x1: o[5],
				y1: o[6],
			};
			return row;
		});
		return {
			...(retPositionData?.length ? { positionData: retPositionData } : {}),
			...(retRegionData?.length ? { regionData: retRegionData } : {}),
		}
	}

	format(data: PositionRowData[], imageData: ImageData, option: ExecutorOption): string {
		const anchorMap = {
			'N': 'none',
			'L': 'left',
			'C': 'center',
			'R': 'right',
			'T': 'top',
			'M': 'middle',
			'B': 'bottom',
		}
		data = data.filter(d => d.checked);
		const descStr = `[${imageData.width}, ${imageData.height},
		[
			${data.map(d => `[${anchorMap[d.anchor]}, ${d.coordinate.replace(/,\s*/g, ', ')}, ${d.color}]`).join(',\n\t\t\t')},
		]
	]`

		const regions = option.regions.filter(region => region.checked)
		const operStr = `[
		${regions.map(region => `[${anchorMap[region.anchor]}, ${imageData.width}, ${imageData.height}, ${region.x0}, ${region.y0}, ${region.x1}, ${region.y1}, 1000]`).join(',\n\t\t')},
	]`;

		if (data.length && regions.length) {
			return `{
	desc: ${descStr},
	oper: ${operStr}
}`;
		} else if (data.length) {
			return `{
	desc: ${descStr},
}`;
		} else if (regions.length) {
			return `{
	oper: ${operStr}
}`;
		} else {
			throw new Error('数据不能为空');
		}
	}


	execute(data: PositionRowData[], imageData: ImageData, option: ExecutorOption): ExecuteResult {
		// TODO 适配区域找点
		// throw new Error('Method not implemented.');
		if (data.length === 0) {
			return {
				success: false,
				message: '数据不能为空'
			}
		}
		const agHelper = new AnchorGraphicHelper([imageData.width, imageData.height, 0, 0, imageData.width - 1, imageData.height - 1]);
		if (option.executorMode === '比色') {
			agHelper.KeepScreen(imageData, false);
			let failPositions = [];
			for (let i = 0; i < data.length; i++) {
				if (!data[i].checked) continue;
				const [x, y] = data[i].coordinate.split(',').map(Number);
				// [0]: X坐标
				// [1]: Y坐标
				// [2]: R分量目标值
				// [3]: G分量目标值
				// [4]: B分量目标值
				// [5]: R分量容差
				// [6]: G分量容差
				// [7]: B分量容差
				// [8]: 结果标志位
				if (!agHelper.CompareColor([x, y, ...asColorArray(data[i].color), 0, 0, 0, 0], option.similarity, false)) {
					failPositions.push(i);
				}
			}
			if (failPositions.length > 0) {
				return {
					success: false,
					message: `锚点比色测试失败，第${failPositions.join(',')}个点测试失败`
				}
			} else {
				return {
					success: true,
					message: '锚点比色测试成功'
				}
			}
		} else if (option.executorMode === '找色') {
			const successData: Point[] = [];
			let regions: RegionRowData[];
			if (option.regions.length > 0) {
				regions = option.regions;
			} else {
				regions = [{
					checked: true,
					anchor: 'N',
					x0: 0,
					y0: 0,
					x1: imageData.width - 1,
					y1: imageData.height - 1
				}];
			}
			agHelper.KeepScreen(imageData, true);
			data = data.filter(item => item.checked);
			const [x0, y0] = data[0].coordinate.split(',').map(Number);
			const desc = data.map(row => {
				const [x, y] = row.coordinate.split(',').map(Number);
				return [x - x0, y - y0, ...asColorArray(row.color), 0, 0, 0, 0];
			});

			for (let i = 0; i < regions.length; i++) {
				// 查找已选中的区域
				if (!regions[i].checked) continue;
				const points = agHelper.FindMultiColorEx6(regions[i].x0, regions[i].y0, regions[i].x1, regions[i].y1, desc, option.similarity, true);
				successData.push(...points.map(p => {
					return new Point(p.x, p.y);
				}));
			}

			if (successData.length > 0) {
				return {
					success: true,
					message: `锚点找色测试成功，成功坐标为：${successData.map(point => `(${point.x},${point.y})`).join(',')}`,
					data: successData,
				}
			} else {
				return {
					success: false,
					message: '锚点找色测试失败'
				}
			}
		}
	}

	// copy from AnchorGraphicHelper
	// 返回两个颜色的相似度，范围0~100
	// 基于最大分量差值法的相似度
	colorSimilarity(color1: number[], color2: number[]): number {
		const rDiff = Math.abs(color1[0] - color2[0]);
		const gDiff = Math.abs(color1[1] - color2[1]);
		const bDiff = Math.abs(color1[2] - color2[2]);

		const maxDiff = Math.max(rDiff, gDiff, bDiff);

		// 计算相似度
		return (255 - maxDiff) / 255 * 100;
	}
}

export default new AnchorExecutor();
