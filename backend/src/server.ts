import { config } from "./config";
import { createApp } from "./app";

const app = createApp();

app.listen(config.port, () => {
  console.log(`life-rpg-backend listening on :${config.port} (${config.nodeEnv})`);
});
