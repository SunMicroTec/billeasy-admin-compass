
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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
  specialCase?: boolean;
}

// Define the structure of payment_logs table as returned from Supabase
interface PaymentLogRecord {
  id: string;
  school_id: string;
  billing_id: string | null;
  amount: number;
  payment_date: string;
  description: string | null;
  payment_mode: string | null;
  created_at: string | null;
  student_count: number | null;
  price_per_student: number | null;
  is_special_case: boolean | null;
}

// Simple type for raw data from Supabase
interface RawPaymentLogData {
  id: string;
  amount: number;
  payment_date: string;
  description?: string | null;
  payment_mode?: string | null;
  created_at?: string | null;
  student_count?: number | null;
  price_per_student?: number | null;
  is_special_case?: boolean | null;
  [key: string]: any;
}

interface UseSchoolDataReturn {
  school: School | null;
  billingInfo: BillingInfo | null;
  payments: Payment[];
  loading: boolean;
  error: string | null;
  daysRemaining: number;
  paymentStatus: string;
  validUntil: string | null;
}

export const useSchoolData = (id: string | undefined): UseSchoolDataReturn => {
  const { toast } = useToast();
  
  const [school, setSchool] = useState<School | null>(null);
  const [billingInfo, setBillingInfo] = useState<BillingInfo | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [daysRemaining, setDaysRemaining] = useState(0);
  const [paymentStatus, setPaymentStatus] = useState('critical');
  const [validUntil, setValidUntil] = useState<string | null>(null);

  useEffect(() => {
    const fetchSchoolData = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // Fetch school data
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
        
        // Fetch billing info
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
          
          // Retrieve payment history from payment_logs table in supabase
          const { data: paymentLogsData, error: paymentLogsError } = await supabase
            .from('payment_logs')
            .select('*')
            .eq('school_id', id)
            .order('payment_date', { ascending: false });
            
          if (paymentLogsError) {
            console.error("Error fetching payment logs:", paymentLogsError);
            // Don't throw here, just continue with what we have
          }
          
          // If we have payment logs, use them
          if (paymentLogsData && paymentLogsData.length > 0) {
            // Use a simpler approach without complex type mapping
            const mappedPayments: Payment[] = [];
            
            for (const log of paymentLogsData) {
              mappedPayments.push({
                id: log.id,
                amount: log.amount,
                date: log.payment_date,
                description: log.description || "Payment",
                studentCount: log.student_count || schoolData.student_count || 0,
                pricePerStudent: log.price_per_student || billingData.quoted_price || 0,
                specialCase: log.is_special_case || false
              });
            }
            
            setPayments(mappedPayments);
          } else {
            // If no payment logs found, use the initial payment as fallback
            setPayments([{
              id: '1',
              amount: billingData.advance_paid || 0,
              date: billingData.advance_paid_date || new Date().toISOString(),
              description: "Initial advance payment",
              studentCount: schoolData.student_count || 0,
              pricePerStudent: billingData.quoted_price || 0
            }]);
          }
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
  }, [id, toast]);

  return {
    school,
    billingInfo,
    payments,
    loading,
    error,
    daysRemaining,
    paymentStatus,
    validUntil
  };
};
