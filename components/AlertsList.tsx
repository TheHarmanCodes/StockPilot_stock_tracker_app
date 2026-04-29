"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { deleteAlert } from "@/lib/actions/alert.actions";
import { cn, formatPrice, getAlertText, getChangeColorClass } from "@/lib/utils";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AlertModal } from "./AlertModal";

type AlertsListPanelProps = {
  alerts: Alert[];
  watchlist: StockWithData[];
};

const frequencyLabels = {
  once: "Only once",
  hourly: "Once per hour",
  daily: "Once per day",
};

export function AlertsList({ alerts, watchlist }: AlertsListPanelProps) {
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [editingAlert, setEditingAlert] = useState<Alert | undefined>();

  const handleDelete = (alertId: string) => {
    startTransition(async () => {
      const result = await deleteAlert(alertId);
      if (result.success) {
        toast.success(result.message);
        return;
      }
      toast.error(result.message);
    });
  };

  return (
    <aside className="watchlist-alerts flex">
      <div className="alert-panel-header">
        <h2 className="watchlist-title">Alerts</h2>
        <Button
          className="alert-create-btn"
          onClick={() => {
            setEditingAlert(undefined);
            setOpen(true);
          }}
        >
          <Plus className="h-4 w-4" />
          Create Alert
        </Button>
      </div>

      <div className="alert-list scrollbar-hide-default">
        {alerts.length === 0 ? (
          <div className="alert-empty">
            Create a price alert from any watchlist stock.
          </div>
        ) : (
          alerts.map((alert) => (
            <article
              key={alert.id}
              className={cn("alert-item", !alert.isActive && "opacity-60")}
            >
              <div className="alert-details">
                <div>
                  <p className="alert-name">{alert.alertName}</p>
                  <p className="alert-company">
                    {alert.company} ({alert.symbol})
                  </p>
                </div>
                <div className="text-right">
                  <p className="alert-price">
                    {alert.currentPrice ? formatPrice(alert.currentPrice) : "—"}
                  </p>
                  <p
                    className={cn(
                      "text-sm font-medium",
                      getChangeColorClass(alert.changePercent),
                    )}
                  >
                    {alert.changePercent
                      ? `${alert.changePercent > 0 ? "+" : ""}${alert.changePercent.toFixed(2)}%`
                      : "—"}
                  </p>
                </div>
              </div>

              <div className="alert-actions">
                <div>
                  <p className="text-sm text-gray-400">Alert:</p>
                  <p className="text-base font-semibold text-gray-100">
                    {getAlertText(alert)}
                  </p>
                  <span className="alert-frequency">
                    {alert.isActive
                      ? frequencyLabels[alert.frequency]
                      : "Paused after trigger"}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="alert-update-btn"
                    title="Edit alert"
                    onClick={() => {
                      setEditingAlert(alert);
                      setOpen(true);
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="alert-delete-btn"
                    title="Delete alert"
                    disabled={isPending}
                    onClick={() => handleDelete(alert.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </article>
          ))
        )}
      </div>

      <AlertModal
        open={open}
        setOpen={setOpen}
        watchlist={watchlist}
        alertData={editingAlert}
      />
    </aside>
  );
}
