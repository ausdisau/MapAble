import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

if (localStorage.getItem("easy-read") === "true") {
  document.documentElement.classList.add("easy-read");
}
if (localStorage.getItem("high-contrast") === "true") {
  document.documentElement.classList.add("high-contrast");
}
if (localStorage.getItem("screen-reader-optimized") === "true") {
  document.documentElement.classList.add("screen-reader-optimized");
}

createRoot(document.getElementById("root")!).render(<App />);
