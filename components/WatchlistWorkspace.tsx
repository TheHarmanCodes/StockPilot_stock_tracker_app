"use client";

import { useState } from "react";
import { AlertModal } from "./AlertModal";
import { AlertsList } from "./AlertsList";
import { WatchlistTable } from "./WatchlistTable";

type WatchlistWorkspaceProps = {
  watchlist: StockWithData[];
  alerts: Alert[];
};

export function WatchlistWorkspace({
  watchlist,
  alerts,
}: WatchlistWorkspaceProps) {
  const [open, setOpen] = useState(false);
  const [selectedStock, setSelectedStock] = useState<SelectedStock>();

  return (
    <div className="watchlist-container">
      <div className="watchlist">
        <WatchlistTable
          watchlist={watchlist}
          onAddAlert={(stock) => {
            setSelectedStock(stock);
            setOpen(true);
          }}
        />
      </div>
      <AlertsList alerts={alerts} watchlist={watchlist} />
      <AlertModal
        open={open}
        setOpen={setOpen}
        watchlist={watchlist}
        selectedStock={selectedStock}
      />
    </div>
  );
}
