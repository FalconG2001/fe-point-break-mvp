import mongoose, { Schema, Document } from "mongoose";

interface ConsoleRef {
  consoleId: string;
  name: string;
  type: "Xbox" | "PlayStation";
}

interface IGame extends Document {
  title: string;
  genre?: string;
  imageUrl: string;
  playableOn: ConsoleRef[];
  installedOn: ConsoleRef[];
  installed: boolean;
  shortDesc: string;
}

const ConsoleRefSchema = new Schema<ConsoleRef>(
  {
    consoleId: { type: String, required: true },
    name: { type: String, required: true },
    type: { type: String, enum: ["Xbox", "PlayStation"], required: true },
  },
  { _id: false },
);

const GameSchema = new Schema<IGame>({
  title: { type: String, required: true },
  genre: { type: String },
  imageUrl: { type: String },
  shortDesc: { type: String },
  playableOn: [ConsoleRefSchema],
  installedOn: [ConsoleRefSchema],
  installed: { type: Boolean, default: false },
});

GameSchema.pre("save", async function (this: IGame) {
  this.installed = this.installedOn && this.installedOn.length > 0;
});

GameSchema.post("findOneAndUpdate", async function (doc: IGame | null) {
  if (!doc) return;

  const isInstalled = doc.installedOn && doc.installedOn.length > 0;

  // Only update if changed
  if (doc.installed !== isInstalled) {
    doc.installed = isInstalled;
    await doc.save(); // Triggers `save` middleware too
  }
});

export default mongoose.models.Game ||
  mongoose.model<IGame>("Game", GameSchema);
