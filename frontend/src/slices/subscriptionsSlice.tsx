import { createSlice, PayloadAction } from "@reduxjs/toolkit";


interface ISubscription {
    _id: string;
    username: string;
    fullname: string;
    avatar: string
}

const initialState: ISubscription[] = []

const subscriptionsSlice = createSlice({
    name: "subscription",
    initialState,
    reducers: {
        saveUserSubscriptions: (_state, action: PayloadAction<ISubscription[]>) => {
            return action.payload;
        }
    }
})

export const {saveUserSubscriptions} = subscriptionsSlice.actions

export default subscriptionsSlice.reducer