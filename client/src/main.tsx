import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

if (localStorage.getItem("easy-read") === "true") {
  document.documentElement.classList.add("easy-read");
}

createRoot(document.getElementById("root")!).render(<App />);
