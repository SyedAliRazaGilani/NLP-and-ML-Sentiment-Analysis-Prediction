"use client"
import { useState } from "react";
import ArrowRight from "@/assets/arrow-right.svg";
import Logo from "@/assets/logosaas.png";
import Image from "next/image";
import MenuIcon from "@/assets/menu.svg";

export const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const scrollToId = (id: string) => {
    const el = typeof document !== "undefined" ? document.getElementById(id) : null;
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
    setIsMenuOpen(false);
  };

  return (
    <header className={`sticky top-0 ${
        isMenuOpen ? "backdrop-blur-lg" : "backdrop-blur-sm"
      } z-20 transition-all duration-300`}
    >
      {/* Announcement Bar */}
      <div className="flex justify-center items-center py-3 bg-black text-white text-sm gap-3">
        <p>Know your customers—automate sentiment insights from reviews in seconds</p>
        <button
          type="button"
          onClick={() => scrollToId("demo")}
          className="inline-flex gap-1 items-center hover:text-white/90"
          aria-label="Scroll to demo section"
        >
          <p className="text-white/60 hidden md:block">Try the live demo</p>
          <ArrowRight className="h-4 w-4 inline-flex justify-center items-center" />
        </button>
      </div>

      {/* Navbar */}
      <div className="py-5">
        <div className="container">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <button onClick={() => scrollToId("home")} className="cursor-pointer" aria-label="Go to top">
              <Image src={Logo} alt="Saas Logo" height={40} width={40} />
            </button>

            {/* Hamburger Menu Icon */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden focus:outline-none"
            >
              <MenuIcon className="h-8 w-8" />
            </button>

            {/* Desktop Nav */}
            <nav className="hidden md:flex gap-6 text-black/60 items-center">
              <button className="hover:text-black" onClick={() => scrollToId("features")}>Features</button>
              <button className="hover:text-black" onClick={() => scrollToId("architecture")}>Architecture</button>
              <button className="hover:text-black" onClick={() => scrollToId("cta")}>Contact</button>
              <button
                className="bg-black text-white px-4 py-2 rounded-lg font-medium inline-flex align-items justify-center tracking-tight"
                onClick={() => scrollToId("demo")}
              >
                Demo
              </button>
            </nav>
          </div>

          {/* Mobile Nav */}
          {isMenuOpen && (
            <nav className="justify-center items-center flex flex-col mt-4 gap-4 text-black/80 md:hidden">
              <button className="hover:text-black" onClick={() => scrollToId("features")}>Features</button>
              <button className="hover:text-black" onClick={() => scrollToId("architecture")}>Architecture</button>
              <button className="hover:text-black" onClick={() => scrollToId("cta")}>Contact</button>
              <button
                className="bg-black text-white px-4 py-2 rounded-lg font-medium inline-flex align-items justify-center tracking-tight"
                onClick={() => scrollToId("demo")}
              >
                Demo
              </button>
            </nav>
          )}
        </div>
      </div>
    </header>
  );
};
