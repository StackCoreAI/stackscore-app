import React from "react";
import { createRoot } from "react-dom/client";
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";

import Hero from "./pages/Hero.jsx";
import Wizard from "./pages/Wizard.jsx";
import Preview from "./pages/Preview.jsx";

const router = createBrowserRouter([
  { path: "/", element: <Hero /> },
  { path: "/wizard", element: <Wizard /> },
  { path: "/preview", element: <Preview /> },
]);

const root = createRoot(document.getElementById("root"));
root.render(<RouterProvider router={router} />);
