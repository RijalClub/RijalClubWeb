const Footer = () => {
    const currentYear = new Date().getFullYear();
    return (
        <footer className="bg-black text-white text-center py-4">
            <p>&copy; {currentYear} Rijal Club. All rights reserved.</p>
        </footer>
    );
};

export default Footer;