<template>
  <div class="tool-container">
    <div class="image-source-box">
      <div class="title-box">
        <div @click="handleShowSource" class="item source-title" :class="{current: currentTabIndex===0}">图元库</div>
        <div @click="handleManageSource" class="item source-manage" :class="{current: currentTabIndex===1}">图元管理</div>
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
                :class="{current:item.index===currentShapeIndex}"
        >{{item.shapeName}}
        </div>
      </div>
    </div>
  </div>
</template>

<script>
  export default {
    name: "Tool",
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
        // 当前的形状的下标 --> 0未选择形状  1任意线  2水平线  3竖直线  4矩形  5圆形  6文字
        currentShapeIndex: 0
      }
    },
    methods: {
      handleShowSource() {
        this.currentTabIndex = 0
      },
      handleManageSource() {
        this.currentTabIndex = 1
      },
      // 选择形状
      handleChooseShape(index) {
        if (this.currentShapeIndex === index) {
          this.currentShapeIndex = 0
        } else {
          this.currentShapeIndex = index
        }
      }
    }
  }
</script>

<style scoped lang="less">
  @import "../../style/variables";

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
</style>
