import Navbar from "../components/Navbar"; // Import Navbar
import Footer from "../components/Footer"; // Import Footer
import { Button } from "../components/ui/button"; // Import Button from ShadCN

const user = {
  name: "John Doe",
  email: "john.doe@example.com",
  profilePicture: "https://via.placeholder.com/150", // Placeholder image
  events: [
    { id: 1, title: "Friday Night Football Match", date: "September 15, 2024" },
    { id: 2, title: "Strength & Conditioning", date: "September 20, 2024" },
  ],
};

const ProfilePage = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <div className="container mx-auto p-4 flex-grow">
        <h1 className="text-3xl font-bold mb-6">Profile</h1>
        <div className="flex flex-col md:flex-row md:space-x-6">
          <div className="flex flex-col items-center md:w-1/3">
            <img
              src={user.profilePicture}
              alt="Profile"
              className="w-32 h-32 rounded-full mb-4"
            />
            <h2 className="text-2xl font-bold">{user.name}</h2>
            <p className="text-gray-600">{user.email}</p>
            <Button className="bg-blue-500 hover:bg-blue-700 mt-4">
              Edit Profile
            </Button>
          </div>
          <div className="mt-6 md:mt-0 md:w-2/3">
            <h3 className="text-xl font-bold mb-4">My Events</h3>
            <ul className="space-y-4">
              {user.events.map((event) => (
                <li
                  key={event.id}
                  className="bg-white p-4 rounded-lg shadow-md"
                >
                  <h4 className="text-lg font-bold">{event.title}</h4>
                  <p className="text-gray-600">{event.date}</p>
                  <Button className="bg-gray-300 hover:bg-gray-400 mt-2">
                    View Details
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default ProfilePage;