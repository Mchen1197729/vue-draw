/*
* 此处是shape相关的状态
* */
export default {
  namespaced: true,
  state: {
    // 此刻想要添加的形状的下标 0未选择形状  1任意线  2水平线  3竖直线  4矩形  5圆形  6文字
    shapeIndex: 0
  },
  actions: {
    chooseShapeIndex({commit}, shapeIndex) {
      commit('CHOOSE_SHAPE_INDEX', shapeIndex)
    }
  },
  mutations: {
    CHOOSE_SHAPE_INDEX(state, shapeIndex) {
      state.shapeIndex = shapeIndex
    }
  }
}
