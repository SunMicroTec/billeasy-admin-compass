
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  LayoutDashboard, 
  School, 
  DollarSign, 
  AlertCircle,
  Clock,
  Search,
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  ExternalLink
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

// Define the types for the school and billing data
interface School {
  id: string;
  name: string;
  address: string | null;
  contact_person: string | null;
  email: string | null;
  phone: string | null;
  created_at: string | null;
  billingInfo?: BillingInfo;
  studentCount?: number;
  daysRemaining?: number;
  paymentStatus?: string;
}

interface BillingInfo {
  id: string;
  school_id: string;
  quoted_price: number;
  total_installments: number;
  advance_paid: number | null;
  advance_paid_date: string | null;
  created_at: string | null;
  validUntil?: string;
}

const Dashboard: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<string>("daysRemaining");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  
  // Get user from localStorage
  const userString = localStorage.getItem("billeasy-user");
  const user = userString ? JSON.parse(userString) : { name: "Admin" };

  // Fetch schools and their billing info from Supabase
  useEffect(() => {
    const fetchSchools = async () => {
      try {
        setLoading(true);
        
        // Fetch schools
        const { data: schoolsData, error: schoolsError } = await supabase
          .from('schools')
          .select('*');
        
        if (schoolsError) {
          throw schoolsError;
        }

        if (!schoolsData || schoolsData.length === 0) {
          setSchools([]);
          setLoading(false);
          return;
        }

        // Fetch billing info for all schools
        const { data: billingData, error: billingError } = await supabase
          .from('billing_info')
          .select('*')
          .in('school_id', schoolsData.map(school => school.id));
        
        if (billingError) {
          throw billingError;
        }

        // Map billing info to schools
        const enrichedSchools = schoolsData.map(school => {
          const billing = billingData?.find(b => b.school_id === school.id);
          
          // Calculate days remaining and payment status
          const today = new Date();
          const advancePaidDate = billing?.advance_paid_date ? new Date(billing.advance_paid_date) : null;
          
          // Default values if no billing info exists
          let daysRemaining = 0;
          let paymentStatus = 'critical';
          let validUntil = '';
          
          if (advancePaidDate) {
            // Assuming validity is for 90 days from advance payment
            const validityPeriod = 90;
            const validUntilDate = new Date(advancePaidDate);
            validUntilDate.setDate(validUntilDate.getDate() + validityPeriod);
            validUntil = validUntilDate.toISOString();
            
            const timeDiff = validUntilDate.getTime() - today.getTime();
            daysRemaining = Math.ceil(timeDiff / (1000 * 3600 * 24));
            
            if (daysRemaining > 30) {
              paymentStatus = 'paid';
            } else if (daysRemaining > 10) {
              paymentStatus = 'overdue';
            } else {
              paymentStatus = 'critical';
            }
          }
          
          return {
            ...school,
            billingInfo: billing ? {
              ...billing,
              validUntil
            } : undefined,
            studentCount: 0, // This would need to come from another table if available
            daysRemaining,
            paymentStatus
          };
        });

        setSchools(enrichedSchools);
      } catch (error) {
        console.error('Error fetching schools:', error);
        toast({
          title: "Error",
          description: "Failed to load schools. Please try again.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchSchools();
  }, [toast]);

  // Filter and sort schools
  const filteredSchools = schools
    .filter((school) => {
      const matchesSearch = school.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "all" || school.paymentStatus === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      const fieldA = a[sortField as keyof School];
      const fieldB = b[sortField as keyof School];
      
      if (typeof fieldA === "string" && typeof fieldB === "string") {
        return sortDirection === "asc" 
          ? fieldA.localeCompare(fieldB) 
          : fieldB.localeCompare(fieldA);
      } else {
        const numA = Number(fieldA) || 0;
        const numB = Number(fieldB) || 0;
        return sortDirection === "asc" ? numA - numB : numB - numA;
      }
    });

  const totalSchools = schools.length;
  const totalStudents = schools.reduce((sum, school) => sum + (school.studentCount || 0), 0);
  const totalOutstanding = schools
    .filter(s => s.paymentStatus === "overdue" || s.paymentStatus === "critical")
    .reduce((sum, school) => {
      const billingInfo = school.billingInfo;
      if (!billingInfo) return sum;
      return sum + (billingInfo.quoted_price - (billingInfo.advance_paid || 0));
    }, 0);

  // Handle sort toggle
  const toggleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Get sort icon
  const getSortIcon = (field: string) => {
    if (sortField !== field) return <ArrowUpDown className="ml-2 h-4 w-4" />;
    return sortDirection === "asc" 
      ? <ChevronUp className="ml-2 h-4 w-4" /> 
      : <ChevronDown className="ml-2 h-4 w-4" />;
  };

  // Get status class
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome, Admin <span className="font-medium text-primary">@SunMicroTec</span>
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Schools</CardTitle>
            <School className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSchools}</div>
            <p className="text-xs text-muted-foreground">
              {totalStudents} total students
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Outstanding</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{totalOutstanding.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {schools.filter(s => s.paymentStatus !== "paid").length} schools with pending payments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Near Expiration</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{schools.filter(s => s.daysRemaining && s.daysRemaining < 30).length}</div>
            <p className="text-xs text-muted-foreground">
              Schools expiring within 30 days
            </p>
          </CardContent>
        </Card>
      </div>

      {/* School Validity Section */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Clock className="h-5 w-5" />
            School Validity Status
          </h2>
          
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search schools..."
                className="pl-9 w-full md:w-[250px]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <Select
              value={statusFilter}
              onValueChange={setStatusFilter}
            >
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[240px]">
                      <Button variant="ghost" className="-ml-4" onClick={() => toggleSort("name")}>
                        School Name {getSortIcon("name")}
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button variant="ghost" className="-ml-4" onClick={() => toggleSort("studentCount")}>
                        Students {getSortIcon("studentCount")}
                      </Button>
                    </TableHead>
                    <TableHead className="hidden md:table-cell">
                      <Button variant="ghost" className="-ml-4" onClick={() => toggleSort("billingInfo.validUntil")}>
                        Valid Until {getSortIcon("billingInfo.validUntil")}
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button variant="ghost" className="-ml-4" onClick={() => toggleSort("daysRemaining")}>
                        Days Left {getSortIcon("daysRemaining")}
                      </Button>
                    </TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center">
                        Loading schools...
                      </TableCell>
                    </TableRow>
                  ) : filteredSchools.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center">
                        No schools found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredSchools.map((school) => (
                      <TableRow key={school.id}>
                        <TableCell className="font-medium">{school.name}</TableCell>
                        <TableCell>{school.studentCount || 0}</TableCell>
                        <TableCell className="hidden md:table-cell">
                          {school.billingInfo?.validUntil 
                            ? new Date(school.billingInfo.validUntil).toLocaleDateString() 
                            : 'Not set'}
                        </TableCell>
                        <TableCell>
                          <div className={`font-medium ${
                            school.daysRemaining && school.daysRemaining < 10 
                              ? 'text-red-600 dark:text-red-400' 
                              : school.daysRemaining && school.daysRemaining < 30 
                                ? 'text-orange-600 dark:text-orange-400' 
                                : ''
                          }`}>
                            {school.daysRemaining || 0}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-md text-xs font-medium ${getStatusClass(school.paymentStatus || 'critical')}`}>
                            {school.paymentStatus === "paid" ? "Paid" : 
                             school.paymentStatus === "overdue" ? "Overdue" : "Critical"}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Link to={`/school/${school.id}`}>
                            <Button size="sm" variant="outline" className="h-8">
                              <span className="sr-only md:not-sr-only md:inline-block">View Details</span>
                              <ExternalLink className="h-4 w-4 md:ml-2" />
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
