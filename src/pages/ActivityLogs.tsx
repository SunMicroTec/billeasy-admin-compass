
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, History, ReceiptText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ActionLog {
  id: string;
  action_type: string;
  description: string;
  performed_by: string;
  created_at: string;
  school_id: string | null;
  school_name?: string;
}

interface PaymentLog {
  id: string;
  school_id: string;
  school_name?: string;
  billing_id: string | null;
  amount: number;
  payment_date: string;
  description: string | null;
  payment_mode: string | null;
  created_at: string;
  student_count: number | null;
  price_per_student: number | null;
  is_special_case: boolean | null;
}

const ActivityLogs = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [actionLogs, setActionLogs] = useState<ActionLog[]>([]);
  const [paymentLogs, setPaymentLogs] = useState<PaymentLog[]>([]);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        setLoading(true);
        
        // Fetch action logs
        const { data: actionsData, error: actionsError } = await supabase
          .from('action_logs')
          .select(`
            *,
            schools:school_id (name)
          `)
          .order('created_at', { ascending: false });
        
        if (actionsError) throw actionsError;
        
        const formattedActionLogs = actionsData.map(log => ({
          ...log,
          school_name: log.schools?.name
        }));
        
        setActionLogs(formattedActionLogs);
        
        // Fetch payment logs
        const { data: paymentsData, error: paymentsError } = await supabase
          .from('payment_logs')
          .select(`
            *,
            schools:school_id (name)
          `)
          .order('payment_date', { ascending: false });
        
        if (paymentsError) throw paymentsError;
        
        const formattedPaymentLogs = paymentsData.map(log => ({
          ...log,
          school_name: log.schools?.name
        }));
        
        setPaymentLogs(formattedPaymentLogs);
      } catch (error: any) {
        console.error("Error fetching logs:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: error.message || "Failed to load logs",
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchLogs();
  }, [toast]);
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'school_added':
        return '🏫';
      case 'school_deleted':
        return '🗑️';
      case 'payment_added':
        return '💰';
      default:
        return '📝';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Button 
            variant="outline" 
            className="mb-4" 
            onClick={() => navigate("/dashboard")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Activity Logs</h1>
          <p className="text-muted-foreground mb-4">View all actions and payment records</p>
        </div>
      </div>
      
      <Tabs defaultValue="actions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="actions" className="flex items-center gap-1">
            <History className="h-4 w-4" />
            Action Logs
          </TabsTrigger>
          <TabsTrigger value="payments" className="flex items-center gap-1">
            <ReceiptText className="h-4 w-4" />
            Payment Logs
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="actions">
          <Card>
            <CardHeader>
              <CardTitle>System Actions</CardTitle>
              <CardDescription>All actions performed in the system</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center items-center h-40">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Action</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>School</TableHead>
                      <TableHead>Date & Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {actionLogs.length > 0 ? (
                      actionLogs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{getActionIcon(log.action_type)}</span>
                              <span className="capitalize">{log.action_type.replace(/_/g, ' ')}</span>
                            </div>
                          </TableCell>
                          <TableCell>{log.description}</TableCell>
                          <TableCell>
                            {log.school_name ? (
                              <Button 
                                variant="link" 
                                className="p-0 h-auto" 
                                onClick={() => navigate(`/school/${log.school_id}`)}
                              >
                                {log.school_name}
                              </Button>
                            ) : (
                              "N/A"
                            )}
                          </TableCell>
                          <TableCell>{formatDate(log.created_at)}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                          No action logs found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="payments">
          <Card>
            <CardHeader>
              <CardTitle>Payment History</CardTitle>
              <CardDescription>All payment transactions across all schools</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center items-center h-40">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>School</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paymentLogs.length > 0 ? (
                      paymentLogs.map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell>
                            <Button 
                              variant="link" 
                              className="p-0 h-auto" 
                              onClick={() => navigate(`/school/${payment.school_id}`)}
                            >
                              {payment.school_name}
                            </Button>
                          </TableCell>
                          <TableCell className="font-medium">
                            ₹{payment.amount.toLocaleString()}
                          </TableCell>
                          <TableCell>{payment.description || "Payment"}</TableCell>
                          <TableCell>{new Date(payment.payment_date).toLocaleDateString()}</TableCell>
                          <TableCell>
                            {payment.is_special_case && (
                              <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded-full">
                                Special case
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          No payment records found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ActivityLogs;
