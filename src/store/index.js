import Vue from 'vue'
import Vuex from 'vuex'

import shape from './modules/shape'
import header from './modules/header'
import getters from './getters'

Vue.use(Vuex)

export default new Vuex.Store({
  modules: {
    shape,
    header
  },
  getters
})
