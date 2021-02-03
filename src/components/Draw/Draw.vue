<template>
  <div class="draw-container">

  </div>
</template>

<script>
  export default {
    name: "Draw"
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
