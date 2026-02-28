import mongoose, { Schema, Document } from "mongoose";

export interface IAdminAllowlist extends Document {
  email: string;
}

const AdminAllowlistSchema: Schema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true },
  },
  {
    collection: "admin_allowlist",
  },
);

const AdminAllowlist =
  mongoose.models.AdminAllowlist ||
  mongoose.model<IAdminAllowlist>("AdminAllowlist", AdminAllowlistSchema);

export default AdminAllowlist;
