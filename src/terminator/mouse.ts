import robot from "robotjs";
import * as Terminator from "@mediar-ai/terminator";
import { desktop } from "./desktop";

export const clickAtBounds = async ({
  x,
  y,
  width,
  height,
  xPercentage = 50,
  yPercentage = 50,
  clickType = "left",
  double = false,
}: {
  x: number;
  y: number;
  width: number;
  height: number;
  xPercentage?: number;
  yPercentage?: number;
  clickType: "left" | "right";
  double: boolean;
}) => {
  const app = await desktop.getCurrentApplication();

  const targetX = Math.round(x + (width * xPercentage) / 100);
  const targetY = Math.round(y + (height * yPercentage) / 100);

  robot.setMouseDelay(0);

  // Move the real Windows mouse cursor.
  robot.moveMouseSmooth(targetX, targetY, 0.2);

  // Perform a real mouse click.
  robot.mouseClick(clickType, double);

  return { x: targetX, y: targetY };
};
