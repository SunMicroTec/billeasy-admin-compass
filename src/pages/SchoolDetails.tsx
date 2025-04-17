
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// Custom Hooks
import { useSchoolData } from "@/hooks/useSchoolData";
import { usePaymentProcessing } from "@/hooks/usePaymentProcessing";

// Components
import { SchoolInfo } from "@/components/school-details/SchoolInfo";
import { BillingInfoCard } from "@/components/school-details/BillingInfoCard";
import { SubscriptionStatusCard } from "@/components/school-details/SubscriptionStatusCard";
import { PaymentHistoryTable } from "@/components/school-details/PaymentHistoryTable";
import { PaymentDialog, PaymentFormValues } from "@/components/school-details/PaymentDialog";
import { LoadingState } from "@/components/school-details/LoadingState";
import { ErrorState } from "@/components/school-details/ErrorState";
import { NotFoundState } from "@/components/school-details/NotFoundState";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

// Define types for local state to avoid deep type instantiation
interface LocalState {
  payments: Array<{
    id: string;
    amount: number;
    date: string;
    description: string;
    studentCount: number;
    pricePerStudent: number;
    specialCase?: boolean;
  }>;
  billingInfo: {
    id: string;
    school_id: string;
    quoted_price: number;
    total_installments: number;
    advance_paid: number | null;
    advance_paid_date: string | null;
    created_at: string | null;
  } | null;
  daysRemaining: number;
  paymentStatus: string;
  validUntil: string | null;
}

const SchoolDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Fetch school data - TypeScript is having trouble with deep inference here
  const schoolDataResult = useSchoolData(id);
  
  // Unpack the values with explicit typing to avoid deep instantiation
  const school = schoolDataResult.school;
  const billingInfo = schoolDataResult.billingInfo;
  const payments = schoolDataResult.payments;
  const loading = schoolDataResult.loading;
  const error = schoolDataResult.error;
  const daysRemaining = schoolDataResult.daysRemaining;
  const paymentStatus = schoolDataResult.paymentStatus;
  const validUntil = schoolDataResult.validUntil;
  
  // Payment processing logic
  const {
    isSubmittingPayment,
    specialCase,
    setSpecialCase,
    processPayment
  } = usePaymentProcessing(school, billingInfo, payments);
  
  // State management with explicit typing to avoid deep instantiation
  const [localState, setLocalState] = useState<LocalState>({
    payments: [],
    billingInfo: null,
    daysRemaining: 0,
    paymentStatus: 'critical',
    validUntil: null
  });
  
  // Update local state when props change - use explicit typing
  useEffect(() => {
    setLocalState({
      payments: payments,
      billingInfo: billingInfo,
      daysRemaining: daysRemaining,
      paymentStatus: paymentStatus,
      validUntil: validUntil
    });
  }, [billingInfo, payments, daysRemaining, paymentStatus, validUntil]);
  
  const handleSpecialCaseToggle = () => {
    setSpecialCase(!specialCase);
  };
  
  const handleOpenPaymentDialog = () => {
    setIsPaymentDialogOpen(true);
  };
  
  const handleSubmitPayment = async (data: PaymentFormValues) => {
    const result = await processPayment(data);
    
    if (result) {
      // Type assertion here to avoid deep instantiation issues
      const typedResult = result as {
        billingInfo: LocalState['billingInfo'],
        payments: LocalState['payments'],
        daysRemaining: number,
        paymentStatus: string,
        validUntil: string | null
      };
      
      setLocalState({
        billingInfo: typedResult.billingInfo,
        payments: typedResult.payments,
        daysRemaining: typedResult.daysRemaining,
        paymentStatus: typedResult.paymentStatus,
        validUntil: typedResult.validUntil
      });
      setIsPaymentDialogOpen(false);
      
      // Show success message with option to navigate back to dashboard
      toast({
        title: "Payment Processed",
        description: "Payment has been successfully recorded. The dashboard will reflect the updated validity.",
        action: (
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => navigate('/dashboard')}
          >
            View Dashboard
          </Button>
        ),
      });
    }
  };
  
  const handleDeleteSchool = async () => {
    if (!school || !id) return;
    
    try {
      setIsDeleting(true);
      
      // Log the delete action
      try {
        await supabase.from('action_logs').insert({
          action_type: 'school_deleted',
          description: `Deleted school: ${school.name}`,
          performed_by: 'user',
          school_id: id
        });
      } catch (error) {
        console.error('Failed to log delete action:', error);
        // Continue with deletion even if logging fails
      }
        
      // Delete related records first
      if (billingInfo) {
        // Delete payment logs
        await supabase
          .from('payment_logs')
          .delete()
          .eq('school_id', id);
        
        // Delete billing info
        await supabase
          .from('billing_info')
          .delete()
          .eq('school_id', id);
      }
      
      // Finally delete the school
      const { error } = await supabase
        .from('schools')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      toast({
        title: "School Deleted",
        description: `${school.name} has been successfully deleted.`,
      });
      
      navigate('/dashboard');
    } catch (err: any) {
      console.error("Error deleting school:", err);
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message || "Failed to delete school. Please try again.",
      });
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  };
  
  if (error) {
    return <ErrorState message={error} />;
  }
  
  if (loading) {
    return <LoadingState />;
  }
  
  if (!school) {
    return <NotFoundState />;
  }
  
  // Use explicit variables instead of nested property access to avoid deep type inference
  const pricePerStudent = localState.billingInfo?.quoted_price || 0;
  const totalAnnualFees = (school?.student_count || 0) * pricePerStudent;
  const totalPaid = localState.billingInfo?.advance_paid || 0;
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
            <Button 
              variant="destructive"
              size="sm"
              className="gap-2"
              onClick={() => setIsDeleteDialogOpen(true)}
            >
              <Trash2 className="h-4 w-4" />
              <span>Delete School</span>
            </Button>
            
            <PaymentDialog 
              schoolName={school.name}
              isOpen={isPaymentDialogOpen}
              isSubmitting={isSubmittingPayment}
              specialCase={specialCase}
              defaultValues={{
                studentCount: school.student_count || 0,
                pricePerStudent: localState.billingInfo?.quoted_price || 0
              }}
              onOpenChange={setIsPaymentDialogOpen}
              onSubmit={handleSubmitPayment}
              onSpecialCaseToggle={handleSpecialCaseToggle}
            />
          </div>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="payments">Payment History</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <SubscriptionStatusCard 
            paymentStatus={localState.paymentStatus}
            validUntil={localState.validUntil}
            daysRemaining={localState.daysRemaining}
          />

          <div className="grid gap-4 md:grid-cols-2">
            <SchoolInfo 
              studentCount={school.student_count || 0}
              email={school.email}
              phone={school.phone}
            />

            <BillingInfoCard 
              pricePerStudent={pricePerStudent}
              totalAnnualFees={totalAnnualFees}
              totalPaid={totalPaid}
              remainingBalance={remainingBalance}
              onAddPayment={handleOpenPaymentDialog}
            />
          </div>
        </TabsContent>
        
        <TabsContent value="payments">
          <PaymentHistoryTable 
            schoolName={school.name}
            payments={localState.payments}
            totalPaid={totalPaid}
            onAddPayment={handleOpenPaymentDialog}
          />
        </TabsContent>
      </Tabs>
      
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {school.name} and all associated payment records.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDeleteSchool();
              }}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default SchoolDetails;
