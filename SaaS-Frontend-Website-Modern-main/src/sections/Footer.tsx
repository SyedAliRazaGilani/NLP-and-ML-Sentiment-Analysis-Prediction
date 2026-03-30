import Image from "next/image";
import logo from "@/assets/logosaas.png";
import SocialLinkedIn from "@/assets/social-linkedin.svg";

const GithubIcon = (props: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={props.className}>
    <path d="M12 .5C5.73.5.75 5.64.75 12c0 5.1 3.29 9.42 7.86 10.95.58.12.79-.26.79-.57v-2.04c-3.2.71-3.87-1.58-3.87-1.58-.52-1.35-1.27-1.71-1.27-1.71-1.04-.73.08-.72.08-.72 1.15.08 1.76 1.2 1.76 1.2 1.02 1.78 2.67 1.26 3.33.96.1-.76.4-1.26.73-1.55-2.55-.3-5.23-1.3-5.23-5.8 0-1.28.44-2.33 1.17-3.15-.12-.3-.51-1.52.11-3.17 0 0 .96-.31 3.14 1.2a10.7 10.7 0 0 1 2.86-.39c.97 0 1.95.13 2.86.39 2.18-1.51 3.13-1.2 3.13-1.2.62 1.65.23 2.87.11 3.17.73.82 1.17 1.87 1.17 3.15 0 4.51-2.69 5.5-5.25 5.79.41.37.78 1.1.78 2.22v3.29c0 .31.21.7.8.57A11.28 11.28 0 0 0 23.25 12C23.25 5.64 18.27.5 12 .5Z" />
  </svg>
);

const GlobeIcon = (props: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" className={props.className}>
    <circle cx="12" cy="12" r="10" />
    <path d="M2 12h20" />
    <path d="M12 2a15.3 15.3 0 0 1 0 20" />
    <path d="M12 2a15.3 15.3 0 0 0 0 20" />
  </svg>
);

const MailIcon = (props: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" className={props.className}>
    <path d="M4 4h16v16H4z" />
    <path d="m22 6-10 7L2 6" />
  </svg>
);

export const Footer = () => {
  const scrollToId = (id: string) => {
    const el = typeof document !== "undefined" ? document.getElementById(id) : null;
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <footer className="bg-black text-[#BCBCBC] text-sm py-10 text-center">
      <div className="container">
        <div className="inline-flex relative before:content-[''] before:top-2 before:bottom-0 before:w-full before:blur before:bg-[linear-gradient(to_right,#F87BFF,#FB92CF,#FFDD9B,#C2F0B1,#2FD8FE)] before:absolute">
          <Image src={logo} height={40} alt="SaaS logo" className="relative" />
        </div>
        <nav className="flex flex-col md:flex-row md:justify-center gap-6 mt-6">
          <button className="hover:text-white" onClick={() => scrollToId("features")}>Features</button>
          <button className="hover:text-white" onClick={() => scrollToId("demo")}>Demo</button>
          <button className="hover:text-white" onClick={() => scrollToId("architecture")}>Architecture</button>
          <button className="hover:text-white" onClick={() => scrollToId("cta")}>Contact</button>
        </nav>
        <div className="flex justify-center gap-6 mt-6">
          <a
            href="https://www.linkedin.com/in/sarg9/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="LinkedIn"
            className="text-[#BCBCBC] hover:text-white transition"
          >
            <SocialLinkedIn className="h-6 w-6" />
          </a>
          <a
            href="https://github.com/SyedAliRazaGilani"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub"
            className="text-[#BCBCBC] hover:text-white transition"
          >
            <GithubIcon className="h-6 w-6" />
          </a>
          <a
            href="https://aligilani.com"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Portfolio website"
            className="text-[#BCBCBC] hover:text-white transition"
          >
            <GlobeIcon className="h-6 w-6" />
          </a>
          <a
            href="mailto:contact@aligilani.com"
            aria-label="Email"
            className="text-[#BCBCBC] hover:text-white transition"
          >
            <MailIcon className="h-6 w-6" />
          </a>
        </div>
        <p className="mt-6">
          &copy; {new Date().getFullYear()} Ali Gilani. All rights reserved.
        </p>
      </div>
    </footer>
  );
};
