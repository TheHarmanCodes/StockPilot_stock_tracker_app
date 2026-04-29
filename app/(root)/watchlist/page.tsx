import React from "react";
import { Star } from "lucide-react";
import SearchCommand from "@/components/SearchComponent";
import { searchStocks } from "@/lib/actions/finnhub.actions";
import { getWatchlistWithData } from "@/lib/actions/watchlist.actions";
import { getUserAlerts } from "@/lib/actions/alert.actions";
import { WatchlistWorkspace } from "@/components/WatchlistWorkspace";

const Watchlist = async () => {
  const [watchlist, initialStocks, alerts] = await Promise.all([
    getWatchlistWithData(),
    searchStocks(),
    getUserAlerts(),
  ]);

  // when watchlist is in empty state
  if (watchlist.length === 0) {
    return (
      <section className="flex watchlist-empty-container">
        <div className="watchlist-empty">
          <Star className="watchlist-star" />
          <h2 className="empty-title">Your watchlist is empty</h2>
          <p className="empty-description">
            Start building your watchlist by searching for stocks and clicking
            the star icon to add them.
          </p>
        </div>
        <SearchCommand initialStocks={initialStocks} />
      </section>
    );
  }
  return (
    <section className="watchlist">
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h2 className="watchlist-title">Watchlist</h2>
          <SearchCommand initialStocks={initialStocks} />
        </div>
        <WatchlistWorkspace watchlist={watchlist} alerts={alerts} />
      </div>
    </section>
  );
};
export default Watchlist;
