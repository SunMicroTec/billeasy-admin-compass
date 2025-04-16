import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "@/integrations/supabase/client";
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

interface School {
  id: string;
  name: string;
  address: string | null;
  contact_person: string | null;
  email: string | null;
  phone: string | null;
  created_at: string | null;
  student_count: number | null;
}

interface BillingInfo {
  id: string;
  school_id: string;
  quoted_price: number;
  total_installments: number;
  advance_paid: number | null;
  advance_paid_date: string | null;
  created_at: string | null;
}

interface Payment {
  id: string;
  amount: number;
  date: string;
  description: string;
  studentCount: number;
  pricePerStudent: number;
}

const paymentFormSchema = z.object({
  amount: z.coerce.number().min(1, "Amount must be greater than 0"),
  description: z.string().min(3, "Description is required"),
  studentCount: z.coerce.number().min(1, "Student count must be at least 1"),
  pricePerStudent: z.coerce.number().min(1, "Price per student must be at least 1"),
  specialCase: z.boolean().optional().default(false),
  excessStudentCount: z.coerce.number().min(0, "Excess student count must be a non-negative number").optional().default(0),
  excessDays: z.coerce.number().min(0, "Excess days must be a non-negative number").optional().default(0)
});

type PaymentFormValues = z.infer<typeof paymentFormSchema>;

const SchoolDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);
  const [specialCase, setSpecialCase] = useState(false);
  
  const [school, setSchool] = useState<School | null>(null);
  const [billingInfo, setBillingInfo] = useState<BillingInfo | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [daysRemaining, setDaysRemaining] = useState(0);
  const [paymentStatus, setPaymentStatus] = useState('critical');
  const [validUntil, setValidUntil] = useState<string | null>(null);
  
  const paymentForm = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      amount: 0,
      description: "",
      studentCount: 0,
      pricePerStudent: 0,
      specialCase: false,
      excessStudentCount: 0,
      excessDays: 0
    },
  });
  
  useEffect(() => {
    const fetchSchoolData = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        setError(null);
        
        const { data: schoolData, error: schoolError } = await supabase
          .from('schools')
          .select('*')
          .eq('id', id)
          .single();
        
        if (schoolError) {
          throw new Error(`Error fetching school: ${schoolError.message}`);
        }
        
        if (!schoolData) {
          throw new Error('School not found');
        }
        
        setSchool(schoolData);
        
        const { data: billingData, error: billingError } = await supabase
          .from('billing_info')
          .select('*')
          .eq('school_id', id)
          .single();
        
        if (billingError && billingError.code !== 'PGRST116') {
          throw new Error(`Error fetching billing info: ${billingError.message}`);
        }
        
        if (billingData) {
          setBillingInfo(billingData);
          
          paymentForm.setValue('pricePerStudent', billingData.quoted_price || 0);
          paymentForm.setValue('studentCount', schoolData.student_count || 0);
          
          if (billingData.advance_paid_date) {
            const advancePaidDate = new Date(billingData.advance_paid_date);
            
            const totalAnnualFees = (schoolData.student_count || 0) * billingData.quoted_price;
            console.log('Validity calculation - Total annual fees:', totalAnnualFees);
            
            const pricePerDay = totalAnnualFees / 365;
            console.log('Validity calculation - Price per day:', pricePerDay);
            
            const daysOfValidity = pricePerDay > 0 ? Math.floor((billingData.advance_paid || 0) / pricePerDay) : 0;
            console.log('Validity calculation - Days of validity:', daysOfValidity);
            
            const validUntilDate = new Date(advancePaidDate);
            validUntilDate.setDate(validUntilDate.getDate() + daysOfValidity);
            console.log('Validity calculation - Valid until:', validUntilDate.toISOString());
            
            const today = new Date();
            const timeDiff = validUntilDate.getTime() - today.getTime();
            const days = Math.ceil(timeDiff / (1000 * 3600 * 24));
            console.log('Validity calculation - Days remaining:', days);
            
            setDaysRemaining(days);
            setValidUntil(validUntilDate.toISOString());
            
            if (days > 30) {
              setPaymentStatus('paid');
            } else if (days > 10) {
              setPaymentStatus('overdue');
            } else {
              setPaymentStatus('critical');
            }
          }
          
          setPayments([{
            id: '1',
            amount: billingData.advance_paid || 0,
            date: billingData.advance_paid_date || new Date().toISOString(),
            description: "Initial advance payment",
            studentCount: schoolData.student_count || 0,
            pricePerStudent: billingData.quoted_price || 0
          }]);
        } else {
          setBillingInfo(null);
          setPayments([]);
        }
        
      } catch (err: any) {
        console.error("Error fetching data:", err);
        setError(err.message);
        toast({
          variant: "destructive",
          title: "Error",
          description: err.message,
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchSchoolData();
  }, [id, toast, paymentForm]);
  
  const handleSpecialCaseToggle = () => {
    setSpecialCase(!specialCase);
    paymentForm.setValue("specialCase", !specialCase);
  };
  
  const onSubmitPayment = async (data: PaymentFormValues) => {
    if (!school || !id) return;
    
    setIsSubmittingPayment(true);
    
    try {
      let effectiveAmount = data.amount;
      
      if (data.specialCase && data.excessStudentCount && data.excessDays) {
        const pricePerStudentPerDay = data.pricePerStudent / 365;
        console.log('Special case - Price per student per day:', pricePerStudentPerDay);
        
        const excessCharge = data.excessStudentCount * pricePerStudentPerDay * data.excessDays;
        console.log('Special case - Excess students charge:', excessCharge);
        console.log('Special case - Original amount:', data.amount);
        
        effectiveAmount = Math.max(0, data.amount - excessCharge);
        console.log('Special case - Effective amount after deduction:', effectiveAmount);
        
        toast({
          title: "Payment Adjusted",
          description: `₹${excessCharge.toFixed(2)} was deducted as excess charges for ${data.excessStudentCount} additional students for ${data.excessDays} days.`,
        });
      }
      
      let billingId = billingInfo?.id;
      
      if (!billingId) {
        const { data: newBillingData, error: createError } = await supabase
          .from('billing_info')
          .insert({
            school_id: id,
            quoted_price: data.pricePerStudent,
            total_installments: 1,
            advance_paid: effectiveAmount,
            advance_paid_date: new Date().toISOString().split('T')[0]
          })
          .select()
          .single();
        
        if (createError) {
          throw new Error(`Error creating billing info: ${createError.message}`);
        }
        
        billingId = newBillingData.id;
        setBillingInfo(newBillingData);
      } else {
        const { error: updateError } = await supabase
          .from('billing_info')
          .update({
            quoted_price: data.specialCase ? data.pricePerStudent : billingInfo.quoted_price,
            advance_paid: (billingInfo.advance_paid || 0) + effectiveAmount,
            advance_paid_date: new Date().toISOString().split('T')[0]
          })
          .eq('id', billingId);
        
        if (updateError) {
          throw new Error(`Error updating billing info: ${updateError.message}`);
        }
      }
      
      const newPayment = {
        id: Date.now().toString(),
        amount: data.amount,
        date: new Date().toISOString(),
        description: data.description + (data.specialCase ? ` (Special case: ${data.excessStudentCount} excess students for ${data.excessDays} days)` : ''),
        studentCount: data.studentCount,
        pricePerStudent: data.pricePerStudent
      };
      
      setPayments([...payments, newPayment]);
      
      toast({
        title: "Payment Recorded",
        description: `₹${data.amount.toLocaleString()} has been added to ${school.name}'s account.`,
      });
      
      setIsPaymentDialogOpen(false);
      
      const { data: refreshedBilling, error: refreshError } = await supabase
        .from('billing_info')
        .select('*')
        .eq('id', billingId)
        .single();
      
      if (!refreshError && refreshedBilling) {
        setBillingInfo(refreshedBilling);
        
        if (refreshedBilling.advance_paid_date) {
          const advancePaidDate = new Date(refreshedBilling.advance_paid_date);
          
          const totalAnnualFees = (school.student_count || 0) * refreshedBilling.quoted_price;
          console.log('Update validity - Total annual fees:', totalAnnualFees);
          
          const pricePerDay = totalAnnualFees / 365;
          console.log('Update validity - Price per day:', pricePerDay);
          
          const daysOfValidity = pricePerDay > 0 ? Math.floor((refreshedBilling.advance_paid || 0) / pricePerDay) : 0;
          console.log('Update validity - Days of validity:', daysOfValidity);
          
          const validUntilDate = new Date(advancePaidDate);
          validUntilDate.setDate(validUntilDate.getDate() + daysOfValidity);
          console.log('Update validity - Valid until:', validUntilDate.toISOString());
          
          const today = new Date();
          const timeDiff = validUntilDate.getTime() - today.getTime();
          const days = Math.ceil(timeDiff / (1000 * 3600 * 24));
          console.log('Update validity - Days remaining:', days);
          
          setDaysRemaining(days);
          setValidUntil(validUntilDate.toISOString());
          
          if (days > 30) {
            setPaymentStatus('paid');
          } else if (days > 10) {
            setPaymentStatus('overdue');
          } else {
            setPaymentStatus('critical');
          }
        }
      }
      
    } catch (err: any) {
      console.error("Error processing payment:", err);
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message || "Failed to record payment. Please try again.",
      });
    } finally {
      setIsSubmittingPayment(false);
    }
  };
  
  useEffect(() => {
    if (!isPaymentDialogOpen) {
      paymentForm.reset({
        amount: 0,
        description: "",
        studentCount: school?.student_count || 0,
        pricePerStudent: billingInfo?.quoted_price || 0,
        specialCase: false,
        excessStudentCount: 0,
        excessDays: 0
      });
      setSpecialCase(false);
    }
  }, [isPaymentDialogOpen, paymentForm, billingInfo, school]);
  
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <h1 className="text-2xl font-bold">Error</h1>
        <p className="text-muted-foreground">{error}</p>
        <Button variant="outline" onClick={() => navigate("/dashboard")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
        </Button>
      </div>
    );
  }
  
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <h1 className="text-2xl font-bold">Loading...</h1>
        <p className="text-muted-foreground">Fetching school details</p>
      </div>
    );
  }
  
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
  
  const watchedStudentCount = paymentForm.watch("studentCount");
  const watchedPricePerStudent = paymentForm.watch("pricePerStudent");
  const watchedAmount = paymentForm.watch("amount");
  const watchedExcessStudentCount = paymentForm.watch("excessStudentCount");
  const watchedExcessDays = paymentForm.watch("excessDays");

  const pricePerStudentPerDay = watchedPricePerStudent / 365;
  const excessCharge = watchedExcessStudentCount * pricePerStudentPerDay * watchedExcessDays;
  
  const effectiveAmount = Math.max(0, watchedAmount - (specialCase ? excessCharge : 0));

  const dialogTotalAnnualFees = watchedStudentCount * watchedPricePerStudent;
  const pricePerDay = dialogTotalAnnualFees / 365;
  const validityExtension = pricePerDay > 0 ? Math.round(effectiveAmount / pricePerDay) : 0;

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

  const pricePerStudent = billingInfo?.quoted_price || 0;
  const totalAnnualFees = (school?.student_count || 0) * pricePerStudent;
  
  const totalPaid = billingInfo?.advance_paid || 0;
  const remainingBalance = Math.max(0, totalAnnualFees - totalPaid);

  return (
    <div className="space-y-6">
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
              <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
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
                        Special case (excess students adjustment)
                      </label>
                    </div>
                    
                    {specialCase && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                        <FormField
                          control={paymentForm.control}
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
                          control={paymentForm.control}
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
                          control={paymentForm.control}
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

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="payments">Payment History</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
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

          <div className="grid gap-4 md:grid-cols-2">
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
                    <Users className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{school.student_count || 0} students</p>
                      <p className="text-sm text-muted-foreground">Current Student Count</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-[20px_1fr] gap-2">
                    <Mail className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{school.email || 'Not specified'}</p>
                      <p className="text-sm text-muted-foreground">Email Address</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-[20px_1fr] gap-2">
                    <Phone className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{school.phone || 'Not specified'}</p>
                      <p className="text-sm text-muted-foreground">Phone Number</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

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
                  onClick={() => setIsPaymentDialogOpen(true)}
                >
                  <Banknote className="h-4 w-4" />
                  Add New Payment
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
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
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SchoolDetails;
