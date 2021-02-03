<template>
  <div class="header-container"></div>
</template>

<script>
  export default {
    name: "Header"
  }
</script>

<style scoped lang="less">
  @import "../../style/variables";

  .header-container {
    width: 100%;
    height: @headerHeight;
    background-color: @headerBgColor;
    border-bottom: 1px solid @commonBorderColor;
  }
</style>
