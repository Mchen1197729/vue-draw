<template>
  <div class="header-container">
    <div class="up-box">

    </div>
    <div class="down-box">

    </div>
  </div>
</template>

<script>

  export default {
    name: "Header",
    methods: {

    },
  }
</script>

<style scoped lang="less">
  @import "../../style/variables";

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
      height: @headerHeight/2;
      line-height: @headerHeight/2;
    }
  }
</style>
