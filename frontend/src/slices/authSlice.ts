import { RootState } from "@/app/store";
import { IUser } from "@/types";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface AuthState {
  user: IUser | null;
  isLoggedIn: boolean;
  accessToken: string | null;
  logoutMessage: string | null;
}

const initialState: AuthState = {
  user: JSON.parse(localStorage.getItem("user") || "null") as IUser | null,
  isLoggedIn: JSON.parse(
    localStorage.getItem("loginStatus") || "false"
  ) as boolean,
  accessToken: localStorage.getItem("at"),
  logoutMessage: localStorage.getItem("logoutMessage"),
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUserCredentials: (
      state,
      action: PayloadAction<{ user: IUser; accessToken: string }>
    ) => {
      const { user, accessToken } = action.payload;

      state.isLoggedIn = true;
      state.user = user;
      state.accessToken = accessToken;

      localStorage.setItem("loginStatus", JSON.stringify(state.isLoggedIn));
      localStorage.setItem("user", JSON.stringify(state.user));
      localStorage.setItem("at", JSON.stringify(state.accessToken));
    },

    logoutUser: (state, action: PayloadAction<string | undefined>) => {
      const message = action.payload ?? "Logged out successfully";
      localStorage.setItem("logoutMessage", message);
      state.isLoggedIn = false;
      state.user = null;
      state.accessToken = null;
      // state.logoutMessage = action.payload || "Logged out successfully";
      state.logoutMessage = message;

      

      localStorage.removeItem("loginStatus");
      localStorage.removeItem("user");
      localStorage.removeItem("at");
    },

    clearLogoutMessage: (state) => {
      state.logoutMessage = null;
      localStorage.removeItem("logoutMessage");
    },
  },
});

export const { setUserCredentials, logoutUser, clearLogoutMessage } =
  authSlice.actions;

export default authSlice.reducer;

export const selectCurrentUser = (state: RootState) => state.auth.user;
export const selectCurrentAccessToken = (state: RootState) =>
  state.auth.accessToken;
