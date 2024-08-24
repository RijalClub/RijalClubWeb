import React from "react";
import { Button } from "./ui/button"

const HeroSection = () => {
  return (
    <div className="relative bg-cover bg-center h-[70vh] flex items-center justify-center text-white" style={{ backgroundImage: "url('/path/to/your/image.jpg')" }}>
      <div className="absolute inset-0 bg-black opacity-50"></div>
      <div className="relative z-10 text-center">
        <h2 className="text-4xl font-bold mb-4">Paintballing</h2>
        <p className="mb-8">Join The Rijal Club's Paintball Event</p>
        <Button className="bg-red-500 hover:bg-red-700">Buy Tickets</Button>
      </div>
    </div>
  );
};

export default HeroSection;