import { type Document, type Model, Schema, model, models } from "mongoose";

export type AlertType = "upper" | "lower";
export type AlertFrequency = "once" | "hourly" | "daily";

export interface AlertItem extends Document {
  userId: string;
  userEmail: string;
  symbol: string;
  company: string;
  alertName: string;
  alertType: AlertType;
  threshold: number;
  frequency: AlertFrequency;
  isActive: boolean;
  lastTriggeredAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const alertSchema = new Schema<AlertItem>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    userEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    symbol: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    company: {
      type: String,
      required: true,
      trim: true,
    },
    alertName: {
      type: String,
      required: true,
      trim: true,
    },
    alertType: {
      type: String,
      enum: ["upper", "lower"],
      required: true,
    },
    threshold: {
      type: Number,
      required: true,
      min: 0,
    },
    frequency: {
      type: String,
      enum: ["once", "hourly", "daily"],
      default: "once",
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    lastTriggeredAt: {
      type: Date,
      default: null,
    },
  },
  { versionKey: false, timestamps: true },
);

alertSchema.index({ userId: 1, symbol: 1, alertName: 1 }, { unique: true });
alertSchema.index({ isActive: 1, symbol: 1 });

const AlertModel: Model<AlertItem> =
  (models?.Alert as Model<AlertItem>) ||
  model<AlertItem>("Alert", alertSchema);

export default AlertModel;
