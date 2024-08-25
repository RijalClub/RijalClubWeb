import Navbar from "../components/Navbar"; // Import the Navbar
import Footer from "../components/Footer"; // Import the Footer
import { Button } from "../components/ui/button"; // Import Button from ShadCN

const fitnessPrograms = [
  {
    id: 1,
    title: "Strength & Conditioning",
    schedule: "Mondays & Wednesdays: 6:00 AM - 7:00 AM",
    description: "Improve your overall strength and endurance with our structured Strength & Conditioning program. Suitable for all fitness levels.",
  },
  {
    id: 2,
    title: "Boxing Classes",
    schedule: "Tuesdays & Thursdays: 5:00 PM - 6:00 PM",
    description: "Join our boxing classes to learn the fundamentals, improve your technique, and get a full-body workout. Open to all experience levels.",
  },
  {
    id: 3,
    title: "Calisthenics",
    schedule: "Saturdays: 8:00 AM - 9:00 AM",
    description: "Build strength and flexibility with bodyweight exercises. Perfect for those who want to improve their fitness without using heavy equipment.",
  },
];

const FitnessPage = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <div className="container mx-auto p-4 flex-grow">
        <h1 className="text-3xl font-bold mb-6">Fitness Sessions</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {fitnessPrograms.map((program) => (
            <div key={program.id} className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-bold mb-2">{program.title}</h2>
              <p className="text-gray-600 mb-2">{program.schedule}</p>
              <p className="text-gray-700 mb-4">{program.description}</p>
              <Button className="bg-blue-500 hover:bg-blue-700">
                Join Session
              </Button>
            </div>
          ))}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default FitnessPage;