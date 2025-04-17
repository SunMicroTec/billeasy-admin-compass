
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// Simplified types to avoid deep type instantiation
interface School {
  id: string;
  name: string;
  address: string | null;
  contact_person: string | null;
  email: string | null;
  phone: string | null;
  student_count: number | null;
  created_at: string | null;
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

// Simple type for payment logs from the database
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
  [key: string]: any; // Allow additional fields with index signature
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
        
        // Use type assertion to avoid deep nesting
        setSchool(schoolData as School);
        
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
          // Type assertion
          const typedBillingData = billingData as BillingInfo;
          setBillingInfo(typedBillingData);
          
          if (typedBillingData.advance_paid_date) {
            const advancePaidDate = new Date(typedBillingData.advance_paid_date);
            
            const totalAnnualFees = (schoolData.student_count || 0) * typedBillingData.quoted_price;
            
            const pricePerDay = totalAnnualFees / 365;
            
            const daysOfValidity = pricePerDay > 0 ? Math.floor((typedBillingData.advance_paid || 0) / pricePerDay) : 0;
            
            const validUntilDate = new Date(advancePaidDate);
            validUntilDate.setDate(validUntilDate.getDate() + daysOfValidity);
            
            const today = new Date();
            const timeDiff = validUntilDate.getTime() - today.getTime();
            const days = Math.ceil(timeDiff / (1000 * 3600 * 24));
            
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
          
          // Simplified payment logs fetching
          try {
            // Get all payment logs
            const { data } = await supabase
              .from('payment_logs')
              .select('*');
              
            if (!data || data.length === 0) {
              // Fallback if no payment logs found
              setPayments([{
                id: '1',
                amount: typedBillingData.advance_paid || 0,
                date: typedBillingData.advance_paid_date || new Date().toISOString(),
                description: "Initial advance payment",
                studentCount: schoolData.student_count || 0,
                pricePerStudent: typedBillingData.quoted_price || 0
              }]);
              return;
            }
            
            // Type assertion to avoid deep recursion
            const allLogs = data as PaymentLogRecord[];
            
            // Filter logs for this school
            const schoolLogs = allLogs.filter(log => 
              log && log.school_id === id
            );
            
            if (schoolLogs.length > 0) {
              // Map to Payment type with direct property access
              const mappedPayments = schoolLogs.map(log => ({
                id: log.id,
                amount: log.amount, 
                date: log.payment_date,
                description: log.description || "Payment",
                studentCount: log.student_count || schoolData.student_count || 0,
                pricePerStudent: log.price_per_student || typedBillingData.quoted_price || 0,
                specialCase: log.is_special_case || false
              }));
              
              setPayments(mappedPayments);
            } else {
              // Fallback
              setPayments([{
                id: '1',
                amount: typedBillingData.advance_paid || 0,
                date: typedBillingData.advance_paid_date || new Date().toISOString(),
                description: "Initial advance payment",
                studentCount: schoolData.student_count || 0,
                pricePerStudent: typedBillingData.quoted_price || 0
              }]);
            }
          } catch (err) {
            console.error("Error fetching payment logs:", err);
            // Fallback
            setPayments([{
              id: '1',
              amount: typedBillingData.advance_paid || 0,
              date: typedBillingData.advance_paid_date || new Date().toISOString(),
              description: "Initial advance payment",
              studentCount: schoolData.student_count || 0,
              pricePerStudent: typedBillingData.quoted_price || 0
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
