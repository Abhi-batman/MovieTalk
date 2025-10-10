import mongoose, { Schema } from "mongoose";

const userSchema = new Schema(
  {
    username: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    fullname: {
      type: string,
      required: true,
      index: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is needed"],
    },
    posts: [
      {
        type: Schema.Types.ObjectId,
        ref: "Post",
      },
    ],
    email: {
      type: String,
      required: true,
      unique: true,
      trime: true,
      lowercase: true,
    },
    profile: {
      type: string,
      required: true, //will add a default dp
    },
  },
  { timestamps: true }
);

export const User = mongoose.model("User", userSchema);
