
import React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Calendar, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent } from "@/components/ui/card";

const paymentFormSchema = z.object({
  amount: z.coerce.number().min(1, "Amount must be greater than 0"),
  description: z.string().min(3, "Description is required"),
  studentCount: z.coerce.number().min(1, "Student count must be at least 1"),
  pricePerStudent: z.coerce.number().min(1, "Price per student must be at least 1"),
  specialCase: z.boolean().optional().default(false),
  excessStudentCount: z.coerce.number().min(0, "Excess student count must be a non-negative number").optional().default(0),
  excessDays: z.coerce.number().min(0, "Excess days must be a non-negative number").optional().default(0)
});

export type PaymentFormValues = z.infer<typeof paymentFormSchema>;

interface PaymentDialogProps {
  schoolName: string;
  isOpen: boolean;
  isSubmitting: boolean;
  specialCase: boolean;
  defaultValues: {
    studentCount: number;
    pricePerStudent: number;
  };
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: PaymentFormValues) => void;
  onSpecialCaseToggle: () => void;
}

export const PaymentDialog: React.FC<PaymentDialogProps> = ({
  schoolName,
  isOpen,
  isSubmitting,
  specialCase,
  defaultValues,
  onOpenChange,
  onSubmit,
  onSpecialCaseToggle,
}) => {
  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      amount: 0,
      description: "",
      studentCount: defaultValues.studentCount,
      pricePerStudent: defaultValues.pricePerStudent,
      specialCase: false,
      excessStudentCount: 0,
      excessDays: 0
    },
  });

  const watchedStudentCount = form.watch("studentCount");
  const watchedPricePerStudent = form.watch("pricePerStudent");
  const watchedAmount = form.watch("amount");
  const watchedExcessStudentCount = form.watch("excessStudentCount");
  const watchedExcessDays = form.watch("excessDays");

  const pricePerStudentPerDay = watchedPricePerStudent / 365;
  const excessCharge = watchedExcessStudentCount * pricePerStudentPerDay * watchedExcessDays;
  
  const effectiveAmount = Math.max(0, watchedAmount - (specialCase ? excessCharge : 0));

  const dialogTotalAnnualFees = watchedStudentCount * watchedPricePerStudent;
  const pricePerDay = dialogTotalAnnualFees / 365;
  const validityExtension = pricePerDay > 0 ? Math.round(effectiveAmount / pricePerDay) : 0;

  React.useEffect(() => {
    if (!isOpen) {
      form.reset({
        amount: 0,
        description: "",
        studentCount: defaultValues.studentCount,
        pricePerStudent: defaultValues.pricePerStudent,
        specialCase: false,
        excessStudentCount: 0,
        excessDays: 0
      });
    }
  }, [isOpen, form, defaultValues]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button className="bg-billeasy-purple hover:bg-billeasy-dark-purple gap-2">
          <Plus className="h-4 w-4" /> Add Payment
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Record New Payment</DialogTitle>
          <DialogDescription>
            Add a new payment for {schoolName}
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Amount</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-muted-foreground">₹</span>
                      <Input type="number" className="pl-8" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Monthly payment for April" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="specialCase"
                checked={specialCase}
                onChange={onSpecialCaseToggle}
                className="rounded border-gray-300"
              />
              <label htmlFor="specialCase" className="text-sm font-medium">
                Special case (excess students adjustment)
              </label>
            </div>
            
            {specialCase && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <FormField
                  control={form.control}
                  name="excessStudentCount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Excess Student Count</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormDescription className="text-xs">
                        Number of students above regular count
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="excessDays"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Excess Days</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormDescription className="text-xs">
                        Days with excess students
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="studentCount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Regular Student Count</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="pricePerStudent"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price Per Student</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <span className="absolute left-3 top-2.5 text-muted-foreground">₹</span>
                          <Input type="number" className="pl-8" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}
            
            {watchedAmount > 0 && (
              <Card className="bg-muted/40 border-dashed">
                <CardContent className="pt-4">
                  <div className="text-sm space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Current Annual Rate:</span>
                      <span>
                        {watchedStudentCount} students × ₹{watchedPricePerStudent} = ₹{(watchedStudentCount * watchedPricePerStudent).toLocaleString()}/year
                      </span>
                    </div>
                    
                    {specialCase && watchedExcessStudentCount > 0 && watchedExcessDays > 0 && (
                      <div className="flex justify-between text-amber-600">
                        <span>Excess Charge Adjustment:</span>
                        <span>
                          {watchedExcessStudentCount} students × {watchedExcessDays} days × ₹{pricePerStudentPerDay.toFixed(2)}/day = -₹{excessCharge.toFixed(2)}
                        </span>
                      </div>
                    )}
                    
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Effective Payment:</span>
                      <span className="font-medium text-primary">
                        ₹{effectiveAmount.toLocaleString()}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center pt-1">
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        Extends Validity By:
                      </span>
                      <span className="font-medium">
                        {pricePerDay > 0 ? 
                          `~${validityExtension} days` : 
                          "N/A"
                        }
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <DialogFooter className="sticky bottom-0 pt-2 bg-background">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)} 
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Processing..." : "Record Payment"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
