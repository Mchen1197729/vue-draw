<template>
  <div class="container">
    <Header/>
    <div class="main-section">
      <Tool/>
      <Draw/>
    </div>
  </div>
</template>

<script>
  import Header from './components/Header/Header'
  import Tool from './components/Tool/Tool'
  import Draw from './components/Draw/Draw'

  export default {
    name: 'App',
    components: {
      Header,
      Tool,
      Draw
    }
  }
</script>

<style lang="less">
  @import "style/variables";

  .container {
    width: 100%;
    height: 100%;

    .main-section {
      user-select: none;
      height: calc(100% - @headerHeight);
      display: flex;
    }
  }
</style>
