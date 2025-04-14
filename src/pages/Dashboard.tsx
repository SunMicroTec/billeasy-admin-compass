
import React, { useState } from "react";
import { Link } from "react-router-dom";
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

// Mock data for schools
const mockSchools = [
  {
    id: 1,
    name: "National Public School",
    address: "456 Education Ave, Mumbai",
    contact: "Dr. Sharma",
    studentCount: 1250,
    pricePerStudent: 350,
    advancePaid: 200000,
    validUntil: "2025-05-15",
    paymentStatus: "paid",
    daysRemaining: 42,
  },
  {
    id: 2,
    name: "St. Joseph's High School",
    address: "789 Knowledge Blvd, Delhi",
    contact: "Fr. Thomas",
    studentCount: 850,
    pricePerStudent: 380,
    advancePaid: 150000,
    validUntil: "2025-04-30",
    paymentStatus: "paid",
    daysRemaining: 27,
  },
  {
    id: 3,
    name: "Silver Oaks International",
    address: "321 Learning Lane, Bangalore",
    contact: "Ms. Patel",
    studentCount: 1480,
    pricePerStudent: 420,
    advancePaid: 310000,
    validUntil: "2025-04-12",
    paymentStatus: "overdue",
    daysRemaining: 9,
  },
  {
    id: 4,
    name: "Greenfields Academy",
    address: "654 Wisdom Way, Chennai",
    contact: "Mr. Kumar",
    studentCount: 720,
    pricePerStudent: 340,
    advancePaid: 120000,
    validUntil: "2025-04-05",
    paymentStatus: "critical",
    daysRemaining: 2,
  },
  {
    id: 5,
    name: "New Horizon Public School",
    address: "987 Bright Street, Hyderabad",
    contact: "Dr. Reddy",
    studentCount: 1120,
    pricePerStudent: 370,
    advancePaid: 250000,
    validUntil: "2025-06-30",
    paymentStatus: "paid",
    daysRemaining: 88,
  },
  {
    id: 6,
    name: "Royal Cambridge School",
    address: "123 Elite Road, Kolkata",
    contact: "Mrs. Banerjee",
    studentCount: 650,
    pricePerStudent: 400,
    advancePaid: 180000,
    validUntil: "2025-05-28",
    paymentStatus: "paid",
    daysRemaining: 55,
  },
];

const Dashboard: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<string>("daysRemaining");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  
  // Get user from localStorage
  const userString = localStorage.getItem("billeasy-user");
  const user = userString ? JSON.parse(userString) : { name: "Admin" };

  // Filter and sort schools
  const filteredSchools = mockSchools
    .filter((school) => {
      const matchesSearch = school.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "all" || school.paymentStatus === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      const fieldA = a[sortField as keyof typeof a];
      const fieldB = b[sortField as keyof typeof b];
      
      if (typeof fieldA === "string" && typeof fieldB === "string") {
        return sortDirection === "asc" 
          ? fieldA.localeCompare(fieldB) 
          : fieldB.localeCompare(fieldA);
      } else {
        const numA = Number(fieldA);
        const numB = Number(fieldB);
        return sortDirection === "asc" ? numA - numB : numB - numA;
      }
    });

  const totalSchools = mockSchools.length;
  const totalStudents = mockSchools.reduce((sum, school) => sum + school.studentCount, 0);
  const totalOutstanding = mockSchools
    .filter(s => s.paymentStatus === "overdue" || s.paymentStatus === "critical")
    .reduce((sum, school) => sum + (school.studentCount * school.pricePerStudent - school.advancePaid), 0);

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
              {mockSchools.filter(s => s.paymentStatus !== "paid").length} schools with pending payments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Near Expiration</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockSchools.filter(s => s.daysRemaining < 30).length}</div>
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
                      <Button variant="ghost" className="-ml-4" onClick={() => toggleSort("validUntil")}>
                        Valid Until {getSortIcon("validUntil")}
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
                  {filteredSchools.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center">
                        No schools found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredSchools.map((school) => (
                      <TableRow key={school.id}>
                        <TableCell className="font-medium">{school.name}</TableCell>
                        <TableCell>{school.studentCount}</TableCell>
                        <TableCell className="hidden md:table-cell">{new Date(school.validUntil).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <div className={`font-medium ${school.daysRemaining < 10 ? 'text-red-600 dark:text-red-400' : school.daysRemaining < 30 ? 'text-orange-600 dark:text-orange-400' : ''}`}>
                            {school.daysRemaining}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-md text-xs font-medium ${getStatusClass(school.paymentStatus)}`}>
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
