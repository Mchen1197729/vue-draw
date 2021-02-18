<template>
  <div class="container">
    <div class="header-container">
      <!-- <div v-show="false" class="up-box">

       </div>-->
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
        <el-popconfirm @confirm="handleClearMap" title="确定要清空画布吗？">
          <el-button style="margin-right: 10px;" slot="reference" type="danger" plain size="small">清空画布</el-button>
        </el-popconfirm>
        <el-button v-show="false" @click="handleTest" size="small">测试</el-button>
      </div>
    </div>
    <div class="main-section">
      <div class="tool-container">
        <div class="tool-tabs-box">
          <div class="title-box">
            <div @click="handleShowSource" class="item source-title" :class="{current: currentTabIndex===0}">图元库</div>
            <div @click="handleManageSource" class="item source-manage" :class="{current: currentTabIndex===1}">图元管理
            </div>
            <div class="item create-btn" @click="handleCreateImageSource">创建图元</div>
          </div>
          <div class="content-box">
            <div class="image-sources-box" v-show="currentTabIndex===0">
              <div @click="handleAddImage(source)" class="images-source-item" v-for="source in imageSources"
                   :key="source.name">
                <img :src="source.url" alt="">
                <span>{{ source.name }}</span>
              </div>
            </div>
            <div class="image-sources-manage-box" v-show="currentTabIndex===1">
              <div class="image-source-item" v-for="source in imageSources" :key="source.name">
                <img :src="source.url" alt="">
                <span class="name">{{ source.name }}</span>
                <div class="operations">
                  <el-popconfirm @confirm="handleDelSource(source)" title="确定删除该图元吗？">
                    <span slot="reference" class="delete">删除</span>
                  </el-popconfirm>
                  <span @click="handleUpdateSource(source)" class="update">修改</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="shape-source-box">
          <div class="shape-box" v-for="(shape,index) in shapeArr" :key="index">
            <div
                    class="shape-item"
                    @click="handleChooseShape(item.index)"
                    v-for="(item,cIndex) in shape"
                    :key="cIndex"
                    :class="{current:item.index===shapeIndex}"
            >{{ item.shapeName }}
            </div>
          </div>
        </div>
      </div>
      <div
              class="draw-container"
              @mousedown="handleMouseDown"
              @mousemove="handleMousemove"
              @mouseup="handleMouseup"
      ></div>
    </div>
    <a href="" ref="downloadLink" v-show="false"></a>
    <input @change="handleFileChange" ref="uploadLink" type="file" v-show="false">
    <input @change="handleChooseImage" ref="imageLink" type="file" v-show="false">
    <el-dialog width="30%" :title="dialogTitle" :visible.sync="dialogFormVisible">
      <el-form size="small" :rules="rules" :model="form">
        <el-form-item label="图元名称" :label-width="'100px'" prop="name">
          <el-input style="width: 140px;" v-model="form.name" autocomplete="off"></el-input>
        </el-form-item>
        <el-form-item label="图元图片" :label-width="'100px'">
          <div class="avatar-uploader">
            <img @click="$refs.imageLink.click();" v-if="form.url" :src="form.url" class="avatar">
            <i v-else @click="$refs.imageLink.click();" class="el-icon-plus avatar-uploader-icon"></i>
          </div>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button size="small" @click="dialogFormVisible = false">取 消</el-button>
        <el-button size="small" type="primary" @click="confirmCreateImageSource">确 定</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
  // zrender@5.0.4版本需要这么写 否则生产版本会在初始化zrender实例的时候报错
  const zrender = require('zrender')

  export default {
    name: 'App',
    created() {
      console.log(zrender.version)
      // 将本地保存的图元信息提取出来
      this.imageSources = JSON.parse(localStorage.getItem('imageSources')) || []
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
        // console.log(e.event.target)
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
          // 向下滚动(缩小画布)-->最小缩放到正常情况下的0.1倍
          this.group.attr({
            scaleX: (scaleX * 10 - 1) / 10 > 0.1 ? (scaleX * 10 - 1) / 10 : 0.1,
            scaleY: (scaleY * 10 - 1) / 10 > 0.1 ? (scaleY * 10 - 1) / 10 : 0.1,
            originX: mapWidth / 2,
            originY: mapHeight / 2
          })
        }
      }, 50))
      this.zr.on('contextmenu', e => {
        e.event.preventDefault()
        console.log(e)
      })
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
        shapeLineOptions: [
          {label: '实线', value: null},
          {label: '虚线', value: [5, 5]}
        ],
        // 当前的标签页的下标 --> 0对应 `图元库` 1对应 `图元管理`
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
        isMapMoving: false,
        // 对话框是否显示
        dialogFormVisible: false,
        // 对话框的标题
        dialogTitle: '',
        // 创建的图元
        imageSources: [],
        form: {
          id: '',
          name: '',
          url: ''
        },
        rules: {
          name: [
            {required: true, message: '请输入图元名称', trigger: 'blur'},
            {min: 1, max: 4, message: '长度在1到4个字符', trigger: 'blur'}
          ]
        }
      }
    },
    methods: {
      handleTest() {
        console.log(this.zr.painter.getSvgDom())
      },
      // 点击删除图元
      handleDelSource({name, url}) {
        // console.log({name, url})
        // 更新data中的数据
        this.imageSources = JSON.parse(localStorage.getItem('imageSources')).filter(source => {
          return source.name !== name
        })
        // 将最新的数据保存在本地localStorage中
        localStorage.setItem('imageSources', JSON.stringify(this.imageSources))
      },
      // 点击修改图元
      handleUpdateSource({id, name, url}) {
        this.dialogTitle = '修改图元'
        this.dialogFormVisible = true
        // 设置表单中的数据
        this.form = {id, name, url}
      },
      // 工具函数:还原鼠标的坐标对应于此时画布上的真实的坐标(利用transform对象)
      reverseCoordinate([x0, y0]) {
        let {scaleX, scaleY, transform} = this.group
        // let [m1, m2, m3, m4, m5, m6] = transform || [0, 0, 0, 0, 0, 0]
        if (!transform) return [x0 / scaleX, y0 / scaleY]
        else return [(x0 - transform[4]) / scaleX, (y0 - transform[5]) / scaleY]
      },
      //节流:频繁触发的事件，保证每次只在固定的时间间隔内处理一次
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
          } else if (shapeIndex === 6) {
            let {x, y, fill, text, fontSize} = style
            this.drawText({x, y, text, color: fill, fontSize})
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
            console.error('文件格式错误')
          }
        }
        reader.readAsText(e.target.files[0])
      },
      // 图片选择框的change事件
      handleChooseImage(e) {
        let reader = new FileReader()
        reader.onload = e1 => {
          this.form.url = e1.target.result
          // 手动将文件选择框的值置空 避免下一次选择了同一个文件而不触发onchange事件监听
          e.target.value = ''
        }
        reader.readAsDataURL(e.target.files[0])
      },
      // 统一的画形状的函数(不包含1.文字和2.图片)
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
          let [x11, y11] = this.reverseCoordinate([x1, y1])
          let [x22, y22] = this.reverseCoordinate([x2, y2])
          return this.drawLine({x1: x11, y1: y11, x2: x22, y2: y22, color, lineWidth, lineDash})
        }
        if (shapeIndex === 2) {
          // 画水平线
          let {x1, y1, x2, y2} = opts
          let [x11, y11] = this.reverseCoordinate([x1, y1])
          let [x22, y22] = this.reverseCoordinate([x2, y2])
          return this.drawLine({x1: x11, y1: y11, x2: x22, y2: y11, color, lineWidth, lineDash})
        }
        if (shapeIndex === 3) {
          // 画竖直线
          let {x1, y1, x2, y2} = opts
          let [x11, y11] = this.reverseCoordinate([x1, y1])
          let [x22, y22] = this.reverseCoordinate([x2, y2])
          return this.drawLine({x1: x11, y1: y11, x2: x11, y2: y22, color, lineWidth, lineDash})
        }
        if (shapeIndex === 4) {
          // 画矩形
          let {x1, y1, x2, y2} = opts
          let [x11, y11] = this.reverseCoordinate([x1, y1])
          let [x22, y22] = this.reverseCoordinate([x2, y2])
          return this.drawRect({
            x: x11, y: y11,
            width: Math.abs(x22 - x11),
            height: Math.abs(y22 - y11),
            color, lineWidth, lineDash
          })
        }
        if (shapeIndex === 5) {
          // 画圆形
          let {x1, y1, x2, y2} = opts
          let [x11, y11] = this.reverseCoordinate([x1, y1])
          let [x22, y22] = this.reverseCoordinate([x2, y2])
          return this.drawCircle({
            cx: x11, cy: y11,
            r: Math.sqrt((x22 - x11) ** 2 + (y22 - y11) ** 2),
            color, lineWidth, lineDash
          })
        }
      },
      // 统一的修改形状样式的工具函数
      attrShape(opts) {
        let {shapeIndex} = this
        let {x2, y2} = opts
        if (shapeIndex === 1) {
          // 修改任意线
          let [x22, y22] = this.reverseCoordinate([x2, y2])
          this.shape.attr('shape', {x2: x22, y2: y22})
        } else if (shapeIndex === 2) {
          // 修改水平线
          let {x1, y1} = this.shape.shape
          let [x22, y22] = this.reverseCoordinate([x2, y2])
          this.shape.attr('shape', {x2: x22, y2: y1})
        } else if (shapeIndex === 3) {
          // 修改竖直线
          let {x1, y1} = this.shape.shape
          let [x22, y22] = this.reverseCoordinate([x2, y2])
          this.shape.attr('shape', {x2: x1, y2: y22})
        } else if (shapeIndex === 4) {
          // 修改矩形
          let {x, y} = this.shape.shape
          let [x22, y22] = this.reverseCoordinate([x2, y2])
          this.shape.attr('shape', {
            width: x22 - x,
            height: y22 - y
          })
        } else if (shapeIndex === 5) {
          // 修改圆形
          let {cx, cy} = this.shape.shape
          let [x22, y22] = this.reverseCoordinate([x2, y2])
          this.shape.attr('shape', {
            r: Math.sqrt((x22 - cx) ** 2 + (y22 - cy) ** 2)
          })
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
      // 添加文字的工具函数
      drawText({x, y, text, fontSize, color}) {
        this.shape = new zrender.Text({
          shapeIndex: 6,
          draggable: true,
          shape: {},
          style: {
            x, y,
            text,
            fontSize,
            align: 'center',
            verticalAlign: 'center',
            fill: color, // 文字颜色
          },
        })
        this.group.add(this.shape)
      },
      // 画图片的工具函数
      drawImage({url, x, y, width, height}) {
        this.shape = new zrender.Image({
          shapeIndex: 7,
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
      // 创建图元
      handleCreateImageSource() {
        this.dialogTitle = '创建图元'
        // 打开对对话框
        this.dialogFormVisible = true
      },
      // 确定创建图元/修改图元
      confirmCreateImageSource() {
        let {name, url, id} = this.form
        if (!name || !url) return
        // 判断该名称的图元是否已经被添加过了
        if (this.dialogTitle === '创建图元') {
          let index = this.imageSources.findIndex(item => item.name === name)
          if (index > -1) {
            return this.$message.error('该图元已经存在')
          }
          this.imageSources.push({id: Date.now(), name, url})
        } else if (this.dialogTitle === '修改图元') {
          this.imageSources = this.imageSources.map(item => {
            if (item.id === id) {
              return {id, name, url}
            }
            return item
          })
        }
        this.form = {id: '', name: '', url: ''}
        this.dialogFormVisible = false
        this.dialogTitle = ''
        // 将已添加的图元同步到本地localStorage
        localStorage.setItem('imageSources', JSON.stringify(this.imageSources))
      },
      // 选择形状
      handleChooseShape(shapeIndex) {
        if (this.shapeIndex === shapeIndex) {
          this.shapeIndex = 0
        } else {
          this.shapeIndex = shapeIndex
          if (shapeIndex === 6) {
            this.$prompt('请输入要添加的文字内容', '消息', {
              confirmButtonText: '确定',
              cancelButtonText: '取消',
              inputType: 'textarea',
              inputErrorMessage: '请输入正确格式的文字！',
              inputValidator: (value) => {
                return !!value.trim()
              }
            })
                .then(({value}) => {
                  // 计算此时此刻的画布中心点的坐标 让文字每次都添加在画布的中心点
                  let [x, y] = this.reverseCoordinate([this.zr.getWidth() / 2, this.zr.getHeight() / 2])
                  let {shapeColor, shapeLineWidth} = this
                  this.drawText({
                    x, y, text: value.trim(),
                    fontSize: shapeLineWidth + 10,
                    color: shapeColor
                  })
                })
                .catch(() => {
                  this.$message({
                    type: 'info',
                    message: '取消输入'
                  });
                })
                .finally(() => {
                  this.shapeIndex = 0
                })
          }
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
        this.download(mapJson, 'shape.json')
      },
      // 清空画布
      handleClearMap() {
        // 移除Group内所有的元素
        this.group.removeAll()
        // 强制zrender实例刷新
        this.zr.refresh()
        // 重置this.shape
        this.shape = null
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
      // e.zrX:鼠标按下的点距离画布容器左上角的横向的距离
      // e.zrY:鼠标按下的点距离画布容器左上角的纵向的距离
      // e.button 0鼠标左键 1鼠标中键 2鼠标右键
      handleMouseDown(e) {
        const {button, zrX, zrY} = e
        this.button = button
        // 如果是鼠标中键按下
        if (this.isLeftDown) {
          this.downDot = [zrX, zrY]
        } else if (this.idMiddleDown) {
          // 鼠标中间按下则认为是进行画布整体的拖动操作
          this.isMapMoving = true
          // 获取当前Group的位移的值
          let oldX = this.group.x || 0
          let oldY = this.group.y || 0
          this.transitionStart = [zrX - oldX, zrY - oldY]
        }
      },
      // 监听画布容器的鼠标移动事件
      handleMousemove(e) {
        const {button, zrX, zrY} = e
        // 判断形状的起点是否已经确定好了
        if (this.isShapeStart && button === 0) {
          this.isShapeEditing = true
          // 此处应该创建一个事件队列 将频繁触发的鼠标移动事件塞进事件队列中 然后再按先进先出的原则去调用this.attrShape()方法来修改形状的属性
          // Todo...
          // 修改形状的样式
          this.attrShape({x2: zrX, y2: zrY})
        } else if (this.idMiddleDown && this.isMapMoving) {
          // 鼠标中键被按下并且并且移动鼠标则认为是进行画布整体的拖动操作
          this.isMapMoving = true
          this.transitionEnd = [zrX, zrY]
          let [x1, y1] = this.transitionStart
          this.translateGroup({x: zrX - x1, y: zrY - y1})
        }
      },
      // 监听画布容器的鼠标抬起事件
      handleMouseup(e) {
        const {button, zrX, zrY} = e
        // 如果是鼠标左键抬起
        if (this.isLeftDown) {
          this.upDot = [zrX, zrY]
          // 判断形状的起点是否已经确定好了
          let [downDotX, downDotY] = this.downDot
          let [upDotX, upDotY] = this.upDot
          // 鼠标左键按下和抬起的点必须非常近才可以视作确定形状的起点
          if (Math.abs(downDotX - upDotX) <= 1 && Math.abs(downDotY - upDotY) <= 1) {
            this.isShapeStart = true
          }
          // 判断是否是确定终点的操作
          if (this.isShapeStart && this.isShapeEditing) {
            this.isShapeStart = false
            this.isShapeEditing = false
            //确定终点
            this.isShapeDone = true
          }
        } else if (this.idMiddleDown && this.isMapMoving) {
          // 鼠标中键被抬起则认为是进行画布整体的拖动操作
          this.isMapMoving = false
          this.transitionEnd = [zrX, zrY]
        }
      },
      // 处理鼠标右键事件
      handleContextmenu() {

      },
      // 点击图元库中的图片向画布中添加图
      handleAddImage({name, url}) {
        // console.log({name, url})
        // 计算此时此刻的画布中心点的坐标 让文字每次都添加在画布的中心点
        let [x, y] = this.reverseCoordinate([this.zr.getWidth() / 2, this.zr.getHeight() / 2])
        // 调用画图片的工具函数
        this.drawImage({url, x: x - 50, y: y - 50, width: 100, height: 100})
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

      /*.up-box {
        width: 100%;
        height: @headerHeight/2;
      }*/

      .down-box {
        padding-left: 10px;
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;

        .color-box {
          width: 100px;
          display: flex;
          align-items: center;
          justify-content: center;

          span.title {
            letter-spacing: 2.5px;
            margin-right: 10px;
          }
        }

        .line-width-box {
          width: 200px;
          display: flex;
          align-items: center;
          justify-content: center;

          span.title {
            letter-spacing: 2.5px;
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

        .tool-tabs-box {
          width: 100%;
          height: calc(100% - @toolShapeSourceHeight);
          background-color: #fff;

          .title-box {
            height: 40px;
            background-color: @toolBgColor;
            display: flex;

            .item {
              cursor: pointer;
              width: 33.333%;
              height: 40px;
              letter-spacing: 2.5px;
              text-align: center;
              line-height: 40px;

              &:hover {
                color: @activeFontColor;
              }

              &.current {
                color: @activeFontColor;
                background-color: #fff;
                border-bottom: 2px solid @activeFontColor;
              }
            }

          }

          .content-box {
            width: 100%;
            height: calc(100% - 40px);
            overflow-y: auto;

            .image-sources-box {
              width: 100%;
              max-height: 100%;
              display: flex;
              //justify-content: space-between;
              flex-wrap: wrap;

              .images-source-item {
                cursor: pointer;
                width: 33.333%;
                height: 100px;
                display: flex;
                flex-direction: column;
                align-items: center;

                img {
                  width: 70px;
                  height: 70px;
                  margin-bottom: 5px;
                }
              }
            }

            .image-sources-manage-box {
              width: 100%;
              max-height: 100%;

              .image-source-item {
                padding: 2px 10px;
                margin-top: 5px;
                width: 100%;
                height: 60px;
                display: flex;
                letter-spacing: 2.5px;
                justify-content: space-between;
                align-items: center;
                border-bottom: 1px dashed @commonBorderColor;

                img {
                  width: 50px;
                  height: 50px;
                }

                .name {
                  font-size: 13px;
                }

                .operations {
                  font-size: 13px;
                  padding: 5px 10px;
                  padding-right: 0;

                  .delete {
                    margin-right: 5px;

                    &:hover {
                      cursor: pointer;
                      color: #F56C6C;
                    }
                  }

                  .update {
                    margin-left: 5px;

                    &:hover {
                      cursor: pointer;
                      color: #409EFF;
                    }
                  }
                }
              }
            }
          }
        }

        .shape-source-box {
          width: 100%;
          height: @toolShapeSourceHeight;
          background-color: @toolBgColor;
          border-top: 1px solid @commonBorderColor;

          .shape-box {
            width: 100%;
            height: @toolShapeSourceHeight/2;
            display: flex;

            .shape-item {
              width: 33.333%;
              height: @toolShapeSourceHeight/3;
              text-align: center;
              letter-spacing: 2.5px;
              line-height: @toolShapeSourceHeight/3;
              cursor: pointer;
              background-color: @toolBgColor;

              &.current {
                background-color: #fff;
                color: #F56C6C;
                border-bottom: 2px solid #F56C6C;
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

    .avatar-uploader {
      width: @imageSize;
      height: @imageSize;
      border: 1px dashed #d9d9d9;
      border-radius: 6px;
      cursor: pointer;
      position: relative;
      overflow: hidden;
    }

    .avatar-uploader:hover {
      border-color: #409EFF;
    }

    .avatar-uploader-icon {
      font-size: 28px;
      color: #8c939d;
      width: @imageSize;
      height: @imageSize;
      line-height: @imageSize;
      text-align: center;
    }

    .avatar {
      width: @imageSize;
      height: @imageSize;
      display: block;
    }
  }
</style>
