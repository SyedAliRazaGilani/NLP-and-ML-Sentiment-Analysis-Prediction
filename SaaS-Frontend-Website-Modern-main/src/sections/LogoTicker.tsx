"use client";

const technologies: Array<{ name: string; logo?: string; emoji?: string }> = [
  { name: "Python", logo: "https://cdn.worldvectorlogo.com/logos/python-5.svg" },
  { name: "Flask", logo: "https://cdn.worldvectorlogo.com/logos/flask.svg" },
  { name: "scikit-learn", logo: "https://logo.svgcdn.com/devicon/scikitlearn-original.svg" },
  { name: "XGBoost", logo: "https://latestlogo.com/wp-content/uploads/2025/03/xgboost-logo.svg" },
  { name: "NLTK", emoji: "🧠" },
  { name: "Pandas", logo: "https://cdn.worldvectorlogo.com/logos/pandas.svg" },
  { name: "Next.js", logo: "https://cdn.worldvectorlogo.com/logos/next-js.svg" },
  { name: "Tailwind", logo: "https://cdn.worldvectorlogo.com/logos/tailwindcss.svg" },
  { name: "NLP", emoji: "💬" },
];

export const LogoTicker = () => {
  return (
    <div className="py-8 md:py-12 bg-white">
      <div className="container">
        <div className="flex items-center gap-6">
          <div className="hidden md:block text-base md:text-lg font-semibold text-black/60 tracking-tight">
            Technologies
          </div>
          <div
            className="relative overflow-hidden flex-1"
            style={{
              maskImage: "linear-gradient(90deg, transparent 0%, black 8%, black 92%, transparent 100%)",
              WebkitMaskImage: "linear-gradient(90deg, transparent 0%, black 8%, black 92%, transparent 100%)",
            }}
          >
            <div className="flex gap-16 md:gap-24 whitespace-nowrap items-center animate-marquee w-fit">
              {[...technologies, ...technologies, ...technologies, ...technologies].map((tech, i) => (
                <div key={i} className="flex items-center gap-3 flex-shrink-0">
                  {tech.logo ? (
                    <img
                      src={tech.logo}
                      alt={tech.name}
                      className="h-8 md:h-10 w-auto object-contain opacity-70 hover:opacity-100 transition-opacity"
                      draggable={false}
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  ) : (
                    <span className="h-8 md:h-10 w-8 md:w-10 flex items-center justify-center rounded-lg border border-black/10 bg-white text-lg opacity-80">
                      {tech.emoji || "•"}
                    </span>
                  )}
                  <span className="text-black/60 text-sm md:text-base font-medium">{tech.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
