<template>
<div>
    <div class="Header">
        <div class="title">Mine Sweeper</div>
        
        <div class="timer">{{showTime.toFixed(1)}}</div>
    </div>
    <div class="minesweeper" @contextmenu.prevent="">
        <div 
        v-for="row, x in martix"
        :key="x"
        class="row">
                <div 
                v-for="block, y in row"
                :key="y+x"
                @click="clickBlock(x,y)"
                @mousedown="onMouseDown(x,y,$event)"
                @contextmenu.prevent="clickRightBlock(x,y)"
                :class="['block',!block.revealed? (block.highlight?'hightlight':'cover') : (block.mine?'mineblock':'')]">
                    <span v-if="block.flagged">
                        <i class="iconfont flag">&#xe7ad;</i>
                    </span>
                    <template v-else-if="block.revealed || devmode">
                        <span v-if="block.mine">
                            <i class="iconfont bomb">&#xef43;</i>
                        </span>
                        <span v-else :style="'color:'+numColor[block.num]">
                            {{block.num}}
                        </span>
                    </template>
                </div>
        </div>
    </div>
    <div class="Footer">
        <button @click="setting=true">SETTING</button>
        <button @click="refresh()" class="replay">REPLAY</button>
        <a href="https://github.com/linyibin97/vue-minesweeper">
            <div class="github">
                <i class="iconfont">&#xe628;</i>
                <span>REPOSITORY</span>
            </div>
        </a>
        <div class="hack" @click="devmode = !devmode">
            <i class="iconfont" v-if="devmode">&#xe869;</i>
            <i class="iconfont" v-else>&#xe8ff;</i>
            <span>HACK</span>
        </div>
    </div>
    <div class="greycover" v-show="setting" @click="setting=false">
        <div class="inputs">
            <div>Height :<input type="number" v-model.number="inputHeight"></div>
            <div>Width :<input type="number" v-model.number="inputWidth"></div>
            <div>Mine% :<input type="number" v-model.number="inputPMine"></div>
            <div class="buttons">
                <div @click="()=>{onSubmit();setting=false}">UPDATE</div>
                <div @click="setting=false">CLOSE</div>
            </div>
        </div>
    </div>
</div>
</template>

<script>
const MAXLENGTH = 100
let HEIGHT = 10 //矩阵高
let WIDTH = 10  //矩阵宽
let P_MINE = 10  //每个格子有地雷的概率
let revealedBlockNum = 0
let flagedBlockNum = 0
let mineNum = 0
let firstClick = true
let timer = null
const DIRECTIONS = [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]]

function Block() {
    this.num = 0  //该格子周围有几个雷
    this.mine = false  //该格子是否为地雷
    this.flagged = false  //是否被用户标记
    this.revealed = false  //是否被翻开
    this.highlight = false //点击数字时高亮提示
}

//用于遍历(x,y)附近八个格子 callback接受两个参数：dx,dy
function walkAround(x, y, callback) {
    for (let d of DIRECTIONS) {
        let dx = x+d[0]
        let dy = y+d[1]
        if (dx<0 || dx>=HEIGHT || dy<0 || dy>=WIDTH) continue
        callback(dx,dy)
    }
}

