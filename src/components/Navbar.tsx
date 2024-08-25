import React from "react";

const Navbar = () => {
  return (
    <nav className="bg-black text-white px-8 py-4 flex justify-between items-center">
      <h1 className="text-xl font-bold">RIJAL</h1>
      <ul className="flex space-x-4">
        <li><a href="#" className="hover:text-gray-300">Home</a></li>
        <li><a href="#" className="hover:text-gray-300">Events</a></li>
        <li><a href="#" className="hover:text-gray-300">Rijal Clothing</a></li>
        <li><a href="#" className="hover:text-gray-300">Our Work</a></li>
        <li><a href="#" className="hover:text-gray-300">Get Involved</a></li>
        <li><a href="#" className="hover:text-gray-300">Blog</a></li>
      </ul>
    </nav>
  );
};

export default Navbar;