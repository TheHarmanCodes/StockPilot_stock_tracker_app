import { type Document, type Model, Schema, model, models } from "mongoose";

export interface EmailSubscriptionDocument extends Document {
  userId: string;
  email: string;
  isSubscribed: boolean;
  source: string;
  subscribedAt: Date | null;
  unsubscribedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// Stores the current daily-news email preference for each user.
const emailSubscriptionSchema = new Schema<EmailSubscriptionDocument>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    isSubscribed: {
      type: Boolean,
      required: true,
      default: true,
    },
    source: {
      type: String,
      required: true,
      trim: true,
      default: "system",
    },
    subscribedAt: {
      type: Date,
      default: Date.now,
    },
    unsubscribedAt: {
      type: Date,
      default: null,
    },
  },
  { versionKey: false, timestamps: true },
);

// One record per user/email keeps subscription lookups straightforward.
emailSubscriptionSchema.index({ userId: 1 }, { unique: true });
emailSubscriptionSchema.index({ email: 1 }, { unique: true });

const EmailSubscription: Model<EmailSubscriptionDocument> =
  (models?.EmailSubscription as Model<EmailSubscriptionDocument>) ||
  model<EmailSubscriptionDocument>(
    "EmailSubscription",
    emailSubscriptionSchema,
  );

export default EmailSubscription;
