import { configureStore } from '@reduxjs/toolkit'
import modalReducer from '../components/modalSlice'

export default configureStore({
  reducer: {
    modal: modalReducer,
  },
})