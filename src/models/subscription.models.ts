import { Document, Schema, model } from "mongoose";

interface ISubscription extends Document {
  subscriber: Schema.Types.ObjectId;
  channel: Schema.Types.ObjectId;
}

const subscriptionSchema = new Schema<ISubscription>(
  {
    subscriber: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    channel: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

export const Subscription = model<ISubscription>(
  "Subscription",
  subscriptionSchema
);
