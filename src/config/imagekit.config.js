import dotenv from "dotenv";
dotenv.config();

import ImageKit from "@imagekit/nodejs";

const imagekit = new ImageKit({
    privateKey: "private_1shlHLeA4jnKvKNItK4YkySKx6o=",
});

export default imagekit;
