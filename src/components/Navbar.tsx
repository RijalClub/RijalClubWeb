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
                <div className="md:hidden">
                    <button onClick={toggleMenu}>
                        {isOpen ? (
                            <XMarkIcon className="w-6 h-6 text-white" />
                        ) : (
                            <Bars3Icon className="w-6 h-6 text-white" />
                        )}
                    </button>
                </div>
                <ul className="hidden md:flex space-x-4">
                    <li><a href="#" className="hover:text-gray-300">Home</a></li>
                    <li><a href="#" className="hover:text-gray-300">Events</a></li>
                    <li><a href="#" className="hover:text-gray-300">Rijal Clothing</a></li>
                    <li><a href="#" className="hover:text-gray-300">Our Work</a></li>
                    <li><a href="#" className="hover:text-gray-300">Get Involved</a></li>
                    <li><a href="#" className="hover:text-gray-300">Blog</a></li>
                </ul>
            </div>
            {isOpen && (
                <ul className="md:hidden mt-4 space-y-2">
                    <li><a href="#" className="block text-white hover:bg-gray-800 px-3 py-2">Home</a></li>
                    <li><a href="#" className="block text-white hover:bg-gray-800 px-3 py-2">Events</a></li>
                    <li><a href="#" className="block text-white hover:bg-gray-800 px-3 py-2">Rijal Clothing</a></li>
                    <li><a href="#" className="block text-white hover:bg-gray-800 px-3 py-2">Our Work</a></li>
                    <li><a href="#" className="block text-white hover:bg-gray-800 px-3 py-2">Get Involved</a></li>
                    <li><a href="#" className="block text-white hover:bg-gray-800 px-3 py-2">Blog</a></li>
                </ul>
            )}
        </nav>
    );
};

export default Navbar;