import { Button } from "../ui/button";

const Events = () => {
    return (
        <section className="bg-gray-100 py-8">
            <div className="container mx-auto text-center">
                <h2 className="text-3xl font-bold mb-6">Upcoming Events</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <h3 className="text-xl font-bold mb-4">Football Match</h3>
                        <p className="mb-4">Join our local football match this Friday.</p>
                        <Button className="bg-red-500 hover:bg-red-700">Book Now</Button>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <h3 className="text-xl font-bold mb-4">Dawah Seminar</h3>
                        <p className="mb-4">Attend our Dawah seminar on the importance of brotherhood.</p>
                        <Button className="bg-blue-500 hover:bg-blue-700">Register</Button>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <h3 className="text-xl font-bold mb-4">Fitness Bootcamp</h3>
                        <p className="mb-4">Sign up for our fitness bootcamp next weekend.</p>
                        <Button className="bg-green-500 hover:bg-green-700">Join Now</Button>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Events;