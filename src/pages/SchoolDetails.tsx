
import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
  FormMessage
} from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { 
  Building,
  Users,
  Phone,
  Mail,
  User,
  DollarSign,
  Calendar,
  ArrowLeft,
  Clock,
  FileText,
  ReceiptText,
  Plus,
  Banknote,
  RefreshCcw
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";

// Mock data for schools
const mockSchools = [
  {
    id: 1,
    name: "National Public School",
    address: "456 Education Ave, Mumbai",
    contactPerson: "Dr. Sharma",
    email: "principal@nps.edu",
    phone: "+91 9876543210",
    studentCount: 1250,
    pricePerStudent: 350,
    advancePaid: 200000,
    validUntil: "2025-05-15",
    paymentStatus: "paid",
    daysRemaining: 42,
    payments: [
      { 
        id: 1, 
        date: "2024-01-15", 
        amount: 200000, 
        description: "Initial advance payment", 
        studentCount: 1250,
        pricePerStudent: 350
      }
    ]
  },
  {
    id: 2,
    name: "St. Joseph's High School",
    address: "789 Knowledge Blvd, Delhi",
    contactPerson: "Fr. Thomas",
    email: "principal@stjosephs.edu",
    phone: "+91 9876543211",
    studentCount: 850,
    pricePerStudent: 380,
    advancePaid: 150000,
    validUntil: "2025-04-30",
    paymentStatus: "paid",
    daysRemaining: 27,
    payments: [
      { 
        id: 1, 
        date: "2024-02-10", 
        amount: 150000, 
        description: "Initial advance payment", 
        studentCount: 850,
        pricePerStudent: 380
      }
    ]
  },
  {
    id: 3,
    name: "Silver Oaks International",
    address: "321 Learning Lane, Bangalore",
    contactPerson: "Ms. Patel",
    email: "principal@silveroaks.edu",
    phone: "+91 9876543212",
    studentCount: 1480,
    pricePerStudent: 420,
    advancePaid: 310000,
    validUntil: "2025-04-12",
    paymentStatus: "overdue",
    daysRemaining: 9,
    payments: [
      { 
        id: 1, 
        date: "2023-12-05", 
        amount: 310000, 
        description: "Initial advance payment", 
        studentCount: 1480,
        pricePerStudent: 420
      }
    ]
  },
  {
    id: 4,
    name: "Greenfields Academy",
    address: "654 Wisdom Way, Chennai",
    contactPerson: "Mr. Kumar",
    email: "principal@greenfields.edu",
    phone: "+91 9876543213",
    studentCount: 720,
    pricePerStudent: 340,
    advancePaid: 120000,
    validUntil: "2025-04-05",
    paymentStatus: "critical",
    daysRemaining: 2,
    payments: [
      { 
        id: 1, 
        date: "2023-11-20", 
        amount: 120000, 
        description: "Initial advance payment", 
        studentCount: 720,
        pricePerStudent: 340
      }
    ]
  },
];

// Schema for payment form
const paymentFormSchema = z.object({
  amount: z.coerce.number().min(1, "Amount must be greater than 0"),
  description: z.string().min(3, "Description is required"),
  studentCount: z.coerce.number().min(1, "Student count must be at least 1"),
  pricePerStudent: z.coerce.number().min(1, "Price per student must be at least 1"),
  specialCase: z.boolean().optional().default(false),
});

type PaymentFormValues = z.infer<typeof paymentFormSchema>;

const SchoolDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);
  const [specialCase, setSpecialCase] = useState(false);
  
  // Find school by ID
  const school = mockSchools.find(s => s.id === Number(id));

  // Payment form
  const paymentForm = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      amount: 0,
      description: "",
      studentCount: school?.studentCount || 0,
      pricePerStudent: school?.pricePerStudent || 0,
      specialCase: false,
    },
  });
  
  // If school not found, show error
  if (!school) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <h1 className="text-2xl font-bold">School Not Found</h1>
        <p className="text-muted-foreground">The school you're looking for doesn't exist.</p>
        <Button variant="outline" onClick={() => navigate("/dashboard")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
        </Button>
      </div>
    );
  }

  // Get payment form values
  const watchedStudentCount = paymentForm.watch("studentCount");
  const watchedPricePerStudent = paymentForm.watch("pricePerStudent");
  const watchedAmount = paymentForm.watch("amount");

  // Handle toggling special case
  const handleSpecialCaseToggle = () => {
    setSpecialCase(!specialCase);
    paymentForm.setValue("specialCase", !specialCase);
  };

  // Handle payment submission
  const onSubmitPayment = async (data: PaymentFormValues) => {
    setIsSubmittingPayment(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // In a real app, you'd save the payment to Supabase here
      console.log("Payment data to be saved:", data);
      
      toast({
        title: "Payment Recorded",
        description: `₹${data.amount.toLocaleString()} has been added to ${school.name}'s account.`,
      });
      
      setIsPaymentDialogOpen(false);
      // In a real app, you'd refresh the school data
    } catch (error) {
      console.error("Error adding payment:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to record payment. Please try again.",
      });
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  // Function to get status class
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

  // Calculate total annual fees
  const totalAnnualFees = school.studentCount * school.pricePerStudent;
  
  // Calculate remaining balance
  const remainingBalance = Math.max(0, totalAnnualFees - school.advancePaid);

  return (
    <div className="space-y-6">
      {/* Back button and header */}
      <div className="flex flex-col gap-4">
        <Button 
          variant="outline" 
          className="w-fit" 
          onClick={() => navigate("/dashboard")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
        </Button>
        
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{school.name}</h1>
            <p className="text-muted-foreground">{school.address}</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-billeasy-purple hover:bg-billeasy-dark-purple gap-2">
                  <Plus className="h-4 w-4" /> Add Payment
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Record New Payment</DialogTitle>
                  <DialogDescription>
                    Add a new payment for {school.name}
                  </DialogDescription>
                </DialogHeader>
                
                <Form {...paymentForm}>
                  <form onSubmit={paymentForm.handleSubmit(onSubmitPayment)} className="space-y-4">
                    <FormField
                      control={paymentForm.control}
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
                      control={paymentForm.control}
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
                        onChange={handleSpecialCaseToggle}
                        className="rounded border-gray-300"
                      />
                      <label htmlFor="specialCase" className="text-sm font-medium">
                        Special case (student count changed)
                      </label>
                    </div>
                    
                    {specialCase && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                        <FormField
                          control={paymentForm.control}
                          name="studentCount"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Updated Student Count</FormLabel>
                              <FormControl>
                                <Input type="number" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={paymentForm.control}
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
                    
                    {/* Payment Summary */}
                    {watchedAmount > 0 && (
                      <Card className="bg-muted/40 border-dashed">
                        <CardContent className="pt-4">
                          <div className="text-sm space-y-2">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Current Annual Rate:</span>
                              <span>
                                {watchedStudentCount} students × ₹{watchedPricePerStudent} = ₹{(watchedStudentCount * watchedPricePerStudent).toLocaleString()}
                              </span>
                            </div>
                            
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">This Payment:</span>
                              <span className="font-medium text-primary">₹{watchedAmount.toLocaleString()}</span>
                            </div>
                            
                            <div className="flex justify-between items-center pt-1">
                              <span className="flex items-center gap-1 text-muted-foreground">
                                <Calendar className="h-4 w-4" />
                                Extends Validity By:
                              </span>
                              <span className="font-medium">
                                {watchedPricePerStudent > 0 ? 
                                  `~${Math.round((watchedAmount / (watchedStudentCount * watchedPricePerStudent)) * 365)} days` : 
                                  "N/A"
                                }
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setIsPaymentDialogOpen(false)} disabled={isSubmittingPayment}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={isSubmittingPayment}>
                        {isSubmittingPayment ? "Processing..." : "Record Payment"}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* School details in tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="payments">Payment History</TabsTrigger>
        </TabsList>
        
        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          {/* School status card */}
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
                  <span className={`px-2 py-1 rounded-md text-xs font-medium ${getStatusClass(school.paymentStatus)}`}>
                    {school.paymentStatus === "paid" ? "Active" : 
                     school.paymentStatus === "overdue" ? "Payment Due Soon" : "Critical - About to Expire"}
                  </span>
                </div>
                <Separator />
                <div className="flex items-center justify-between py-1">
                  <span className="text-muted-foreground">Valid Until</span>
                  <span className="font-medium">{new Date(school.validUntil).toLocaleDateString()}</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between py-1">
                  <span className="text-muted-foreground">Days Remaining</span>
                  <span className={`font-medium ${
                    school.daysRemaining < 10 
                      ? 'text-red-600 dark:text-red-400' 
                      : school.daysRemaining < 30 
                        ? 'text-orange-600 dark:text-orange-400' 
                        : ''
                  }`}>
                    {school.daysRemaining} days
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            {/* School Information Card */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  School Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="grid grid-cols-[20px_1fr] gap-2">
                    <User className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{school.contactPerson}</p>
                      <p className="text-sm text-muted-foreground">Contact Person</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-[20px_1fr] gap-2">
                    <Mail className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{school.email}</p>
                      <p className="text-sm text-muted-foreground">Email Address</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-[20px_1fr] gap-2">
                    <Phone className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{school.phone}</p>
                      <p className="text-sm text-muted-foreground">Phone Number</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-[20px_1fr] gap-2">
                    <Users className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{school.studentCount} students</p>
                      <p className="text-sm text-muted-foreground">Current Student Count</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Billing Information Card */}
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
                    <span className="font-medium">₹{school.pricePerStudent.toLocaleString()}/year</span>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Total Annual Fees</span>
                    <span className="font-medium">₹{totalAnnualFees.toLocaleString()}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Total Paid</span>
                    <span className="font-medium text-green-600 dark:text-green-400">₹{school.advancePaid.toLocaleString()}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Remaining Balance</span>
                    <span className="font-medium text-red-600 dark:text-red-400">₹{remainingBalance.toLocaleString()}</span>
                  </div>
                </div>

                <Button 
                  className="w-full gap-2" 
                  onClick={() => setIsPaymentDialogOpen(true)}
                >
                  <Banknote className="h-4 w-4" />
                  Add New Payment
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Payments Tab */}
        <TabsContent value="payments">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <ReceiptText className="h-5 w-5" />
                  Payment History
                </span>
                <Button size="sm" variant="outline" className="h-8 gap-1" onClick={() => setIsPaymentDialogOpen(true)}>
                  <Plus className="h-4 w-4" />
                  <span>New</span>
                </Button>
              </CardTitle>
              <CardDescription>
                View all payments made by {school.name}
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
                  {school.payments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center">
                        No payment records found
                      </TableCell>
                    </TableRow>
                  ) : (
                    school.payments.map((payment) => (
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
                Total Payments: {school.payments.length}
              </div>
              <div className="text-sm font-medium">
                Total Amount: ₹{school.advancePaid.toLocaleString()}
              </div>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SchoolDetails;
