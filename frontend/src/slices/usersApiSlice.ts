import { USERS_URL } from "@/constanst";
import { apiSlice } from "./apiSlice";

export const usersApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    register: builder.mutation({
      query: (data) => {
        return {
          url: `${USERS_URL}/register`,
          method: "POST",
          body: data,
        };
      },
    }),

    login: builder.mutation({
      query: (userData) => ({
        url: `/api/v1/users/login`,
        method: "POST",
        body: userData,
      }),
    }),

    logout: builder.mutation<void, void>({
      query: () => ({
        url: `${USERS_URL}/logout`,
        method: "POST",
        credentials: "include",
      }),
    }),

    // get current logged in user
    getCurrentUser: builder.query({
      query: () => ({
        url: `${USERS_URL}/current-user`,
      }),
      keepUnusedDataFor: 0, // disables cache retention
    }),
  }),
});

export const { useRegisterMutation, useLoginMutation, useGetCurrentUserQuery, useLogoutMutation } =
  usersApiSlice;
