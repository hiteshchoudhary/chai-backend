import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

type SideBarProviderProps = {
  children: ReactNode;
};

interface SideBarContextType {
  isLargeOpen: boolean;
  isSmallOpen: boolean;
  toggle: () => void;
  close: () => void;
  isVideoPlaying?: boolean;
  setIsVideoPlaying?: (playing: boolean) => void;
}

const SideBarContext = createContext<SideBarContextType | null>(null);

export function useSideBarContext() {
  const value = useContext(SideBarContext);

  if (value == null) throw new Error("Cannot use outside of SideBarProvider");

  return value;
}

const SideBarProvider = ({ children }: SideBarProviderProps) => {
  const [isLargeOpen, setIsLargeOpen] = useState(false);
  const [isSmallOpen, setIsSmallOpen] = useState(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);


  useEffect(() => {
    const handler = () => {
      if (!isSmallScreen()) setIsSmallOpen(false);
    };

    window.addEventListener("resize", handler);

    return () => {
      window.removeEventListener("resize", handler);
    };
  }, []);

  function isSmallScreen() {
    return window.innerWidth < 1024;
  }

  function toggle() {
    if (isSmallScreen()) {
      setIsSmallOpen((s) => !s);
    } else {
      setIsLargeOpen((l) => !l);
    }
  }

  function close() {
    if (isSmallScreen()) {
      setIsSmallOpen(false);
    } else {
      setIsLargeOpen(false);
    }
  }

  return (
    <SideBarContext.Provider
      value={{
        isLargeOpen,
        isSmallOpen,
        toggle,
        close,
        isVideoPlaying,
        setIsVideoPlaying,
      }}
    >
      {children}
    </SideBarContext.Provider>
  );
};

export default SideBarProvider;
