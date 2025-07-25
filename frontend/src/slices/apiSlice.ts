import {
  createApi,
  fetchBaseQuery,
  BaseQueryFn,
  FetchArgs,
  FetchBaseQueryError,
} from "@reduxjs/toolkit/query/react";
import { setUserCredentials, logoutUser } from "./authSlice";
import { BASE_URL } from "@/constanst";
import { RootState } from "@/app/store";
import { checkIfTokenNeedsRefresh } from "@/utils/CheckToken";

const baseQuery = fetchBaseQuery({
  // this baseQuery is modified using fetchBaseQuery and every time the req goes to the server, it will include the token in the header
  baseUrl: BASE_URL,
  credentials: "include",
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth.accessToken;
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
    return headers;
  },
});

let isRefreshing = false; // this is a mutex variable to prevent multiple requrests for the token

const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  const state = api.getState() as RootState;
  const accessToken = state.auth.accessToken!;
  // const refreshToken = state.auth.refreshToken!;

  if (accessToken && checkIfTokenNeedsRefresh(accessToken) && !isRefreshing) {
    isRefreshing = true;

    console.log("Token is expired, refreshing...");

    const refreshResult = await baseQuery(
      {
        url: "/api/v1/users/refresh-token",
        method: "POST",
        // body: refreshToken, // already present in cookies
      },
      api,
      extraOptions
    );

    if (refreshResult?.data) {
      console.log("Token refreshed successfully");

      const user = state.auth.user!;

      const responseData = refreshResult.data as {
        data: { accessToken: string; refreshToken?: string };
      };

      api.dispatch(
        setUserCredentials({
          accessToken: responseData.data.accessToken,
          user: user,
        })
      );
    } else {
      console.log("Token refresh failed");
      api.dispatch(logoutUser("Session expired, please login again"));
      window.location.href = "/login";
      isRefreshing = false; // Release the lock after failure
      return refreshResult;
    }
    isRefreshing = false; // Release the lock after the refresh request completes
  }

  const result = await baseQuery(args, api, extraOptions);

  // If we still get 401, means refresh token is also expired
  if (result.error && result.error?.status === 401) {
    console.error("Unauthorized! Logging out...");
    api.dispatch(logoutUser("You are not logged In"));
    window.location.href = "/login";
  }

  return result;
};

export const apiSlice = createApi({
  baseQuery: baseQueryWithReauth,
  endpoints: () => ({}),
  tagTypes: [
    "Comment",
    "Like",
    "User",
    "Playlist",
    "Subscription",
    "Tweet",
    "Video",
  ],
});
