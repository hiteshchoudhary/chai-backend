import { configureStore } from "@reduxjs/toolkit";
import { apiSlice } from "@/slices/apiSlice";
import authReducer from "@/slices/authSlice"

export const store = configureStore({
  reducer: {
    [apiSlice.reducerPath]: apiSlice.reducer,
    auth: authReducer
  },
  middleware: (getDefaultMiddleware) => {  // this code is just used for rtq query caching u don't have to worry about it
    return getDefaultMiddleware().concat(apiSlice.middleware);
  },
  devTools: true,
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch;
