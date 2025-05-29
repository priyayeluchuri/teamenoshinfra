import Link from 'next/link';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFacebook, faTwitter, faInstagram, faWhatsapp } from "@fortawesome/free-brands-svg-icons";
import { faEnvelope, faPhone } from "@fortawesome/free-solid-svg-icons";

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="bg-gray-900 text-white py-6">
      <div className="container mx-auto flex flex-col md:flex-row justify-between items-center px-6">
        
        {/* Quick Links */}
        <nav className="flex space-x-6">
          <Link href="/" className="hover:text-blue-400">Home</Link>
          <Link href="/about" className="hover:text-blue-400">About</Link>
          <Link href="/services" className="hover:text-blue-400">Services</Link>
        </nav>

        {/* Social Media Links */}
        <div className="flex space-x-4 mt-4 md:mt-0">
          <a href="https://www.facebook.com/enoshinfra" target="_blank" rel="noopener noreferrer">
            <FontAwesomeIcon icon={faFacebook} className="w-6 h-6 hover:text-blue-400" style={{ color: "#1877F2" }} />
          </a>
          <a href="https://www.twitter.com/enoshinfra" target="_blank" rel="noopener noreferrer">
           <FontAwesomeIcon icon={faTwitter} className="w-6 h-6 hover:text-blue-400" style={{ color: "#1DA1F2" }} />
	  </a>
          <a href="https://www.instagram.com/enoshinfra" target="_blank" rel="noopener noreferrer">
           <FontAwesomeIcon icon={faInstagram} className="w-6 h-6 hover:text-pink-500" style={{ color: "#E1306C" }} />
	  </a>
          <a href="mailto:info@enoshinfra.com">
           <FontAwesomeIcon icon={faEnvelope} className="w-6 h-6 hover:text-gray-400" style={{ color: "#FFFFFF" }} />
	  </a>
          <a href="tel:+918073582033">
           <FontAwesomeIcon icon={faPhone} className="w-6 h-6 hover:text-gray-400" style={{ color: "#25D366" }} />
	  </a>
          <a href="https://wa.me/918073582033" target="_blank" rel="noopener noreferrer">
           <FontAwesomeIcon icon={faWhatsapp} className="w-6 h-6 hover:text-green-400" style={{ color: "#25D366" }} />
	  </a>
        </div>
      </div>

      {/* Copyright */}
      <div className="text-center text-sm text-gray-400 mt-4">
         Copyright {year} Enosh Infra. All rights reserved.
      </div>
    </footer>
  );
}