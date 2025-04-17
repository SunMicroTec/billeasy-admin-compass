
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { PaymentFormValues } from '@/components/school-details/PaymentDialog';
import { useQueryClient } from '@tanstack/react-query';

interface School {
  id: string;
  name: string;
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

interface UpdatedState {
  billingInfo: BillingInfo | null;
  payments: Payment[];
  daysRemaining: number;
  paymentStatus: string;
  validUntil: string | null;
}

interface UsePaymentProcessingReturn {
  isSubmittingPayment: boolean;
  specialCase: boolean;
  setSpecialCase: (value: boolean) => void;
  processPayment: (data: PaymentFormValues) => Promise<UpdatedState | null>;
}

export const usePaymentProcessing = (
  school: School | null,
  billingInfo: BillingInfo | null,
  payments: Payment[]
): UsePaymentProcessingReturn => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);
  const [specialCase, setSpecialCase] = useState(false);

  const processPayment = async (data: PaymentFormValues): Promise<UpdatedState | null> => {
    if (!school || !school.id) return null;
    
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
            school_id: school.id,
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
        billingInfo = newBillingData;
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
      
      // Create a new payment log in the payment_logs table
      const paymentDescription = data.description + (data.specialCase ? ` (Special case: ${data.excessStudentCount} excess students for ${data.excessDays} days)` : '');
      
      const { data: paymentLogData, error: paymentLogError } = await supabase
        .from('payment_logs')
        .insert({
          school_id: school.id,
          billing_id: billingId,
          amount: data.amount,
          payment_date: new Date().toISOString().split('T')[0],
          description: paymentDescription,
          payment_mode: 'manual',
          student_count: data.studentCount,
          price_per_student: data.pricePerStudent,
          is_special_case: data.specialCase || false,
          excess_student_count: data.excessStudentCount || 0,
          excess_days: data.excessDays || 0
        })
        .select()
        .single();
      
      if (paymentLogError) {
        throw new Error(`Error logging payment: ${paymentLogError.message}`);
      }
      
      // Map the new payment log to our expected Payment format
      const newPayment = {
        id: paymentLogData.id,
        amount: data.amount,
        date: new Date().toISOString(),
        description: paymentDescription,
        studentCount: data.studentCount,
        pricePerStudent: data.pricePerStudent
      };
      
      const updatedPayments = [...payments, newPayment];
      
      toast({
        title: "Payment Recorded",
        description: `₹${data.amount.toLocaleString()} has been added to ${school.name}'s account.`,
      });
      
      const { data: refreshedBilling, error: refreshError } = await supabase
        .from('billing_info')
        .select('*')
        .eq('id', billingId)
        .single();
      
      if (!refreshError && refreshedBilling) {
        let daysRemaining = 0;
        let paymentStatus = 'critical';
        let validUntil = null;
        
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
          
          daysRemaining = days;
          validUntil = validUntilDate.toISOString();
          
          if (days > 30) {
            paymentStatus = 'paid';
          } else if (days > 10) {
            paymentStatus = 'overdue';
          } else {
            paymentStatus = 'critical';
          }
        }
        
        // Also add an entry to action_logs
        await supabase
          .from('action_logs')
          .insert({
            action_type: 'payment_added',
            description: `Added payment of ₹${data.amount.toLocaleString()} to ${school.name}`,
            performed_by: 'user',
            school_id: school.id,
            related_record_id: paymentLogData.id
          });
        
        // Invalidate queries to ensure dashboard gets fresh data
        queryClient.invalidateQueries({ queryKey: ['schools'] });
        
        return {
          billingInfo: refreshedBilling,
          payments: updatedPayments,
          daysRemaining,
          paymentStatus,
          validUntil
        };
      }
      
      return null;
    } catch (err: any) {
      console.error("Error processing payment:", err);
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message || "Failed to record payment. Please try again.",
      });
      return null;
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  return {
    isSubmittingPayment,
    specialCase,
    setSpecialCase,
    processPayment
  };
};
