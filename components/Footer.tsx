import Link from "next/link";

const links = [
  {
    title: "Pricing",
    href: "/pricing",
  },
  {
    title: "Developer GitHub",
    href: "https://github.com/TheHarmanCodes",
  },
  {
    title: "About",
    href: "https://github.com/TheHarmanCodes/StockPilot_stock_tracker_app/blob/main/README.md",
  },
];

const Footer = () => {
  return (
    <footer className="bg-black border-t pt-8">
      <div className="max-w-7xl px-5 mx-auto w-full mb-4">
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row md:gap-8">
          <div className="flex flex-col items-center gap-3 text-center md:flex-row md:text-left">
            <span className="text-muted-foreground text-sm">
              © {new Date().getFullYear()} StockPilot, All rights reserved
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 md:justify-end">
            {links.map((link, index) => (
              <Link
                key={index}
                href={link.href}
                className="text-muted-foreground hover:text-primary text-sm font-medium transition-colors duration-150"
              >
                <p>{link.title}</p>
              </Link>
            ))}
          </div>
        </div>
      </div>
      {/* Large Footer Text */}
      <div className="relative hidden lg:flex justify-center mt-10 overflow-hidden">
        {/* Fade Overlay */}
        <div className="absolute inset-0 bg-linear-to-b from-transparent via-transparent to-background z-10" />

        <h1
          className="text-[11rem] xl:text-[15rem] font-black leading-none text-transparent whitespace-nowrap select-none"
          style={{
            WebkitTextStroke: "2px rgba(241, 181, 24, 0.35)",
          }}
        >
          StockPilot
        </h1>
      </div>
    </footer>
  );
};
export default Footer;