export default {
    data() {
        return {
            numColor : ['transparent','darkblue','darkgreen','darkred','midnightblue','seagreen','crimson','purple','darkorange'],
            martix: [],
            time : 0,
            showTime: 0,
            inputHeight : 10,
            inputWidth : 10,
            inputPMine : 10,
            setting: false, //打开设置菜单
            devmode: false, //开发模式 为TRUE可以预览格子内容 （透视挂）
        }
    },
    methods: {
        generateMine() {
            for (let row of this.martix) {
                for (let block of row) {
                    if (Math.random()<P_MINE/100) {
                        block.mine = true
                        mineNum++
                    }
                }
            }
        },
        countNum() {
            for (let i=0; i<HEIGHT; i++) {
                for (let j=0; j<WIDTH; j++) {
                    walkAround(i,j,(dx,dy)=>this.martix[i][j].num += this.martix[dx][dy].mine)
                }
            }
        },
        reveal(x, y) {
            let block = this.martix[x][y]
            if (block.mine) {
                this.gameOver() // 点到地雷了
                return 
            }
            if (block.flagged || block.revealed) return //跳过标记和已经打开的格子
            block.revealed = true
            revealedBlockNum++ //计数
            if (block.num === 0) { //周围0个雷 需要拓展
                walkAround(x, y, this.reveal)
            }
        },
        // 点击数字自动排雷
        clickNum (x, y) {
            let block = this.martix[x][y]
            if (block.num>0) {
                let flagged = 0
                walkAround(x, y, (dx, dy)=>{
                    flagged += this.martix[dx][dy].flagged
                })
                if (block.num == flagged) {
                    walkAround(x, y, (dx, dy)=>{
                        let dblock = this.martix[dx][dy]
                        if (!dblock.flagged && !dblock.revealed)
                            this.reveal(dx,dy)
                    })
                }
            }
        },
        clickBlock(x, y) {
            if (firstClick) {
                firstClick = false
                this.time = Date.now() //计时开始
                this.countTime()
            }

            if (this.martix[x][y].revealed) this.clickNum(x, y)
                else if (!this.martix[x][y].flagged) this.reveal(x, y)
            this.judge()
        },
        clickRightBlock(x, y) {
            if (firstClick) {
                firstClick = false
                this.time = Date.now() //计时开始
                this.countTime()
            }

            let block = this.martix[x][y]
            if (block.revealed) return
            block.flagged = !block.flagged

            if (block.flagged) flagedBlockNum++ 
                else flagedBlockNum--

            this.judge()
        },
        hightLight(x, y, f) {
            if (!this.martix[x][y].revealed) return
            walkAround(x, y, (dx, dy)=>{
                let block = this.martix[dx][dy]
                if (!block.revealed && !block.flagged) 
                    block.highlight = f
            })
        },
        onMouseDown(x, y, event) {
            if (event.button !== 0) return //仅左键点击时提示
            this.hightLight(x, y, true)
            document.body.onmouseup = ()=>{
                this.hightLight(x, y, false)
                document.body.onmouseup = null
            } 
        },
        gameOver() {
            for (let i=0; i<HEIGHT; i++) {
                for (let j=0; j<WIDTH; j++) {
                    if (this.martix[i][j].mine && !this.martix[i][j].flagged) {
                        this.martix[i][j].revealed = true
                    }
                }
            }
            this.lose()
        },
        // 判断是否不能再点击了
        judge() {  
            //let wrongflag = false
            // for (let i=0; i<HEIGHT; i++) {
            //     for (let j=0; j<WIDTH; j++) {
            //         let block = this.martix[i][j]
            //         if (!block.revealed && !block.flagged) return
            //         if (block.flagged && !block.mine) wrongflag = true
            //     }
            // }
            if (flagedBlockNum + revealedBlockNum < HEIGHT*WIDTH) return //还有可以点击的block
            if (flagedBlockNum !== mineNum) {
                this.lose()
            } else {
                this.win()
            }
        },
        win() {
            let endTime = Date.now()
            if (timer) clearInterval(timer)
            setTimeout(()=>{
                alert(`YOU WIN! ${((endTime-this.time)/1000).toFixed(2)}s`)
                this.replay()
            },100)
        },
        lose() {
            if (timer) clearInterval(timer)
            setTimeout(()=>{
                alert('YOU LOSE')
                this.replay()
            },100)
        },
        refresh() {
            this.replay()
        },
        onSubmit() {
            //格式化输入为在0~MAXLENGTH范围内的整数
            const format = (num) => {
                num = Math.floor(num)
                num = Math.min(MAXLENGTH,num)
                num = Math.max(0,num)
                return num
            }
            this.inputHeight = format(this.inputHeight )
            this.inputWidth = format(this.inputWidth)
            this.inputPMine = format(this.inputPMine)
            if (window.localStorage) {
                let storage = window.localStorage
                storage.setItem("Height",this.inputHeight)
                storage.setItem("Width",this.inputWidth)
                storage.setItem("PMine",this.inputPMine)
            }

            this.replay()
        },
        countTime() {
            if (timer) clearInterval(timer)
            timer = setInterval(()=>{
                this.showTime = (Date.now() - this.time)/1000
            },50)
        },
        replay() {
            this.showTime = 0
            revealedBlockNum = 0
            flagedBlockNum = 0
            mineNum = 0
            firstClick = true
            if (timer) clearInterval(timer)
            timer = null

            if (window.localStorage) {
                let storage = window.localStorage
                HEIGHT = Number(storage.getItem("Height") || HEIGHT)
                WIDTH  = Number(storage.getItem("Width") || WIDTH)
                P_MINE = Number(storage.getItem("PMine") || P_MINE)
                console.log()
                this.inputHeight = HEIGHT
                this.inputWidth = WIDTH
                this.inputPMine = P_MINE
            }
            this.martix = Array.from(new Array(HEIGHT), 
                ()=>new Array(WIDTH).fill({}).map(()=>new Block()))
            this.generateMine()
            this.countNum()     
        }
    },
    created() {
        this.replay()
    },
    mounted() {
        
    }
}
</script>

