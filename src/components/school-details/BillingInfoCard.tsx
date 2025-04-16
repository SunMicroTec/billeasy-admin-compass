
import React from "react";
import { FileText, Banknote } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";

interface BillingInfoCardProps {
  pricePerStudent: number;
  totalAnnualFees: number;
  totalPaid: number;
  remainingBalance: number;
  onAddPayment: () => void;
}

export const BillingInfoCard: React.FC<BillingInfoCardProps> = ({
  pricePerStudent,
  totalAnnualFees,
  totalPaid,
  remainingBalance,
  onAddPayment,
}) => {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Billing Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Price Per Student</span>
            <span className="font-medium">
              ₹{pricePerStudent.toLocaleString()}/year
            </span>
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Total Annual Fees</span>
            <span className="font-medium">₹{totalAnnualFees.toLocaleString()}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Total Paid</span>
            <span className="font-medium text-green-600 dark:text-green-400">
              ₹{totalPaid.toLocaleString()}
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Remaining Balance</span>
            <span className="font-medium text-red-600 dark:text-red-400">
              ₹{remainingBalance.toLocaleString()}
            </span>
          </div>
        </div>

        <Button 
          className="w-full gap-2" 
          onClick={onAddPayment}
        >
          <Banknote className="h-4 w-4" />
          Add New Payment
        </Button>
      </CardContent>
    </Card>
  );
};
