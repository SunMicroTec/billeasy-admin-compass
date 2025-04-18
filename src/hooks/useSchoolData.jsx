
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useSchoolData = (id) => {
  const { toast } = useToast();
  
  const [school, setSchool] = useState(null);
  const [billingInfo, setBillingInfo] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [daysRemaining, setDaysRemaining] = useState(0);
  const [paymentStatus, setPaymentStatus] = useState('critical');
  const [validUntil, setValidUntil] = useState(null);

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
            
            const pricePerDay = totalAnnualFees / 365;
            
            const daysOfValidity = pricePerDay > 0 ? Math.floor((billingData.advance_paid || 0) / pricePerDay) : 0;
            
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
              .select('*')
              .eq('school_id', id);
              
            if (!data || data.length === 0) {
              // Fallback if no payment logs found
              setPayments([{
                id: '1',
                amount: billingData.advance_paid || 0,
                date: billingData.advance_paid_date || new Date().toISOString(),
                description: "Initial advance payment",
                studentCount: schoolData.student_count || 0,
                pricePerStudent: billingData.quoted_price || 0
              }]);
              return;
            }
            
            // Map to Payment type
            const mappedPayments = data.map((log) => ({
              id: log.id,
              amount: log.amount, 
              date: log.payment_date,
              description: log.description || "Payment",
              studentCount: log.student_count || schoolData.student_count || 0,
              pricePerStudent: log.price_per_student || billingData.quoted_price || 0,
              specialCase: log.is_special_case || false
            }));
            
            setPayments(mappedPayments);
          } catch (err) {
            console.error("Error fetching payment logs:", err);
            // Fallback
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
        
      } catch (err) {
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
