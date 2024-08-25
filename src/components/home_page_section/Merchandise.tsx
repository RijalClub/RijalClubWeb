import { Button } from "../ui/button";

const MerchandiseSection = () => {
    return (
        <section className="bg-gray-100 py-8">
            <div className="container mx-auto text-center">
                <h2 className="text-3xl font-bold mb-6">Rijal Merchandise</h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <img src="https://jeanjunction.com/cdn/shop/products/frontchest_720x@2x.jpg?v=1682941877" alt="Item 1" className="mb-4"/>
                        <h3 className="text-xl font-bold mb-2">Islamic Hoodie</h3>
                        <p className="mb-4">$39.99</p>
                        <Button className="bg-red-500 hover:bg-red-700">Buy Now</Button>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <img src="https://i.etsystatic.com/32955933/r/il/e8ea08/3588836839/il_fullxfull.3588836839_p2gv.jpg" alt="Item 2" className="mb-4"/>
                        <h3 className="text-xl font-bold mb-2">Islamic T-shirt</h3>
                        <p className="mb-4">$19.99</p>
                        <Button className="bg-blue-500 hover:bg-blue-700">Buy Now</Button>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <img src="https://images.sellbrite.com/production/15260/NU-YTXY-K071/0955c7bd-c9cb-526a-b138-439b77600634.jpg" alt="Item 3" className="mb-4"/>
                        <h3 className="text-xl font-bold mb-2">Islamic Cap</h3>
                        <p className="mb-4">$14.99</p>
                        <Button className="bg-green-500 hover:bg-green-700">Buy Now</Button>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default MerchandiseSection;