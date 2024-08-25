import Navbar from "../components/Navbar";
import PrayerTimesComponent from "../components/PrayerTimes"; // Adjust the path as needed
import Footer from "../components/Footer";
import Events from "@/components/home_page_section/Events.tsx";
import Merchandise from "@/components/home_page_section/Merchandise.tsx";
import RijalFitness from "@/components/home_page_section/RijalFitness.tsx";

const HomePage = () => {
    return (
        <div className="flex flex-col min-h-screen">
            <Navbar/>
            <div className="flex-grow">
                <div className="container mx-auto p-4">
                    <PrayerTimesComponent/>
                </div>
                <Events/>
                <RijalFitness/>
                <Merchandise/>
            </div>
            <Footer/>
        </div>
    );
};

export default HomePage;