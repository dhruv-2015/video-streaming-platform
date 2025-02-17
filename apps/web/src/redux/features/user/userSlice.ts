import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

export interface UserState {
  isLoggedin: boolean;
  id?: string;
  name?: string;
  email?: string;
  image?: string;
  channel_id?: string;
  role?: "ADMIN" | "USER";
}

const initialState: UserState = {
  isLoggedin: false,
};

export const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<UserState>) => {
      // Redux Toolkit allows us to write "mutating" logic in reducers. It
      // doesn't actually mutate the state because it uses the Immer library,
      // which detects changes to a "draft state" and produces a brand new
      // immutable state based off those changes
      state.isLoggedin = action.payload.isLoggedin;
      state.id = action.payload.id;
      state.name = action.payload.name;
      state.email = action.payload.email;
      state.image = action.payload.image;
      state.channel_id = action.payload.channel_id;
    },
    setChannelId: (state, action: PayloadAction<string>) => {
      state.channel_id = action.payload;
    },
    setName: (state, action: PayloadAction<string>) => {
      state.name = action.payload;
    },
    setImage: (state, action: PayloadAction<string>) => {
      state.image = action.payload;
    }
  },
});

// Action creators are generated for each case reducer function
export const { setChannelId, setUser,setImage,setName } = userSlice.actions;

export default userSlice.reducer;
