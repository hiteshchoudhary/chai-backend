import { channel, subscribe } from "diagnostics_channel"
import mongoose, {Schema} from "mongoose"
import mongooseAggregatePaginateV2 from "mongoose-aggregate-paginate-v2"
const subscriptionSchema = new Schema({
    subscriber: {
        type: Schema.Types.ObjectId, // one who is subscribing
        ref: "User"
    },
    channel: {
        type: Schema.Types.ObjectId, // one to whom 'subscriber' is subscribing
        ref: "User"
    }
}, {timestamps: true})

subscriptionSchema.index(
    {subscriber:1,channel:1},
    {unique: true}
)
subscriptionSchema.plugin(mongooseAggregatePaginateV2);
export const Subscription = mongoose.model("Subscription", subscriptionSchema)