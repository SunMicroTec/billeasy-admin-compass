
import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

const SchoolDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  
  // Fetch school data
  const {
    school,
    billingInfo,
    payments,
    loading,
    error,
    daysRemaining,
    paymentStatus,
    validUntil
  } = useSchoolData(id);
  
  // Payment processing logic
  const {
    isSubmittingPayment,
    specialCase,
    setSpecialCase,
    processPayment
  } = usePaymentProcessing(school, billingInfo, payments);
  
  // State management - using setState functions properly
  const [localPayments, setLocalPayments] = useState<typeof payments>([]);
  const [localDaysRemaining, setLocalDaysRemaining] = useState<number>(0);
  const [localPaymentStatus, setLocalPaymentStatus] = useState<string>('critical');
  const [localValidUntil, setLocalValidUntil] = useState<string | null>(null);
  const [localBillingInfo, setLocalBillingInfo] = useState<typeof billingInfo>(null);
  
  // Update local state when props change
  React.useEffect(() => {
    setLocalBillingInfo(billingInfo);
    setLocalPayments(payments);
    setLocalDaysRemaining(daysRemaining);
    setLocalPaymentStatus(paymentStatus);
    setLocalValidUntil(validUntil);
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
      setLocalBillingInfo(result.billingInfo);
      setLocalPayments(result.payments);
      setLocalDaysRemaining(result.daysRemaining);
      setLocalPaymentStatus(result.paymentStatus);
      setLocalValidUntil(result.validUntil);
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
  
  if (error) {
    return <ErrorState message={error} />;
  }
  
  if (loading) {
    return <LoadingState />;
  }
  
  if (!school) {
    return <NotFoundState />;
  }
  
  const pricePerStudent = localBillingInfo?.quoted_price || 0;
  const totalAnnualFees = (school?.student_count || 0) * pricePerStudent;
  const totalPaid = localBillingInfo?.advance_paid || 0;
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
            <PaymentDialog 
              schoolName={school.name}
              isOpen={isPaymentDialogOpen}
              isSubmitting={isSubmittingPayment}
              specialCase={specialCase}
              defaultValues={{
                studentCount: school.student_count || 0,
                pricePerStudent: localBillingInfo?.quoted_price || 0
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
            paymentStatus={localPaymentStatus}
            validUntil={localValidUntil}
            daysRemaining={localDaysRemaining}
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
            payments={localPayments}
            totalPaid={totalPaid}
            onAddPayment={handleOpenPaymentDialog}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SchoolDetails;
