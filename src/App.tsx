import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import HomePage from "./pages/HomePage";
import FootballPage from "./pages/FootballPage";
import EventsPage from "./pages/EventsPage";
import FitnessPage from "./pages/FitnessPage";
import ProfilePage from "./pages/ProfilePage";

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/events" element={<EventsPage />} />
        <Route path="/football" element={<FootballPage />} />
        <Route path="/fitness" element={<FitnessPage />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Routes>
    </Router>
  );
};

export default App;