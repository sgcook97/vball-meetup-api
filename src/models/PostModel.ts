import mongoose, { Schema } from "mongoose";

const postSchema = new Schema({
    poster: { 
        posterId: { type: Schema.Types.ObjectId, ref: 'User', required: true }, 
        username: { type: String, required: true }
    },
    title: { type: String, required: true },
    location: { type: String, required: true },
    skillLevel: { type: String, required: true },
    content: { type: String },
    createdAt: { type: Date, default: Date.now },
});

export const Post = mongoose.model('Post', postSchema);