<style scoped>
    @font-face {
        font-family: 'title';
        src: url('../assets/ka1.ttf') format('truetype');
    }
    @font-face {
        font-family: 'text';
        src: url('../assets/Fleftex-M-1.ttf') format('truetype');
    }
    .Header {
        color: #555;
        font-family: 'text';
    }
    .title {
        color: #333;
        text-align: center;
        font-size: 30px;
        margin: 20px;
        font-family: 'title';
    }
    .greycover {
        background-color: rgba(0,0,0,0.5);
        position: fixed;
        left: 0;
        top: 0;
        width: 100vw;
        height: 100vh;
    }
    .inputs {
        width: 400px;
        height: 300px;
        background-color: #fff;
        text-align: center;
        font-size: 16px;
        font-family: 'text';
        color: #555;
        display: flex;
        flex-direction: column;
        justify-content: space-around;
        border: 2px solid #555;
        position: absolute;
        left: 50%;
        top: 20%;
        transform: translateX(-50%);
    }
    .inputs input{
        font-size: 14px;
        height: 18px;
        width: 40px;
        margin: 10px;
        color: #555
    }
    .buttons {
        display: flex;
        justify-content: space-around;
        margin: 20px 0 0
    }
    .buttons div{
        color: #555;
        background-color: #fff;
        border-radius: 5px;
        cursor: pointer;
        user-select: none;
    }
    .timer {
        font-size: 24px;
        margin: 10px;
        text-align: center;
    }
    .Footer {
        display: flex;
        justify-content: center;
        margin-top: 50px;
        user-select:none;
    }
    .github {
        display: flex;
        font-size: 16px;
        color: #888;
    }
    .hack {
        display: flex;
        font-size: 16px;
        color: #888;
        margin-left: 30px;
        cursor: pointer;
    }
    .Footer i {
        font-size: 24px;
        margin-right: 5px;
        color: #888;
    }
    .minesweeper {
        margin: 10px;
    }
    .row {
        display: flex;
        justify-content: center;
    }
    .block {
        width: 30px;
        height: 30px;
        border: 1px solid #bbb;
        line-height: 30px;
        text-align: center;
        margin: 1px;
        user-select:none;
        font-size: 18px;
        background-color: #eee;
    }
    .mineblock {
        background-color: indianred;
    }
    .cover:hover {
        background-color: #ddd;
    }
    .cover {
        background-color: #ccc;
    }
    .hightlight {
        background-color: #ddd;
    }

    .bomb {
        color : #fff;
    }
    .flag {
        color: indianred;
    }

    @font-face {
        font-family: 'iconfont';
        src: url('../assets/icon/iconfont.ttf?t=1647752117392') format('truetype');
    }
    .iconfont {
        font-family: "iconfont" !important;
        font-style: normal;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
    }

    a {
        text-decoration: none;
    }
    a:link {
        text-decoration: none;
    }
    a:visited {
        text-decoration: none;
    }
    a:hover {
        text-decoration: none;
    }
    a:active {
        text-decoration: none;
    }
</style>