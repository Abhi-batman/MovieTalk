import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const userSchema = new Schema(
  {
    username: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    fullName: {
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
    avatar: {
      type: string,
      required: true, //will add a default dp
    },
    RefreshToken: {
      type: string,
      required: true,
    },
  },
  { timestamps: true }
);

userSchema.pre("save", async (next) => {
  if (!this.isModified(password)) return next();
  this.password = await bcrypt.hash(this.password, 14);
  next();
});

userSchema.methods.passwordCheck = async (password) => {
  return await bcrypt.compare(password, this.password);
};

userSchema.methods.generateAccessToken = async () => {
  return jwt.sign(
    {
      _id: this._id,
      username: this.username,
      email: this.email,
    },
    process.env.ATS,
    { expiresIn: ATE }
  );
};

userSchema.methods.generateRefreshToken = async () => {
  return jwt.sign(
    {
      _id: this._id,
    },
    process.env.RTS,
    { expiresIn: RTE }
  );
};

export const User = mongoose.model("User", userSchema);
