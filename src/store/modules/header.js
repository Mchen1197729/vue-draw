/*
* 此处是与header部分相关的状态
* */
export default {
  namespaced: true,
  state: {
    // 默认的颜色是#000
    shapeColor: '#000',
    // 默认是 实线
    shapeLineDash: null
  },
  actions: {
    setShapeColor({commit}, shapeColor) {
      commit('SET_SHAPE_COLOR', shapeColor)
    },
    setShapeDash({commit}, shapeLineDash) {
      commit('SET_SHAPE_DASH', shapeLineDash)
    }
  },
  mutations: {
    SET_SHAPE_COLOR(state, shapeColor) {
      state.shapeColor = shapeColor
    },
    SET_SHAPE_DASH(state, shapeLineDash) {
      state.shapeLineDash = shapeLineDash
    }
  }
}
