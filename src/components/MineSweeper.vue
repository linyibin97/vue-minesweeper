<template>
    <div class="minesweeper" @contextmenu.prevent="">
        <div 
        v-for="row, x in martix"
        :key="x"
        class="row">
                <div 
                v-for="block, y in row"
                :key="y+x"
                @click = clickBlock(x,y)
                @mousedown = hightLight(x,y,true)
                @mouseup = hightLight(x,y,false)
                @contextmenu.prevent = clickRightBlock(x,y)
                :class="['block',!block.revealed? (block.highlight?'hightlight':'cover') : (block.mine?'mineblock':'')]">
                    <template v-if="block.revealed || devmode">
                        <span v-if="block.mine">
                            <i class="iconfont bomb">&#xef43;</i>
                        </span>
                        <span v-else :style="'color:'+numColor[block.num]">
                            {{block.num}}
                        </span>
                    </template>
                    <span v-else-if="block.flagged">
                        <i class="iconfont flag">&#xe7ad;</i>
                    </span>
                </div>
        </div>
    </div>
</template>

<script>
const HEIGHT = 15 //矩阵高
const WIDTH = 10  //矩阵宽
const P_MINE = 0.1  //每个格子有地雷的概率
const DIRECTIONS = [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]]
let revealedBlockNum = 0
let flagedBlockNum = 0
let mineNum = 0

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
            martix: Array.from(new Array(HEIGHT), 
                            ()=>new Array(WIDTH).fill({}).map(()=>new Block())),
            time : 0,
            devmode: false, //开发模式 为TRUE可以预览格子内容 （透视挂）
        }
    },
    methods: {
        generateMine() {
            for (let row of this.martix) {
                for (let block of row) {
                    if (Math.random()<P_MINE) {
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
                let notRevealed = 0
                walkAround(x, y, (dx, dy)=>{
                    flagged += this.martix[dx][dy].flagged
                    notRevealed += !this.martix[dx][dy].revealed
                })
                console.log(flagged, notRevealed)
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
            if (this.martix[x][y].revealed) this.clickNum(x, y)
                else this.reveal(x, y)
            this.judge()
        },
        clickRightBlock(x, y) {
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
        gameOver() {
            for (let i=0; i<HEIGHT; i++) {
                for (let j=0; j<WIDTH; j++) {
                    if (this.martix[i][j].mine) {
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
            setTimeout(()=>{
                alert(`YOU WIN! ${((endTime-this.time)/1000).toFixed(2)}s`)
                history.go(0)
            },100)
        },
        lose() {
            setTimeout(()=>{
                alert('YOU LOSE')
                history.go(0)
            },100)
        }
    },
    created() {
        this.generateMine()
        this.countNum()
    },
    mounted() {
        this.time = Date.now() //计时开始
    }
}
</script>

<style scoped>
    .minesweeper {
        margin-top: 50px;
    }
    .row {
        display: flex;
        justify-content: center;
    }
    .block {
        width: 40px;
        height: 40px;
        border: 1px solid #bbb;
        line-height: 40px;
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
        src: url('../assets/icon/iconfont.ttf?t=1647702211946') format('truetype');
    }
    .iconfont {
        font-family: "iconfont" !important;
        font-size: 16px;
        font-style: normal;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
    }

</style>