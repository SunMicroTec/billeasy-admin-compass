
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage,
  FormDescription
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Calculator,
  Calendar,
  PlusCircle,
  Building,
  Phone,
  Mail,
  User,
  Users,
  DollarSign,
  FileText,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

// Form schema for adding a new school
const addSchoolSchema = z.object({
  // School details
  name: z.string().min(3, "School name must be at least 3 characters"),
  address: z.string().min(5, "Please enter a valid address"),
  contactPerson: z.string().min(2, "Contact person name is required"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  
  // Billing details
  studentCount: z.coerce.number().min(1, "Student count must be at least 1"),
  pricePerStudent: z.coerce.number().min(1, "Price per student must be at least 1"),
  advancePaid: z.coerce.number().min(0, "Advance paid must be a positive number"),
});

type AddSchoolFormValues = z.infer<typeof addSchoolSchema>;

const AddSchool: React.FC = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [calculatedValidity, setCalculatedValidity] = useState<Date | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Initialize form with defaults
  const form = useForm<AddSchoolFormValues>({
    resolver: zodResolver(addSchoolSchema),
    defaultValues: {
      name: "",
      address: "",
      contactPerson: "",
      email: "",
      phone: "",
      studentCount: 0,
      pricePerStudent: 0,
      advancePaid: 0,
    },
  });

  // Watch form fields for calculating validity
  const studentCount = form.watch("studentCount");
  const pricePerStudent = form.watch("pricePerStudent");
  const advancePaid = form.watch("advancePaid");
  
  // Calculate validity whenever relevant fields change
  React.useEffect(() => {
    if (studentCount > 0 && pricePerStudent > 0) {
      const totalAmount = studentCount * pricePerStudent;
      const advancePaidValue = advancePaid || 0;
      
      if (advancePaidValue > 0 && totalAmount > 0) {
        const paymentRatio = advancePaidValue / totalAmount;
        const daysInYear = 365;
        const validityDays = Math.floor(paymentRatio * daysInYear);
        
        const validUntil = new Date();
        validUntil.setDate(validUntil.getDate() + validityDays);
        
        setCalculatedValidity(validUntil);
      } else {
        setCalculatedValidity(null);
      }
    } else {
      setCalculatedValidity(null);
    }
  }, [studentCount, pricePerStudent, advancePaid]);

  const onSubmit = async (data: AddSchoolFormValues) => {
    setIsSubmitting(true);
    
    try {
      // Step 1: Insert the school information
      const { data: schoolData, error: schoolError } = await supabase
        .from('schools')
        .insert({
          name: data.name,
          address: data.address,
          contact_person: data.contactPerson,
          email: data.email,
          phone: data.phone
        })
        .select()
        .single();
      
      if (schoolError) throw schoolError;
      
      // Step 2: Create billing information
      const schoolId = schoolData.id;
      const { error: billingError } = await supabase
        .from('billing_info')
        .insert({
          school_id: schoolId,
          quoted_price: data.pricePerStudent,
          advance_paid: data.advancePaid,
          advance_paid_date: new Date().toISOString().split('T')[0],
          total_installments: 12 // Default to monthly installments for a year
        });
        
      if (billingError) throw billingError;
      
      // Success notification
      toast({
        title: "School Added Successfully",
        description: `${data.name} has been added to the system.`,
      });
      
      navigate("/dashboard");
    } catch (error: any) {
      console.error("Error adding school:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to add school. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Add New School</h1>
        <p className="text-muted-foreground">
          Register a new school to start tracking payments
        </p>
      </div>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {/* School Information Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                School Information
              </CardTitle>
              <CardDescription>
                Enter the basic details about the school
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>School Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. National Public School" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Input placeholder="School Address" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="contactPerson"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Person</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input 
                            placeholder="Name of contact" 
                            className="pl-8"
                            {...field} 
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input 
                            placeholder="Email address" 
                            type="email"
                            className="pl-8" 
                            {...field} 
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input 
                            placeholder="School phone"
                            className="pl-8" 
                            {...field} 
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Billing Details Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Billing Details
              </CardTitle>
              <CardDescription>
                Configure billing information for the school
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="studentCount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Number of Students</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Users className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input 
                            type="number" 
                            className="pl-8"
                            placeholder="0" 
                            {...field} 
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="pricePerStudent"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price Per Student (Yearly)</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input 
                            type="number" 
                            className="pl-8" 
                            placeholder="0" 
                            {...field} 
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="advancePaid"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Advance Paid</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input 
                            type="number" 
                            className="pl-8" 
                            placeholder="0" 
                            {...field} 
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Billing Summary */}
              <Card className="bg-muted/40 border-dashed">
                <CardHeader className="py-4">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Calculator className="h-4 w-4" />
                    Billing Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="py-2">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Annual Amount:</span>
                      <span className="font-medium">
                        {isNaN(studentCount * pricePerStudent) ? "₹0" : `₹${(studentCount * pricePerStudent).toLocaleString()}`}
                      </span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Advance Paid:</span>
                      <span className="font-medium">
                        {isNaN(advancePaid) ? "₹0" : `₹${Number(advancePaid).toLocaleString()}`}
                      </span>
                    </div>
                    
                    <Separator />
                    
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Balance Due:</span>
                      <span className="font-medium">
                        {isNaN(studentCount * pricePerStudent - advancePaid) ? 
                          "₹0" : 
                          `₹${Math.max(0, (studentCount * pricePerStudent - advancePaid)).toLocaleString()}`
                        }
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center pt-2">
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        Valid Until:
                      </span>
                      <span className="font-medium">
                        {calculatedValidity ? 
                          calculatedValidity.toLocaleDateString() : 
                          "Not calculated"
                        }
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          </Card>

          {/* Submit buttons */}
          <div className="flex flex-col sm:flex-row justify-end gap-3">
            <Button 
              type="button" 
              variant="outline"
              onClick={() => navigate("/dashboard")}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="gap-2 bg-billeasy-purple hover:bg-billeasy-dark-purple"
              disabled={isSubmitting}
            >
              <PlusCircle className="h-4 w-4" />
              {isSubmitting ? "Adding School..." : "Add School"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default AddSchool;
