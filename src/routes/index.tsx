import { createFileRoute } from "@tanstack/react-router";
import { Board } from "@/components/ink/Board";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Inkwell — Infinite Canvas Notes" },
      {
        name: "description",
        content:
          "A fast, beautiful handwriting app: infinite canvas, pressure pen, eraser, lasso, rich colors and custom gradients.",
      },
      { property: "og:title", content: "Inkwell — Infinite Canvas Notes" },
      {
        property: "og:description",
        content:
          "Sketch and take notes on an infinite canvas with pen, eraser, lasso and custom gradient inks.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return <Board />;
}
