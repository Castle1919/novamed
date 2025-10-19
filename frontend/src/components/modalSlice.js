import { createSlice } from '@reduxjs/toolkit';

const modalSlice = createSlice({
  name: 'modal',
  initialState: {
    value: '',
  },
  reducers: {
    setImage: (state, action) => {
      state.value = action.payload;
      console.log(state.value);
    },
  },
});

export const { setImage } = modalSlice.actions;

export default modalSlice.reducer;
