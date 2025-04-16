
import React from "react";
import { Clock } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface SubscriptionStatusCardProps {
  paymentStatus: string;
  validUntil: string | null;
  daysRemaining: number;
}

export const SubscriptionStatusCard: React.FC<SubscriptionStatusCardProps> = ({
  paymentStatus,
  validUntil,
  daysRemaining,
}) => {
  const getStatusClass = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      case "overdue":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400";
      case "critical":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Subscription Status
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-1">
          <div className="flex items-center justify-between py-1">
            <span className="text-muted-foreground">Status</span>
            <span className={`px-2 py-1 rounded-md text-xs font-medium ${getStatusClass(paymentStatus)}`}>
              {paymentStatus === "paid" ? "Active" : 
               paymentStatus === "overdue" ? "Payment Due Soon" : "Critical - About to Expire"}
            </span>
          </div>
          <Separator />
          <div className="flex items-center justify-between py-1">
            <span className="text-muted-foreground">Valid Until</span>
            <span className="font-medium">
              {validUntil ? new Date(validUntil).toLocaleDateString() : 'Not set'}
            </span>
          </div>
          <Separator />
          <div className="flex items-center justify-between py-1">
            <span className="text-muted-foreground">Days Remaining</span>
            <span className={`font-medium ${
              daysRemaining < 10 
                ? 'text-red-600 dark:text-red-400' 
                : daysRemaining < 30 
                  ? 'text-orange-600 dark:text-orange-400' 
                  : ''
            }`}>
              {daysRemaining} days
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
