import { ReactNode } from "react";
import SideBarProvider from "./contexts/SideBarContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { ToastContainer, Slide } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';


type AppProps = {
  children: ReactNode;
};

function App({ children }: AppProps) {
  return (
    <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
      <SideBarProvider>
        {children}

        <ToastContainer
          // limit={1}
          position="bottom-left"
          autoClose={2000}
          hideProgressBar
          newestOnTop
          closeOnClick
          pauseOnHover
          theme="dark"
          transition={Slide}
        />

      </SideBarProvider>
    </ThemeProvider>
  );
}

export default App;
