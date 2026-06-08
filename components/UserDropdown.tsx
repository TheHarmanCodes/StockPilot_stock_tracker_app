"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { BellOff, BellRing, Loader2, LogOut } from "lucide-react";
import NavItems from "./NavItems";
import { signOut } from "@/lib/actions/auth.actions";
import {
  subscribeCurrentUserToDailyNews,
  unsubscribeCurrentUserFromDailyNews,
} from "@/lib/actions/email-subscription.actions";
import { toast } from "sonner";
import { useTransition } from "react";

const UserDropdown = ({
  user,
  initialStocks,
  isDailyNewsSubscribed,
}: {
  user: User;
  initialStocks: StockWithWatchlistStatus[];
  isDailyNewsSubscribed: boolean;
}) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleSignOut = async () => {
    const result = await signOut();
    if (!result?.success) {
      return;
    }

    router.replace("/sign-in");
    router.refresh();
  };

  // Toggles the daily-summary preference directly from the profile dropdown.
  const handleDailyNewsSubscription = () => {
    startTransition(async () => {
      try {
        const result = isDailyNewsSubscribed
            ? await unsubscribeCurrentUserFromDailyNews()
            : await subscribeCurrentUserToDailyNews();
        if (result.success) {
          toast.success(
              isDailyNewsSubscribed
                  ? "Daily summary unsubscribed"
                  : "Daily summary subscribed",
              {
                description: isDailyNewsSubscribed
                    ? "You will stop receiving daily news summary emails."
                    : "Daily news summary emails are active again.",
              },
          );
          router.refresh();
          return;
        }
        toast.error("Could not update email preference", {
          description: result.message,
        });
      } catch {
        toast.error("Could not update email preference", {
          description: "Please try again.",
        });
      }
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="group flex items-center gap-3 text-gray-400 transition-colors "
        >
          <Avatar className="h-8 w-8 ">
            <AvatarFallback className="bg-yellow-500 text-yellow-900 text-sm font-bold group-hover:bg-yellow-400">
              {user.name?.[0] ?? "U"}
            </AvatarFallback>
          </Avatar>
          <div className="hidden md:flex flex-col items-start">
            <span className="text-base font-medium text-gray-400 group-hover:text-yellow-500 transition-colors">
              {user.name}
            </span>
          </div>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-max text-gray-400 bg-gray-800">
        <DropdownMenuLabel>
          <div className="flex relative items-center gap-3 py-2 ">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-yellow-500 text-yellow-900 text-sm font-bold ">
                {user.name?.[0] ?? "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="text-base font-medium text-gray-400">
                {user.name}
              </span>
              <span className="text-sm text-gray-500">{user.email}</span>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-gray-600" />
        <DropdownMenuItem
          disabled={isPending}
          onSelect={(event) => {
            event.preventDefault();
            handleDailyNewsSubscription();
          }}
          className="text-gray-100 text-sm font-medium focus:bg-transparent focus:text-yellow-500 transition-colors cursor-pointer"
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 mr-2 hidden sm:block animate-spin" />
          ) : isDailyNewsSubscribed ? (
            <BellOff className="h-4 w-4 mr-2 hidden sm:block" />
          ) : (
            <BellRing className="h-4 w-4 mr-2 hidden sm:block" />
          )}
          {isDailyNewsSubscribed
            ? "Unsubscribe daily summary"
            : "Resubscribe daily summary"}
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-gray-600" />
        <DropdownMenuItem
          onClick={handleSignOut}
          className="text-gray-100 text-sm font-medium focus:bg-transparent focus:text-yellow-500 transition-colors cursor-pointer"
        >
          <LogOut className="h-4 w-4 mr-2 hidden sm:block" />
          Logout
        </DropdownMenuItem>
        <DropdownMenuSeparator className="hidden sm:block text-gray-600" />
        <nav className="sm:hidden">
          <NavItems initialStocks={initialStocks} />
        </nav>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserDropdown;
