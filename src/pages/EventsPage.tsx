import Navbar from "../components/Navbar"; // Import the Navbar component
import Footer from "../components/Footer"; // Import the Footer component
import { Button } from "../components/ui/button"; // Import the Button component from ShadCN

const events = [
  {
    id: 1,
    title: "Community Football Match",
    date: "September 15, 2024",
    time: "10:00 AM - 12:00 PM",
    location: "Rijal Sports Complex",
    description: "Join us for a fun and competitive football match with the community.",
  },
  {
    id: 2,
    title: "Rijal Dawah Seminar",
    date: "September 20, 2024",
    time: "2:00 PM - 4:00 PM",
    location: "Rijal Community Center",
    description: "Attend our Dawah seminar focused on the importance of brotherhood and community.",
  },
  {
    id: 3,
    title: "Weekend Fitness Bootcamp",
    date: "September 25, 2024",
    time: "6:00 AM - 8:00 AM",
    location: "Rijal Fitness Park",
    description: "Start your weekend with an invigorating fitness bootcamp. All levels are welcome!",
  },
];
const EventsPage = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <div className="container mx-auto p-4 flex-grow">
        <h1 className="text-3xl font-bold mb-6">Upcoming Events</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <div key={event.id} className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-bold mb-2">{event.title}</h2>
              <p className="text-gray-600 mb-2">{event.date}</p>
              <p className="text-gray-600 mb-2">{event.time}</p>
              <p className="text-gray-600 mb-4">{event.location}</p>
              <p className="text-gray-700 mb-4">{event.description}</p>
              <Button className="bg-blue-500 hover:bg-blue-700">
                Register
              </Button>
            </div>
          ))}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default EventsPage;