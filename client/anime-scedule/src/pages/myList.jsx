import { useEffect } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchMyList } from "../features/anime/animeSlice";

function Mylist() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { myList: lists, loading, error } = useSelector((s) => s.anime);

  useEffect(() => {
    dispatch(fetchMyList());
  }, [dispatch]);

  function getStatusStyle(status) {
    switch (status) {
      case "watching":
      case "Watching":
        return "text-blue-500 border-blue-500";
      case "planned":
      case "Planned":
        return "text-yellow-700 border-yellow-700";
      case "completed":
      case "Completed":
        return "text-green-500 border-green-500";
      default:
        return "text-gray-500 border-gray-500";
    }
  }

  const accessToken = localStorage.getItem("access_token");
  if (!accessToken) {
    return <Navigate to="/login" />;
  }

  return (
    <div className="bg-blue-50 min-h-screen p-8">
      <h1 className="text-center text-3xl font-bold text-blue-600 mb-8">
        MyList
      </h1>

      {loading && <div className="text-center">Loading...</div>}
      {error && <div className="text-center text-red-600 mb-4">{error}</div>}

      <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
        {lists &&
          lists.map((item) => (
            <div
              key={item.id}
              onClick={() => navigate(`/mylist/${item.id}`)}
              className="relative flex items-center gap-4 bg-white p-4 rounded-xl shadow-md hover:shadow-lg transition transform hover:scale-105 cursor-pointer"
            >
              <span
                className={`absolute top-2 right-2 px-3 py-1 text-sm font-semibold rounded-full border ${getStatusStyle(
                  item.status
                )}`}
              >
                {item.status}
              </span>
              <img
                src={
                  (item.Anime && item.Anime.image_url) ||
                  "https://via.placeholder.com/100x140"
                }
                alt={(item.Anime && item.Anime.title) || "-"}
                className="w-20 h-28 object-cover rounded-md shadow"
              />
              <div>
                <h2 className="text-lg font-bold text-blue-600">
                  {item.Anime ? item.Anime.title : "Untitled"}
                </h2>
                <p className="text-gray-600 text-sm">
                  {item.Anime ? item.Anime.genres : ""}
                </p>
              </div>
            </div>
          ))}
        {lists.length === 0 && !loading && !error && (
          <div className="text-center col-span-full">Your list is empty.</div>
        )}
      </div>
    </div>
  );
}

export default Mylist;
