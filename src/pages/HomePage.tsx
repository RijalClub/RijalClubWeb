import Navbar from "../components/Navbar";
import HeroSection from "../components/HeroSection";
import PrayerTimesComponent from "../components/PrayerTimes"; // Adjust the path as needed
import Footer from "../components/Footer";

const HomePage = () => {
    return (
        <div className="flex flex-col min-h-screen">
            <Navbar />
            <div className="flex-grow">
                <div className="container mx-auto p-4">
                    <PrayerTimesComponent/>
                </div>
                <HeroSection/>
            </div>
            <Footer/>
        </div>
    );
};

export default HomePage;