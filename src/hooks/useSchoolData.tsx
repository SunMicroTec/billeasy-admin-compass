
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

// Simplified interface for payment logs with all possible fields we need
interface PaymentLogRecord {
  id: string;
  amount: number;
  payment_date: string;
  payment_mode?: string | null;
  receipt_url?: string | null;
  created_at?: string | null;
  description?: string | null;
  student_count?: number | null;
  price_per_student?: number | null;
  is_special_case?: boolean | null;
  installment_id?: string | null;
  school_id?: string | null;
  billing_id?: string | null;
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
          
          // Simplified payment logs fetching with explicit column selection
          const fetchPaymentLogs = async () => {
            try {
              // Specify all columns we need plus school_id which needs to be added to the table
              const { data } = await supabase
                .from('payment_logs')
                .select('id, amount, payment_date, payment_mode, receipt_url, created_at, description, student_count, price_per_student, is_special_case, installment_id, billing_id, school_id');
                
              // Manually filter the results to avoid type issues
              const filteredData = data?.filter(item => {
                // Cast item to any to bypass TypeScript property check
                const itemAny = item as any;
                return itemAny.school_id === id;
              }) || [];
              
              if (filteredData.length > 0) {
                const mappedPayments = filteredData.map((log: any) => ({
                  id: log.id || 'unknown',
                  amount: log.amount || 0, 
                  date: log.payment_date || new Date().toISOString(),
                  description: log.description || "Payment",
                  studentCount: log.student_count || schoolData.student_count || 0,
                  pricePerStudent: log.price_per_student || billingData.quoted_price || 0,
                  specialCase: log.is_special_case || false
                }));
                
                setPayments(mappedPayments);
              } else {
                // Fallback if no payment logs found
                setPayments([{
                  id: '1',
                  amount: billingData.advance_paid || 0,
                  date: billingData.advance_paid_date || new Date().toISOString(),
                  description: "Initial advance payment",
                  studentCount: schoolData.student_count || 0,
                  pricePerStudent: billingData.quoted_price || 0
                }]);
              }
            } catch (err) {
              console.error("Error fetching payment logs:", err);
              // Fallback to initial payment
              setPayments([{
                id: '1',
                amount: billingData.advance_paid || 0,
                date: billingData.advance_paid_date || new Date().toISOString(),
                description: "Initial advance payment",
                studentCount: schoolData.student_count || 0,
                pricePerStudent: billingData.quoted_price || 0
              }]);
            }
          };
          
          await fetchPaymentLogs();
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
