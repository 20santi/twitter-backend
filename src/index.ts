import * as dotenv from "dotenv";
import { apolloServer } from "./app";

dotenv.config();

async function init() {
    const app = await apolloServer();
    app.listen(8000, () => console.log("Server started at PORT 8000"));
}

init();