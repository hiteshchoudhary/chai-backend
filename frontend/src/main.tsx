import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";

import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Home from "./pages/HomePage.tsx";

import { store } from "./app/store.ts";
import { Provider } from "react-redux";
import RegisterForm from "./components/RegisterForm.tsx";
import LoginForm from "./components/LoginForm.tsx";
import Layout from "./Layout.tsx";
import VideoPlayerPage from "./pages/VideoPlayerPage.tsx";
import SelectPlaylistsPage from "./pages/SelectPlaylistsPage.tsx";

const router = createBrowserRouter([
  {
    path: "/register",
    element: <RegisterForm />
  },
  {
    path: "/login",
    element: <LoginForm />
  },
  {
    path: "/",
    element: <Layout />,
    children: [
      { 
        path: "",
        element: <Home />
      },
      {
        path: "playlist",
        element: <SelectPlaylistsPage />
      }
    ]
  },
  {
    path: "watch",
    element: <VideoPlayerPage />
  }
]);

createRoot(document.getElementById("root")!).render(
  <Provider store={store}>
    <App>
      <RouterProvider router={router} />
    </App>
  </Provider>
);
