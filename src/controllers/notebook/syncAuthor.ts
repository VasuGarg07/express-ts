import User from "../../models/userModel";
import { Author } from "../../models/notebookModel";

export const syncAuthors = async () => {
    try {
        const users = await User.find();

        for (const user of users) {
            const existing = await Author.findOne({ userId: user._id });
            if (!existing) {
                await Author.create({
                    userId: user._id,
                    name: user.username || "Anonymous",
                    avatar: `https://api.dicebear.com/6.x/initials/svg?seed=${user.username || "Anonymous"}`
                });
                console.log(`Created author for ${user._id}`);
            }
        }

        console.log("Sync complete.");
    } catch (error) {
        console.error("Error during sync:", error);
    }
};

