<template>
  <div class="draw-container"
       @mousedown="handleMouseDown"
       @mousemove="handleMousemove"
       @mouseup="handleMouseup"
       @contextmenu.prevent="handleContextmenu"
  ></div>
</template>

<script>
  // zrender@5.0.4版本需要这么写
  import * as zrender from 'zrender'
  import {mapGetters} from 'vuex'

  export default {
    name: "Draw",
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
        zr: '',
        group: '',
        // 当前正在画的形状
        shape: null,
        // 颜色
        color: '#000',
        // 线宽
        lineWidth: 2,
        // 线的类型(实线or虚线)
        lineDash: null,
        // 鼠标事件的e.button
        button: undefined,
        // 按下鼠标左键时鼠标相对于画布的坐标
        downDot: [undefined, undefined],
        // 抬起鼠标左键时鼠标相对于画布的坐标
        upDot: [undefined, undefined],
        // 1.形状的起点是否确定好了
        isShapeStart: false,
        // 2.形状是否正在被修改
        isShapeEditing: false,
        // 3.形状是否已经画完了
        isShapeDone: false
      }
    },
    methods: {
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
      // 统一的画形状的函数
      drawShape(opts) {
        let {color, lineWidth, lineDash, shapeIndex} = this
        if (shapeIndex === 0) {
          return
        }
        if (shapeIndex === 1) {
          // 画任意线
          let {x1, y1, x2, y2} = opts
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
        if (shapeIndex === 0) {
          return
        }
        let {x2, y2} = opts
        if (shapeIndex === 1) {
          // 修改任意线
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
      // 画直线的工具函数
      drawLine({x1, y1, x2, y2, color, lineWidth, lineDash}) {
        this.shape = new zrender.Line({
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
          shape: {x, y, width, height},
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
          draggable: true,
          shape: {},
          style: {x, y, width, height, image: url},
        })
        this.group.add(this.shape)
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
        if (!this.shapeIndex) {
          return
        }
        const {button, offsetX, offsetY} = e
        this.button = button
        // 如果是鼠标左键按下
        if (this.isLeftDown) {
          this.downDot = [offsetX, offsetY]

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
        }
      },
      // 监听画布容器的鼠标抬起事件
      handleMouseup(e) {
        const {button, offsetX, offsetY} = e
        // 如果是鼠标左键抬起
        if (button === 0) {
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
        }
      },
      // 处理鼠标右键事件
      handleContextmenu() {

      }
    },
    computed: {
      ...mapGetters(['shapeIndex']),
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
    }
  }
</script>

<style scoped lang="less">
  @import "../../style/variables";

  .draw-container {
    width: calc(100% - @toolWidth);
    height: 100%;
    background-color: #fff;
  }
</style>
