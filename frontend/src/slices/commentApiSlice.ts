import { COMMENTS_URL } from "../constanst";
import { apiSlice } from "./apiSlice";

export const commentApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // get all the video comments
    getVideoComments: builder.query({
      query: ({ videoId, page = 1, limit = 20 }) => ({
        url: `${COMMENTS_URL}/${videoId}?page=${page}&limit=${limit}&sortBy=createdAt&sortType=desc`,
      }),
    }),

    // to add a comment
    addComment: builder.mutation({
      query: ({ videoId, comment }) => {
        return {
          url: `${COMMENTS_URL}/${videoId}`,
          method: "POST",
          headers: {
            "Content-Type": "application/json", // set content type for JSON body
          },
          body: JSON.stringify({ comment }),
        };
      },
    }),
  }),
});

export const { useGetVideoCommentsQuery, useAddCommentMutation } = commentApiSlice;
