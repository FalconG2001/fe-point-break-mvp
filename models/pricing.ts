// models/Pricing.ts
import { Schema, model, models } from "mongoose";

const pricingSchema = new Schema({
  userType: {
    type: String,
    enum: ["normal", "college", "school"],
    required: true,
  },
  groupRange: {
    type: String, // '1', '2+', '4+', '2-6'
    required: true,
  },
  sameConsole: { type: Boolean, required: true },
  pricingType: {
    type: String,
    enum: ["per_person", "fixed_total"],
    required: true,
  },
  price: { type: Number, required: true },
});

export default models.Pricing || model("Pricing", pricingSchema);
