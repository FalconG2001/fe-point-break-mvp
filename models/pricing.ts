import { Schema, model, models } from "mongoose";

export type PricingUserType = "normal" | "college" | "school"; // student = college/school
export type PricingCategory = "session" | "console_rent";
export type PricingType = "per_person" | "fixed_total";

const pricingSchema = new Schema(
  {
    userType: {
      type: String,
      enum: ["normal", "college", "school"],
      required: true,
      index: true,
    },

    category: {
      type: String,
      enum: ["session", "console_rent"],
      required: true,
      index: true,
    },

    durationMinutes: {
      type: Number,
      enum: [30, 60, 90, 120, 150, 180],
      required: true,
      index: true,
    },

    minPlayers: { type: Number, required: true },
    maxPlayers: { type: Number, required: true },

    pricingType: {
      type: String,
      enum: ["per_person", "fixed_total"],
      required: true,
    },

    price: { type: Number, required: true, min: 0 },
  },
  { timestamps: true },
);

// Prevent duplicates
pricingSchema.index(
  {
    userType: 1,
    category: 1,
    durationMinutes: 1,
    minPlayers: 1,
    maxPlayers: 1,
  },
  { unique: true },
);

export default models.Pricing || model("Pricing", pricingSchema);
