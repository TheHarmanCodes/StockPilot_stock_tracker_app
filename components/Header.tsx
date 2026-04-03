import Link from "next/link";
import Image from "next/image";
import NavItems from "./NavItems";
import UserDropdown from "./UserDropdown";
import {searchStocks} from "@/lib/actions/finnhub.actions";

const Header = async({ user }: { user: User }) => {
  let initialStocks: StockWithWatchlistStatus[] = [];
  try {
    initialStocks = await searchStocks();
  } catch (error) {
    console.error("Failed to load initial stocks in Header:", error);
    initialStocks = [];
  }
  return (
    <header className="sticky top-0 header">
      <div className="container header-wrapper">
        <Link href="/">
          <Image
            src="/assets/icons/logo.svg"
            alt="StockPilot logo"
            width={140}
            height={32}
            className="h-10 w-auto cursor-pointer"
            loading="eager"
          />
        </Link>
        <nav className="hidden sm:block">
          <NavItems initialStocks={initialStocks} />
        </nav>
        <UserDropdown user={user} initialStocks={initialStocks}/>
      </div>
    </header>
  );
};

export default Header;