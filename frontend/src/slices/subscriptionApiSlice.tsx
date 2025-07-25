import { SUBSCRIPTIONS_URL } from "@/constanst";
import { apiSlice } from "./apiSlice";

export const subscriptionApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // request to toggle the channel subscription
    toggleSubscription: builder.mutation({
      query: (userId) => ({
        url: `${SUBSCRIPTIONS_URL}/c/${userId}`,
        method: "POST",
      }),
    }),
  }),
});

export const { useToggleSubscriptionMutation } = subscriptionApiSlice;
