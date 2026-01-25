import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Minyan Now",
    short_name: "Minyan Now",
    description: "Find nearby minyanim or start a pop-up space fast.",
    start_url: "/",
    display: "standalone",
    background_color: "#0d1117",
    theme_color: "#58a6ff",
    orientation: "portrait",
    categories: ["lifestyle", "social"],
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
