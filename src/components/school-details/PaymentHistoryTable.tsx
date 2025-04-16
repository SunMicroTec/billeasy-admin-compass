
import React from "react";
import { ReceiptText, Plus } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Payment {
  id: string;
  amount: number;
  date: string;
  description: string;
  studentCount: number;
  pricePerStudent: number;
}

interface PaymentHistoryTableProps {
  schoolName: string;
  payments: Payment[];
  totalPaid: number;
  onAddPayment: () => void;
}

export const PaymentHistoryTable: React.FC<PaymentHistoryTableProps> = ({
  schoolName,
  payments,
  totalPaid,
  onAddPayment,
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <ReceiptText className="h-5 w-5" />
            Payment History
          </span>
          <Button 
            size="sm" 
            variant="outline" 
            className="h-8 gap-1" 
            onClick={onAddPayment}
          >
            <Plus className="h-4 w-4" />
            <span>New</span>
          </Button>
        </CardTitle>
        <CardDescription>
          View all payments made by {schoolName}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="hidden md:table-cell">Students</TableHead>
              <TableHead className="hidden md:table-cell">Rate</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  No payment records found
                </TableCell>
              </TableRow>
            ) : (
              payments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell>
                    {new Date(payment.date).toLocaleDateString()}
                  </TableCell>
                  <TableCell>{payment.description}</TableCell>
                  <TableCell className="hidden md:table-cell">
                    {payment.studentCount}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    ₹{payment.pricePerStudent}/student
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    ₹{payment.amount.toLocaleString()}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
      <CardFooter className="flex justify-between border-t px-6 py-4">
        <div className="text-sm text-muted-foreground">
          Total Payments: {payments.length}
        </div>
        <div className="text-sm font-medium">
          Total Amount: ₹{totalPaid.toLocaleString()}
        </div>
      </CardFooter>
    </Card>
  );
};
