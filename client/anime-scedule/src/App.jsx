import "./App.css";
import { BrowserRouter, Outlet, Route, Routes } from "react-router";
import Login from "./pages/login";
import Register from "./pages/register";
import Navbar from "./components/navbar";
import SideBar from "./components/sideBar";
import AnimeList from "./pages/animeList";
import AnimeDetail from "./pages/animeDetail";
import MyList from "./pages/myList";
import MyListById from "./pages/MylistDetail";
import LandingPage from "./pages/landing";
import { Provider } from "react-redux";
import { store } from "./store";

function App() {
  const Layout = () => {
    return (
      <div className="flex h-screen bg-blue-50">
        {/* Sidebar fix kiri */}
        <div className="w-64 flex-shrink-0">
          <SideBar />
        </div>

        {/* Konten kanan */}
        <main className="flex-1 p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    );
  };

  return (
    <Provider store={store}>
      <BrowserRouter>
        <Routes>
          {/* Halaman tanpa Sidebar */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route
            element={
              <div>
                <Navbar />
                <Outlet />
              </div>
            }
          >
            {/* Layout dengan Sidebar */}
            <Route element={<Layout />}>
              <Route path="/animeList" element={<AnimeList />} />
              <Route path="/myList" element={<MyList />} />
              {/* nanti tambahin route lain di sini */}
            </Route>
            <Route path="/" element={<LandingPage />} />
            <Route path="/animeList/:id" element={<AnimeDetail />} />
            <Route path="/myList/:id" element={<MyListById />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </Provider>
  );
}

export default App;
