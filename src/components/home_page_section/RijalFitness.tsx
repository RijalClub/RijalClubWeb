import { Button } from "../ui/button";

const RijalFitness = () => {
    return (
        <section className="bg-gray-100 py-8">
            <div className="container mx-auto text-center">
                <h2 className="text-3xl font-bold mb-6">Rijal Fitness</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <h3 className="text-xl font-bold mb-4">Strength & Conditioning</h3>
                        <p className="mb-4">Join our strength and conditioning sessions.</p>
                        <Button className="bg-red-500 hover:bg-red-700">Join Now</Button>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <h3 className="text-xl font-bold mb-4">Boxing</h3>
                        <p className="mb-4">Improve your boxing skills with our experts.</p>
                        <Button className="bg-blue-500 hover:bg-blue-700">Book Session</Button>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <h3 className="text-xl font-bold mb-4">Calisthenics</h3>
                        <p className="mb-4">Join our calisthenics community and build your strength.</p>
                        <Button className="bg-green-500 hover:bg-green-700">Start Training</Button>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default RijalFitness;