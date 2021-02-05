<template>
  <div class="container">
    <div class="header-container">
      <div class="up-box">

      </div>
      <div class="down-box">
        <el-button @click="handleOpenFile" size="small">打开文件</el-button>
        <el-button @click="handleSaveFile" size="small">保存文件</el-button>
        <div class="color-box">
          <span class="title">颜色</span>
          <el-color-picker @change="handleChooseColor" v-model="shapeColor" size="small"></el-color-picker>
        </div>
        <div class="line-width-box">
          <span class="title">线宽</span>
          <el-input-number
                  v-model="shapeLineWidth"
                  size="small"
                  controls-position="right"
                  @change="handleChooseLineWidth"
                  :min="1" :max="10"></el-input-number>
        </div>
        <el-button @click="handleTest" size="small">测试按钮</el-button>
      </div>
    </div>
    <div class="main-section">
      <div class="tool-container">
        <div class="image-source-box">
          <div class="title-box">
            <div @click="handleShowSource" class="item source-title" :class="{current: currentTabIndex===0}">图元库</div>
            <div @click="handleManageSource" class="item source-manage" :class="{current: currentTabIndex===1}">图元管理
            </div>
            <div class="item create-btn">创建图元</div>
          </div>
          <div class="content-box"></div>
        </div>
        <div class="shape-source-box">
          <div class="shape-box" v-for="(shape,index) in shapeArr" :key="index">
            <div
                    class="shape-item"
                    @click="handleChooseShape(item.index)"
                    v-for="(item,cIndex) in shape"
                    :key="cIndex"
                    :class="{current:item.index===shapeIndex}"
            >{{item.shapeName}}
            </div>
          </div>
        </div>
      </div>
      <div class="draw-container"
           @mousedown="handleMouseDown"
           @mousemove="handleMousemove"
           @mouseup="handleMouseup"
           @contextmenu.prevent="handleContextmenu"
      ></div>
    </div>
    <a href="" ref="downloadLink" v-show="false"></a>
    <input @change="handleFileChange" ref="uploadLink" type="file" v-show="false">
  </div>
</template>

