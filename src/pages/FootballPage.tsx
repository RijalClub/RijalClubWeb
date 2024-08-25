import Navbar from "../components/Navbar"; // Import the Navbar component
import Footer from "../components/Footer"; // Import the Footer component
import { Button } from "../components/ui/button"; // Import the Button component from ShadCN

const footballEvents = [
  {
    id: 1,
    title: "Friday Night Football Match",
    date: "September 15, 2024",
    time: "8:00 PM - 10:00 PM",
    location: "Rijal Sports Complex",
    price: "$10.00",
    description: "Join us for a competitive football match under the lights. Purchase your spot now!",
  },
  {
    id: 2,
    title: "Weekend Football Tournament",
    date: "September 20-21, 2024",
    time: "10:00 AM - 6:00 PM",
    location: "Rijal Sports Complex",
    price: "$25.00",
    description: "Compete in our weekend tournament with local teams. Register and pay to secure your team's entry.",
  },
  {
    id: 3,
    title: "Youth Football Training Camp",
    date: "September 25, 2024",
    time: "4:00 PM - 6:00 PM",
    location: "Rijal Sports Park",
    price: "$15.00",
    description: "A specialized training camp for youth players aged 12-18. Purchase your ticket to join.",
  },
];
const FootballPage = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <div className="container mx-auto p-4 flex-grow">
        <h1 className="text-3xl font-bold mb-6">Football Events</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {footballEvents.map((event) => (
            <div key={event.id} className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-bold mb-2">{event.title}</h2>
              <p className="text-gray-600 mb-2">{event.date}</p>
              <p className="text-gray-600 mb-2">{event.time}</p>
              <p className="text-gray-600 mb-4">{event.location}</p>
              <p className="text-gray-700 mb-4">{event.description}</p>
              <p className="text-gray-700 font-bold mb-4">{event.price}</p>
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

export default FootballPage;