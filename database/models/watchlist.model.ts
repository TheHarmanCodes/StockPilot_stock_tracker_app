import { type Document, type Model, Schema, model, models } from "mongoose";

export interface WatchlistItem extends Document {
  userId: string;
  symbol: string;
  company: string;
  addedAt: Date;
}

const watchlistSchema = new Schema<WatchlistItem>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    symbol: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    company: {
      type: String,
      required: true,
      trim: true,
    },
    addedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { versionKey: false, timestamps: false },
);

// Preventing duplicate symbols per user
watchlistSchema.index({ userId: 1, symbol: 1 }, { unique: true });

const Watchlist: Model<WatchlistItem> =
  (models?.Watchlist as Model<WatchlistItem>) ||
  model<WatchlistItem>("Watchlist", watchlistSchema);

export default Watchlist;