<script>
  // zrender@5.0.4版本需要这么写
  import * as zrender from 'zrender'

  export default {
    name: 'App',
    created() {
      console.log(zrender.version)
    },
    mounted() {
      // 给浏览器窗体添加尺寸改变的监听
      window.onresize = this.handleResize
      // 初始化ZRender实例
      this.zr = zrender.init(document.querySelector('.draw-container'))
      // 创建一个Group实例 然后再Group组实例添加到画布上 以后创建的形状都添加到这个Group实例中
      this.group = new zrender.Group()
      // 将Group实例添加到画布中
      this.zr.add(this.group)
      this.drawRect({x: -100, y: -100, width: 200, height: 200, color: '#333', lineWidth: 1, lineDash: null})
      // 给zrender实例添加鼠标滚轮滚动事件
      this.zr.on('mousewheel', this.throttle(e => {
        let {wheelDelta} = e
        // 获取当Group实例当前的scaleX&scaleY
        let {scaleX, scaleY} = this.group
        // 获取当前画布的中心点坐标
        let mapWidth = this.zr.getWidth()
        let mapHeight = this.zr.getHeight()
        // 放大的时候每次比之前大0.1倍 缩小的时候每次比之前小0.1倍
        // js里小数的计算不管加减都会有精度问题 所以先将数字转换成扩大十倍然后再缩小十倍 这样就不会出现精度问题了
        if (wheelDelta > 0) {
          // 向上滚动(放大画布)
          this.group.attr({
            scaleX: (scaleX * 10 + 1) / 10,
            scaleY: (scaleY * 10 + 1) / 10,
            originX: mapWidth / 2,
            originY: mapHeight / 2
          })
        } else if (wheelDelta < 0) {
          // 向下滚动(缩小画布)
          this.group.attr({
            scaleX: (scaleX * 10 - 1) / 10 > 0.1 ? (scaleX * 10 - 1) / 10 : 0.1,
            scaleY: (scaleY * 10 - 1) / 10 > 0.1 ? (scaleY * 10 - 1) / 10 : 0.1,
            originX: mapWidth / 2,
            originY: mapHeight / 2
          })
        }
      }, 50))
    },
    data() {
      return {
        shapeArr: [
          [
            {shapeName: '任意线', index: 1},
            {shapeName: '水平线', index: 2},
            {shapeName: '竖直线', index: 3}
          ],
          [
            {shapeName: '矩形', index: 4},
            {shapeName: '圆形', index: 5},
            {shapeName: '文字', index: 6}
          ]
        ],
        // 当前的标签页的下标 --> 0对应`图元库` 1对应`图元管理`
        currentTabIndex: 0,
        // shapeIndex 形状的下标 --> 0未选择形状  1任意线  2水平线  3竖直线  4矩形  5圆形  6文字
        shapeIndex: 0,
        // 页面中唯一的zrender实例
        zr: '',
        // Group对象
        group: '',
        // 当前正在画的形状
        shape: null,
        // 默认的颜色是#000
        shapeColor: '#000',
        // 线的类型(实线or虚线) 默认是 实线
        shapeLineDash: null,
        // 线宽
        shapeLineWidth: 5,
        // 鼠标事件的e.button
        button: undefined,
        // 按下鼠标左键时鼠标相对于画布的坐标
        downDot: [undefined, undefined],
        // 抬起鼠标左键时鼠标相对于画布的坐标
        upDot: [undefined, undefined],
        // Group的位移transition开始点的坐标
        transitionStart: [0, 0],
        // Group的位移transition结束的坐标
        transitionEnd: [0, 0],
        // 1.形状的起点是否确定好了
        isShapeStart: false,
        // 2.形状是否正在被修改
        isShapeEditing: false,
        // 3.形状是否已经画完了
        isShapeDone: false,
        // 4.是否正在拖动画布
        isMapMoving: false
      }
    },
    methods: {
      handleTest() {
        this.drawRect({
          x: 195 * 0.4 * 0.4,
          y: 110 * 0.4 * 0.4,
          width: 200,
          height: 200,
          color: 'tomato',
          lineWidth: 1,
          lineDash: null
        })
      },
      // 工具函数:还原鼠标的坐标对应于此时画布上的真实的坐标
      reverseCoordinate1({x0, y0}) {
        let {x, y, originX, originY, scaleX, scaleY} = this.group
        return [(x0 - x - originX) / scaleX, (y0 - y - originY) / scaleY]
      },
      // 工具函数:还原鼠标在拖动时鼠标的点坐标到画布上真实的坐标
      reverseCoordinate2({x0, y0}) {
        let {x, y, originX, originY, scaleX, scaleY} = this.group
        return [(x0 - x - originX) / scaleX, (y0 - y - originY) / scaleY]
      },
      //节流：频繁触发的事件，保证每次只在固定的时间间隔内处理一次
      throttle(fn, delay) {
        let flag = true
        return function (...args) {
          if (flag) {
            flag = false
            setTimeout(() => {
              fn.apply(this, args)
              flag = true
            }, delay)
          }
        }
      },
      // 容器尺寸发生改变
      handleResize() {
        // 动态调整画布的尺寸
        this.zr.resize()
      },
      // 工具函数:将用户手动选择的文件直接画在画布中
      initDraw(obj) {
        let {transform, children} = obj
        children.forEach(({shapeIndex, shape, style, x, y, scaleX, scaleY, originX, originY}) => {
          let {stroke: color, lineWidth, lineDash} = style
          if (shapeIndex === 1) {
            let {x1, y1, x2, y2} = shape
            this.drawLine({x1, y1, x2, y2, color, lineWidth, lineDash})
          } else if (shapeIndex === 4) {
            let {x, y, width, height} = shape
            this.drawRect({x, y, width, height, color, lineWidth, lineDash})
          } else if (shapeIndex === 5) {
            let {cx, cy, r} = shape
            this.drawCircle({cx, cy, r, color, lineWidth, lineDash})
          }
          this.shape.attr({x, y, scaleX, scaleY, originX, originY})
        })
        // 进行Group的形变
        this.group.attr({...transform})
      },
      // 触发隐藏的a链接点击事件 让浏览器保存文件
      download(obj, filename) {
        this.$refs.downloadLink.href = 'data:text/plain,' + encodeURIComponent(JSON.stringify(obj, null, 2))
        this.$refs.downloadLink.download = filename
        this.$refs.downloadLink.click()
      },
      // 触发隐藏的文件选择框的点击事件 让浏览器打开文件系统
      upload() {
        this.$refs.uploadLink.click()
      },
      // 文件选择框的文件改变事件
      handleFileChange(e) {
        let reader = new FileReader()
        reader.onload = e1 => {
          try {
            let obj = JSON.parse(e1.target.result.toString())
            this.initDraw(obj)
            // 手动将文件选择框的值置空 避免下一次选择了同一个文件而不触发onchange事件监听
            e.target.value = ''
          } catch (_) {
            console.log('文件格式错误')
          }
        }
        reader.readAsText(e.target.files[0])
      },
      // 统一的画形状的函数
      drawShape(opts) {
        let {shapeColor: color, shapeLineWidth: lineWidth, shapeLineDash: lineDash, shapeIndex} = this
        // 获取当前的Group的形变信息
        let {x, y, scaleX, scaleY, originX, originY} = this.group
        if (shapeIndex === 0) {
          return
        }
        if (shapeIndex === 1) {
          // 画任意线
          let {x1, y1, x2, y2} = opts
          x1 = x1 / scaleX
          x1 -= (x + originX)
          y1 = y1 / scaleY
          y1 -= (y + originY)
          x2 = x2 / scaleX
          x2 -= (x + originX)
          y2 = y2 / scaleY
          y2 -= (y + originY)
          return this.drawLine({x1, y1, x2, y2, color, lineWidth, lineDash})
        }
        if (shapeIndex === 2) {
          // 画水平线
          let {x1, y1, x2, y2} = opts
          return this.drawLine({x1, y1, x2, y2: y1, color, lineWidth, lineDash})
        }
        if (shapeIndex === 3) {
          // 画竖直线
          let {x1, y1, x2, y2} = opts
          return this.drawLine({x1, y1, x2: x1, y2, color, lineWidth, lineDash})
        }
        if (shapeIndex === 4) {
          // 画矩形
          let {x1, y1, x2, y2} = opts
          return this.drawRect({
            x: x1, y: y1,
            width: Math.abs(x2 - x1),
            height: Math.abs(y2 - y1),
            color, lineWidth, lineDash
          })
        }
        if (shapeIndex === 5) {
          // 画圆形
          let {x1, y1, x2, y2} = opts
          return this.drawCircle({
            cx: x1, cy: y1,
            r: Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2),
            color, lineWidth, lineDash
          })
        }
        if (shapeIndex === 6) {
          // 添加文字
          return
        }
      },
      // 统一的修改形状样式的工具函数
      attrShape(opts) {
        let {shapeIndex} = this
        // 获取当前的Group的形变信息
        let {x, y, scaleX, scaleY, originX, originY} = this.group
        if (shapeIndex === 0) {
          return
        }
        let {x2, y2} = opts
        if (shapeIndex === 1) {
          // 修改任意线
          x2 = x2 / scaleX
          x2 -= (x + originX)
          y2 = y2 / scaleY
          y2 -= (y + originY)
          return this.shape.attr('shape', {x2, y2})
        }
        if (shapeIndex === 2) {
          // 修改水平线
          let {x1, y1} = this.shape.shape
          return this.shape.attr('shape', {x2, y2: y1})
        }
        if (shapeIndex === 3) {
          // 修改竖直线
          let {x1, y1} = this.shape.shape
          return this.shape.attr('shape', {x2: x1, y2})
        }
        if (shapeIndex === 4) {
          // 修改矩形
          let {x, y} = this.shape.shape
          return this.shape.attr('shape', {
            width: x2 - x,
            height: y2 - y
          })
        }
        if (shapeIndex === 5) {
          // 修改圆形
          let {cx, cy} = this.shape.shape
          return this.shape.attr('shape', {
            r: Math.sqrt((x2 - cx) ** 2 + (y2 - cy) ** 2)
          })
        }
        if (shapeIndex === 6) {
          // 添加文字
          return
        }
      },
      // 进行整体画布的位移的工具函数
      translateGroup(opts) {
        let {x, y} = opts
        this.group.attr({x, y})
      },
      // 画直线的工具函数
      drawLine({x1, y1, x2, y2, color, lineWidth, lineDash}) {
        this.shape = new zrender.Line({
          shapeIndex: 1,
          draggable: true,
          shape: {x1, y1, x2, y2},
          style: {
            stroke: color,
            lineWidth,
            lineDash,
            strokeNoScale: true //加上以后,线的粗细不会变,但是起点终点还是会改变
          },
        })
        this.group.add(this.shape)
      },
      // 画矩形的工具函数
      drawRect({x, y, width, height, color, lineWidth, lineDash}) {
        this.shape = new zrender.Rect({
          draggable: true,
          shapeIndex: 4,
          shape: {x, y, width, height, r: lineWidth / 10},
          style: {
            stroke: color,
            lineWidth,
            fill: 'none', //内部为透明色
            lineDash,
            strokeNoScale: true //加上以后,线的粗细不会变,但是起点终点还是会改变
          }
        })
        this.group.add(this.shape)
      },
      // 画圆形的工具函数
      drawCircle({cx, cy, r, color, lineWidth, lineDash}) {
        this.shape = new zrender.Circle({
          shapeIndex: 5,
          draggable: true,
          shape: {cx, cy, r},
          style: {
            fill: 'none',
            lineWidth,
            stroke: color,
            lineDash,
            strokeNoScale: true //加上以后,线的粗细不会变,但是起点终点还是会改变
          }
        })
        this.group.add(this.shape)
      },
      // 画图片的工具函数
      drawImage({url, x, y, width, height}) {
        this.shape = new zrender.Image({
          shapeIndex: 6,
          draggable: true,
          shape: {},
          style: {x, y, width, height, image: url},
        })
        this.group.add(this.shape)
      },
      // 展示图元库
      handleShowSource() {
        this.currentTabIndex = 0
      },
      // 展示管理图元
      handleManageSource() {
        this.currentTabIndex = 1
      },
      // 选择形状
      handleChooseShape(shapeIndex) {
        if (this.shapeIndex === shapeIndex) {
          this.shapeIndex = 0
        } else {
          this.shapeIndex = shapeIndex
        }
      },
      // 选择颜色
      handleChooseColor(shapeColor) {
        this.shapeColor = shapeColor
      },
      // 选择线宽
      handleChooseLineWidth(shapeLineWidth) {
        this.shapeLineWidth = shapeLineWidth
      },
      // 打开文件
      handleOpenFile() {
        this.upload()
      },
      // 保存文件
      handleSaveFile() {
        let mapJson = {transform: {}, children: []}
        // 得到Group的Transform变换信息
        let {x, y, scaleX, scaleY, originX, originY} = this.group
        mapJson.transform = {x, y, scaleX, scaleY, originX, originY}
        mapJson.children = this.group.children().map(child => {
          // shape是每个图形的坐标信息
          // shapeIndex是自定义的图形的类型(自定义的字典)
          // style是每个图形的样式相关的信息
          // x, y, scaleX, scaleY, originX, originY是每个图形的Transform变换的信息
          let {shape, shapeIndex, style, x, y, scaleX, scaleY, originX, originY} = child
          return {
            shapeIndex,
            shape: Object.fromEntries(Object.entries(shape)),
            style: Object.fromEntries(Object.entries(style)),
            x, y, scaleX, scaleY, originX, originY
          }
        })
        console.log(JSON.stringify(mapJson, null, 2))
        this.download(mapJson, 'shape.json')
      },
      /*
      * 设定画图的规则:
      *   1.正常的画图流程:
      *     1.1 先按下鼠标左键,然后在原地抬起鼠标左键 --> 确定形状的起点
      *     1.2 拖动鼠标 --> 选择形状的终点
      *     1.3 按下鼠标左键 --> 确定了形状的终点
      *
      *   2.取消画图的流程:
      *     2.1 先按下鼠标左键,然后在原地抬起鼠标左键 --> 确定形状的起点
      *     2.2 拖动鼠标 --> 选择形状的终点
      *     2.3 按下鼠标右键 --> 取消画图(移除刚刚添加的形状)
      * */
      // 监听画布容器的鼠标按下事件
      // e.offsetX:鼠标按下的点距离画布容器左上角的横向的距离
      // e.offsetY:鼠标按下的点距离画布容器左上角的纵向的距离
      // e.button 0鼠标左键 1鼠标中键 2鼠标右键
      handleMouseDown(e) {
        const {button, offsetX, offsetY} = e
        this.button = button
        // 如果是鼠标中键按下
        if (this.isLeftDown) {
          this.downDot = [offsetX, offsetY]
          return
        }
        if (this.idMiddleDown) {
          // 鼠标中间按下则认为是进行画布整体的拖动操作
          this.isMapMoving = true
          // 获取当前Group的位移的值
          let oldX = this.group.x || 0
          let oldY = this.group.y || 0
          this.transitionStart = [offsetX - oldX, offsetY - oldY]
          return
        }
      },
      // 监听画布容器的鼠标移动事件
      handleMousemove(e) {
        const {button, offsetX, offsetY} = e
        // 判断形状的起点是否已经确定好了
        if (this.isShapeStart && button === 0) {
          this.isShapeEditing = true
          // 修改形状的样式
          this.attrShape({x2: offsetX, y2: offsetY})
          return
        }
        if (this.idMiddleDown && this.isMapMoving) {
          // 鼠标中键被按下并且并且移动鼠标则认为是进行画布整体的拖动操作
          this.isMapMoving = true
          this.transitionEnd = [offsetX, offsetY]
          let [x1, y1] = this.transitionStart
          this.translateGroup({x: offsetX - x1, y: offsetY - y1})
          return
        }
      },
      // 监听画布容器的鼠标抬起事件
      handleMouseup(e) {
        const {button, offsetX, offsetY} = e
        // 如果是鼠标左键抬起
        if (this.isLeftDown) {
          this.upDot = [offsetX, offsetY]
          // 判断形状的起点是否已经确定好了
          let [downDotX, downDotY] = this.downDot
          let [upDotX, upDotY] = this.upDot
          // 鼠标左键按下和抬起的点必须非常近才可以视作确定形状的起点
          if (downDotX - upDotX >= -2 && downDotX - upDotX <= 2 && downDotY - upDotY >= -2 && downDotY - upDotY <= 2) {
            this.isShapeStart = true
          }
          // 判断是否是确定终点的操作
          if (this.isShapeStart && this.isShapeEditing) {
            this.isShapeStart = false
            this.isShapeEditing = false
            //确定终点
            this.isShapeDone = true
          }
          return
        }
        if (this.idMiddleDown && this.isMapMoving) {
          // 鼠标中键被抬起则认为是进行画布整体的拖动操作
          this.isMapMoving = false
          this.transitionEnd = [offsetX, offsetY]
          return
        }
      },
      // 处理鼠标右键事件
      handleContextmenu() {

      }
    },
    computed: {
      // 是否是鼠标左键按下
      isLeftDown() {
        return this.button === 0
      },
      // 是否是鼠标中键按下
      idMiddleDown() {
        return this.button === 1
      },
      // 是否是鼠标右键按下
      isRightDown() {
        return this.button === 2
      },
    },
    watch: {
      isShapeStart(value) {
        if (value) {
          let {color, lineWidth, lineDash} = this
          let [x1, y1] = this.downDot
          let [x2, y2] = this.upDot
          this.drawShape({x1, y1, x2, y2, color, lineWidth, lineDash})
        }
      }
    },
  }
