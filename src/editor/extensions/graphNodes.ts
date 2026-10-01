import CartesianPlaneView, { describeCartesianPlane } from "../../graphs/CartesianPlaneView";
import FunctionPlotView, { describeFunctionPlot } from "../../graphs/FunctionPlotView";
import StatChartView, { describeStatChart } from "../../graphs/StatChartView";
import { createGraphNode } from "../../graphs/graphNode";

export const FunctionPlot = createGraphNode({
  name: "functionPlot",
  attributes: { functions: [""], xMin: "-10", xMax: "10", yMin: "-10", yMax: "10" },
  view: FunctionPlotView,
  describe: describeFunctionPlot,
});

export const CartesianPlane = createGraphNode({
  name: "cartesianPlane",
  attributes: { points: [], shapes: [] },
  view: CartesianPlaneView,
  describe: describeCartesianPlane,
});

const EMPTY_ROWS = Array.from({ length: 4 }, () => ({ label: "", value: "" }));

export const StatChart = createGraphNode({
  name: "statChart",
  attributes: { title: "", chartType: "bar", rows: EMPTY_ROWS },
  view: StatChartView,
  describe: describeStatChart,
});
