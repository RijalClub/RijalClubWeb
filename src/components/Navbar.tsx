import { useState } from "react";
import {Bars3Icon, XMarkIcon} from "@heroicons/react/24/solid"; // Make sure to install Heroicons
import { Link } from "react-router-dom";

const Navbar = () => {
    const [isOpen, setIsOpen] = useState(false);

    const toggleMenu = () => {
        setIsOpen(!isOpen);
    };

    return (
        <nav className="bg-black text-white px-8 py-4">
            <div className="flex justify-between items-center">
                <Link to="/"><h1 className="text-xl font-bold">RIJAL</h1></Link>
                <div className="hidden md:flex space-x-6">
                    <Link to="/events" className="hover:text-gray-300">Events</Link>
                    <Link to="/football" className="hover:text-gray-300">Football</Link>
                    <Link to="/fitness" className="hover:text-gray-300">Fitness</Link>
                    <Link to="/profile" className="hover:text-gray-300">Profile</Link>
                </div>
                <div className="md:hidden">
                    <button onClick={toggleMenu}>
                        {isOpen ? (
                            <XMarkIcon className="w-6 h-6 text-white"/>
                        ) : (
                            <Bars3Icon className="w-6 h-6 text-white"/>
                        )}
                    </button>
                </div>
            </div>
            {isOpen && (
                <ul className="md:hidden mt-4 space-y-2">
                    <li><Link to="/events" className="block text-white hover:bg-gray-800 px-3 py-2">Events</Link></li>
                    <li><Link to="/football" className="block text-white hover:bg-gray-800 px-3 py-2">Football</Link></li>
                    <li><Link to="/fitness" className="block text-white hover:bg-gray-800 px-3 py-2">Fitness</Link></li>
                    <li><Link to="/profile" className="block text-white hover:bg-gray-800 px-3 py-2">Profile</Link></li>
                </ul>
            )}
        </nav>
    );
};

export default Navbar;