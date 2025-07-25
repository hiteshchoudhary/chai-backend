import { LIKES_URL } from "@/constanst";
import { apiSlice } from "./apiSlice";

export const likeApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    toggleVideoLike: builder.mutation({
      query: (videoId) => ({
        url: `${LIKES_URL}/toggle/v/${videoId}`,
        method: "POST",
      }),
    }),

    getLikedVideos: builder.query({
      query: () => ({
        url: `${LIKES_URL}/videos`,
      }),
    }),
  }),
});

export const { useToggleVideoLikeMutation, useGetLikedVideosQuery } =
  likeApiSlice;
