// import { desktop } from "./terminator/desktop";
// import * as Terminator from "@mediar-ai/terminator";
// import { writeFile } from "node:fs/promises";
// import { clickAtBounds } from "./terminator/mouse";

// const application = await desktop.getCurrentApplication();

// const tree = desktop.getWindowTreeResult(application.processName(), undefined, {
//   formatOutput: true,
//   propertyMode: Terminator.PropertyLoadingMode.Complete,
//   treeOutputFormat: Terminator.TreeOutputFormat.CompactYaml,
// });

// await writeFile("tree.txt", tree.formatted as string, "utf-8");

// await clickAtBounds({
//   x: 9,
//   y: 266,
//   width: 47,
//   height: 47,
// });

// const errorLensElement = await application
//   .locator(`role:Text|name:Error Lens`)
//   .first(2000);

// const errorLensElementBounds = errorLensElement.bounds();

// console.log(errorLensElementBounds);

// await clickAtBounds({
//   x: errorLensElementBounds.x,
//   y: errorLensElementBounds.y,
//   width: errorLensElementBounds.width,
//   height: errorLensElementBounds.height,
// });

// await clickAtBounds({
//   x: 911,
//   y: 224,
//   width: 67,
//   height: 31,
// });
