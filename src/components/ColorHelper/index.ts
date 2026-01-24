/**
 * TODOs
 * 1. 设置面板配置的内容修改为默认设置（done）；
 * 2. 设置修改后更新给ImageBoard（done）；ImageBoard创建时继承默认设置（done）；
 * 3. 图片加载从ColorHelper修改为ImageBoard（done）；
 * 4. ColorHelper入口读增加动态的标签页，新增页签先读取图片，有图片后再渲染ImageBoard（done）；
 * 5. ImageBoard增加选区域选择，executor里允许传入区域，坐标点增加区域信息（done）；
 * 6. 设置项中增加准心是否跟随鼠标，ImageBoard同步使用该配置（done）；
 * 7. ColorHelper与ImageBoard需记录缓存，再次打开时读取缓存；
 * 8. 图片缓存计算md5，ImageBoard缓存的图片内容由图片缓存工具统一处理；
 * 9. 设计一个统一存储，按localStorage的api设计，以方便切换网络存储；(低优先级)
 * 10. 支持键盘ASD取色，对应锚点的LCR（done）；另空格取色时自动根据坐标相对图片位置自动生成锚点（done）；
 * 11. 锚点比色、锚点找色测试(done)；
 * 12. 根据位置列表反向更新准心、放大镜位置（done）；
 * 13. 高亮位置列表所在的坐标；
 * 14. 位置列表增加一列：列表与画板上颜色相似度的对比（done）；
 * 15. 导出修改为desc+oper（done）;
 * 16. 修改为鼠标点击选点（同空格逻辑），点击滑动修改为区域选择（done）；
 * 17. 支持adb截图
 * 18. 色组列表需支持刷新颜色值
 * 19. 导出增加复制按钮
 * 20. 若准心移动模式为跟随时，鼠标移动时，准心位置重置为鼠标位置，而不是跟随鼠标做相对移动；
 * 
 * 21. 支持修改已取的点或导入点的以及区域坐标和颜色值；
 * 22. 支持已取色组或区域组数据拖拽排序；
 */

/**
 * TOFIXs
 * 1. 取色或框选速度过快时与双击逻辑冲突；
 */

import { registerExecutor } from './executor/Executor';
import ImageBoard from './ImageBoard.vue';
import AnchorExecutor from './executor/AnchorExecutor';
import DefaultExecutor from './executor/DefaultExecutor';
import ColorHelper from './ColorHelper.vue';
import './iconfont/iconfont.css';
import { shortcutManager } from './shortcutManager';

registerExecutor(AnchorExecutor);
registerExecutor(DefaultExecutor);


// 初始化快捷键管理器
shortcutManager.initialize();

export {
    ColorHelper,
    ImageBoard
}
