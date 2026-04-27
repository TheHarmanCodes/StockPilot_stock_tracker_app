"use client";

import { useMemo, useState } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import {
  addToWatchList,
  removeFromWatchlist,
} from "@/lib/actions/watchlist.actions";
import { toast } from "sonner";
import { Star, Trash2 } from "lucide-react";

const WatchlistButton = ({
  symbol,
  company,
  isInWatchlist,
  showTrashIcon = false,
  type = "button",
  onWatchlistChange,
}: WatchlistButtonProps) => {
  const [added, setAdded] = useState<boolean>(!!isInWatchlist);

  const label = useMemo(() => {
    if (type === "icon") return added ? "" : "";
    return added ? "Remove from Watchlist" : "Add to Watchlist";
  }, [added, type]);

  // handle adding/removing stocks from watchlist
  const toggleWatchlist = async () => {
    const result = added
      ? await removeFromWatchlist(symbol)
      : await addToWatchList(symbol, company);

    if (result.success) {
      toast.success(added ? "Removed from Watchlist" : "Added to Watchlist", {
        description: `${company} ${added ? "removed from" : `added to`} your watchlist`,
      });
    }
    // Notify parent component of watchlist change for state synchronization
    onWatchlistChange?.(symbol, !added);
  };

  // debounce the toggle func to prevent rapid API calls (300 ms delay)
  const debounceToggle = useDebounce(toggleWatchlist, 300);

  // click handler that provides optimistic ui updated
  const handleClick = (e: React.MouseEvent) => {
    //prevent event bubbling and default behavior
    e.stopPropagation();
    e.preventDefault();

    setAdded(!added);
    debounceToggle();
  };

  if (type === "icon") {
    return (
      <button
        title={
          added
            ? `Remove ${symbol} from watchlist`
            : `Add ${symbol} to watchlist`
        }
        aria-label={
          added
            ? `Remove ${symbol} from watchlist`
            : `Add ${symbol} to watchlist`
        }
        className={`watchlist-icon-btn ${added ? "watchlist-icon-added" : ""}`}
        onClick={handleClick}
      >
        <Star fill={added ? "currentColor" : "none"} />
      </button>
    );
  }

  return (
    <button
      className={`watchlist-btn ${added ? "watchlist-remove" : ""}`}
      onClick={handleClick}
    >
      {showTrashIcon && added ? <Trash2 /> : null}
      <span>{label}</span>
    </button>
  );
};

export default WatchlistButton;
