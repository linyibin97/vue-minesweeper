# vue-minesweeper

Vue实现 经典小游戏扫雷 

[在线游玩](http://101.33.214.39:81/)

![https://gitee.com/linyibin97/vue-minesweeper/raw/master/preview.png]()

### 游戏规则

- 在height*width大小的矩阵中，每个格子有P的概率埋了地雷，点击每个格子排出所有的雷即胜利，提示数字代表该格子附近8个格子有几个地雷。
- 鼠标左键点击未知格子可以探测该格子是否为地雷，若附近有0个雷可以自动展开。

- 鼠标右键点击未知格子可以标记，标记后不会被打开，再次右键点击可取消标记。

- 鼠标左键点击已知格子可以高亮附近8个格子未被打开或标记的格子，若附近8个格子被标记数量与该格子显示的附近地雷数相等则自动打开未被打开的格子。

### 运行项目

```
git clone https://gitee.com/linyibin97/vue-minesweeper.git
```

```
yarn install
```
```
yarn serve
```