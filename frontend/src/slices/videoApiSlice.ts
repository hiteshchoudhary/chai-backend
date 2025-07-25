import { apiSlice } from "./apiSlice";
import { VIDEOS_URL } from "@/constanst";

export const videoApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    //request to backend to get all videos
    getAllVideos: builder.query({
      query: ({ page = 1, limit = 10, query = "" }) => ({
        url: `${VIDEOS_URL}?page=${page}&limit=${limit}&query=${query}&sortBy=createdAt&sortType=desc`,
      }),
    }),
    //request to backend to get video by id
    getVideoById: builder.query({
      query: (videoId) => ({
        url: `${VIDEOS_URL}/${videoId}`,
        method: "GET",
      })
    })
  }),
});


export const { useGetAllVideosQuery, useGetVideoByIdQuery } = videoApiSlice;