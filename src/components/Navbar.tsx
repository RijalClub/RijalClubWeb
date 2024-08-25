import { useState } from "react";
import {Bars3Icon, XMarkIcon} from "@heroicons/react/24/solid"; // Make sure to install Heroicons

const Navbar = () => {
    const [isOpen, setIsOpen] = useState(false);

    const toggleMenu = () => {
        setIsOpen(!isOpen);
    };

    return (
        <nav className="bg-black text-white px-8 py-4">
            <div className="flex justify-between items-center">
                <h1 className="text-xl font-bold">RIJAL</h1>
                <div className="hidden md:flex space-x-6">
                    <a href="#" className="hover:text-gray-300">Events</a>
                    <a href="#" className="hover:text-gray-300">Rijal Fitness</a>
                    <a href="#" className="hover:text-gray-300">Rijal Islamic</a>
                    <a href="#" className="hover:text-gray-300">Merchandise</a>
                    <a href="#" className="hover:text-gray-300">Profile</a>
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
                    <li><a href="#" className="block text-white hover:bg-gray-800 px-3 py-2">Events</a></li>
                    <li><a href="#" className="block text-white hover:bg-gray-800 px-3 py-2">Rijal Fitness</a></li>
                    <li><a href="#" className="block text-white hover:bg-gray-800 px-3 py-2">Rijal Islamic</a></li>
                    <li><a href="#" className="block text-white hover:bg-gray-800 px-3 py-2">Merchandise</a></li>
                    <li><a href="#" className="block text-white hover:bg-gray-800 px-3 py-2">Profile</a></li>
                </ul>
            )}
        </nav>
    );
};

export default Navbar;