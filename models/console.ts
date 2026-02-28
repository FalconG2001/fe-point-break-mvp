import mongoose, { Schema, Document } from "mongoose";

export interface IConsole extends Document {
  consoleId: "xbox_one_s" | "ps5" | "xbox_series_x" | "xbox_360";
  name: string;
  type: "Xbox" | "PlayStation";
  imgSrc?: string;
}

const ConsoleSchema = new Schema<IConsole>(
  {
    consoleId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    type: { type: String, enum: ["Xbox", "PlayStation"], required: true },
    imgSrc: { type: String },
  },
  { timestamps: true },
);

export default mongoose.models.Console ||
  mongoose.model<IConsole>("Console", ConsoleSchema);
