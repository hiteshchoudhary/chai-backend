import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import LikedVideosPage from "./LikedVideosPage";
import PlaylistsPage from "./PlaylistsPage";

const SelectPlaylistsPage = () => {
  const [searchParams] = useSearchParams();
  const listType = searchParams.get("list");

  const navigate = useNavigate();

  useEffect(() => {
    if (!listType) {
      navigate("/feed/playlists", {
        replace: true,
      });
    }
  }, [listType, navigate]);

  if (!listType) {
    return null;
  }

  switch (listType) {
    case "WL":
      return <p>Soon will be implemented</p>;

    case "LL":
        return <LikedVideosPage />

    default: 
    return <PlaylistsPage listId={listType}/>
  }
};

export default SelectPlaylistsPage;
