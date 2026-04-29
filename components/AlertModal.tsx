"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createAlert, updateAlert } from "@/lib/actions/alert.actions";
import { formatPrice } from "@/lib/utils";
import { toast } from "sonner";

type AlertModalStock = SelectedStock & {
  priceFormatted?: string;
};

type AlertModalProps = {
  open: boolean;
  setOpen: (open: boolean) => void;
  watchlist: StockWithData[];
  selectedStock?: AlertModalStock;
  alertData?: Alert;
};

const frequencyLabels = {
  once: "Only once",
  hourly: "Once per hour",
  daily: "Once per day",
};

const getInitialThreshold = (stock?: AlertModalStock, alert?: Alert) => {
  if (alert) return alert.threshold.toString();
  if (!stock?.currentPrice) return "";
  return stock.currentPrice.toFixed(2);
};

export function AlertModal({
  open,
  setOpen,
  watchlist,
  selectedStock,
  alertData,
}: AlertModalProps) {
  const [isPending, startTransition] = useTransition();
  const [symbol, setSymbol] = useState(selectedStock?.symbol ?? "");
  const [alertName, setAlertName] = useState("");
  const [alertType, setAlertType] = useState<"upper" | "lower">("upper");
  const [threshold, setThreshold] = useState("");
  const [frequency, setFrequency] = useState<"once" | "hourly" | "daily">(
    "once",
  );

  const stockMap = useMemo(
    () => new Map(watchlist.map((item) => [item.symbol, item])),
    [watchlist],
  );

  const activeStock = stockMap.get(symbol) ?? selectedStock;
  const isEditing = Boolean(alertData?.id);

  useEffect(() => {
    if (!open) return;

    const nextSymbol = alertData?.symbol ?? selectedStock?.symbol ?? "";
    setSymbol(nextSymbol);
    setAlertName(
      alertData?.alertName ??
        (nextSymbol ? `${nextSymbol} price target` : "Price target"),
    );
    setAlertType(alertData?.alertType ?? "upper");
    setFrequency(alertData?.frequency ?? "once");
    setThreshold(getInitialThreshold(selectedStock, alertData));
  }, [alertData, open, selectedStock]);

  const handleSubmit = () => {
    const stock = stockMap.get(symbol) ?? selectedStock;
    if (!stock) {
      toast.error("Select a stock before saving the alert.");
      return;
    }
    const trimmedName = alertName.trim();
    if (!trimmedName) {
      toast.error("Please enter an alert name.");
      return;
    }

    const numericThreshold = Number(threshold);
    if (!threshold || Number.isNaN(numericThreshold) || numericThreshold <= 0) {
      toast.error("Please enter a valid target price greater than zero.");
      return;
    }

    startTransition(async () => {
      const payload = {
        symbol: stock.symbol,
        company: stock.company,
        alertName,
        alertType,
        threshold: numericThreshold,
        frequency,
      };

      const result =
        isEditing && alertData
          ? await updateAlert(alertData.id, payload)
          : await createAlert(payload);

      if (result.success) {
        toast.success(result.message);
        setOpen(false);
        return;
      }
      toast.error(result.message);
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="alert-dialog">
        <DialogHeader>
          <DialogTitle className="alert-title">
            {isEditing ? "Edit Alert" : "Create Alert"}
          </DialogTitle>
          <DialogDescription>
            StockPilot will email you when the saved price condition is met.
          </DialogDescription>
        </DialogHeader>

        <div className="alert-form">
          <label className="alert-form-field">
            <span>Stock</span>
            <Select
              value={symbol}
              onValueChange={(value) => {
                setSymbol(value);
                const stock = stockMap.get(value);
                setAlertName(`${value} price target`);
                setThreshold(
                  stock?.currentPrice ? stock.currentPrice.toFixed(2) : "",
                );
              }}
              disabled={isEditing}
            >
              <SelectTrigger className="alert-select-trigger">
                <SelectValue placeholder="Choose stock" />
              </SelectTrigger>
              <SelectContent>
                {watchlist.map((item) => (
                  <SelectItem key={item.symbol} value={item.symbol}>
                    {item.symbol} - {item.company}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>

          <label className="alert-form-field">
            <span>Alert name</span>
            <Input
              className="alert-input"
              value={alertName}
              onChange={(event) => setAlertName(event.target.value)}
              placeholder="AAPL price target"
            />
          </label>

          <div className="alert-form-grid">
            <label className="alert-form-field">
              <span>Condition</span>
              <Select
                value={alertType}
                onValueChange={(value: "upper" | "lower") =>
                  setAlertType(value)
                }
              >
                <SelectTrigger className="alert-select-trigger">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="upper">Price above</SelectItem>
                  <SelectItem value="lower">Price below</SelectItem>
                </SelectContent>
              </Select>
            </label>

            <label className="alert-form-field">
              <span>Target price</span>
              <Input
                className="alert-input"
                type="number"
                min="0"
                step="0.01"
                value={threshold}
                onChange={(event) => setThreshold(event.target.value)}
                placeholder="240.60"
              />
            </label>
          </div>

          <label className="alert-form-field">
            <span>Email frequency</span>
            <Select
              value={frequency}
              onValueChange={(value: "once" | "hourly" | "daily") =>
                setFrequency(value)
              }
            >
              <SelectTrigger className="alert-select-trigger">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(frequencyLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>

          {activeStock?.currentPrice ? (
            <div className="alert-current-price">
              Current price: {formatPrice(activeStock.currentPrice)}
            </div>
          ) : null}

          <Button
            className="alert-submit-btn"
            onClick={handleSubmit}
            disabled={isPending}
          >
            {isPending
              ? "Saving..."
              : isEditing
                ? "Update Alert"
                : "Create Alert"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
