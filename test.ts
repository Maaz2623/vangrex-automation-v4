import { desktop } from "./src/terminator/desktop";

// Text|Color Highlight|N/A|N/A

const app = await desktop.getCurrentApplication();

const element = await desktop
  .locator(`role:TabItem|name:Extensions`)
  .first(2000);

const bounds = element.bounds();

console.log(bounds);