</script>

<style lang="less">
  @import "style/variables";

  .container {
    user-select: none;
    width: 100%;
    height: 100%;

    .header-container {
      width: 100%;
      height: @headerHeight;
      background-color: @headerBgColor;
      border-bottom: 1px solid @commonBorderColor;

      .up-box {
        width: 100%;
        height: @headerHeight/2;
      }

      .down-box {
        padding-left: 10px;
        width: 100%;
        display: flex;
        align-items: center;

        .color-box {
          width: 100px;
          display: flex;
          align-items: center;
          justify-content: center;

          span.title {
            margin-right: 10px;
          }
        }

        .line-width-box {
          width: 200px;
          display: flex;
          align-items: center;
          justify-content: center;

          span.title {
            margin-right: 10px;
          }
        }
      }
    }

    .main-section {
      height: calc(100% - @headerHeight);
      display: flex;

      .tool-container {
        width: @toolWidth;
        height: 100%;
        background-color: @toolBgColor;
        border-right: 1px solid @commonBorderColor;

        .image-source-box {
          width: 100%;
          height: calc(100% - @toolShapeSourceHeight);
          background-color: #fff;

          .title-box {
            height: 40px;
            background-color: #eee;
            display: flex;

            .item {
              cursor: pointer;
              width: 33.333%;
              height: 40px;
              text-align: center;
              line-height: 40px;

              &:hover {
                color: @activeFontColor;
              }

              &.current {
                color: @activeFontColor;
                background-color: #fff;
              }
            }

          }
        }

        .shape-source-box {
          width: 100%;
          height: @toolShapeSourceHeight;
          border-top: 1px solid @commonBorderColor;

          .shape-box {
            width: 100%;
            height: @toolShapeSourceHeight/2;
            display: flex;

            .shape-item {
              width: 33.333%;
              height: @toolShapeSourceHeight/3;
              text-align: center;
              line-height: @toolShapeSourceHeight/3;
              cursor: pointer;

              &.current {
                background-color: #fff;
                color: tomato;
              }
            }
          }
        }
      }

      .draw-container {
        width: calc(100% - @toolWidth);
        height: 100%;
        background-color: #fff;
      }
    }
  }
</style>
