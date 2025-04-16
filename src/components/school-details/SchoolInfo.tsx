
import React from "react";
import { Building, Users, Mail, Phone } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface SchoolInfoProps {
  studentCount: number;
  email: string | null;
  phone: string | null;
}

export const SchoolInfo: React.FC<SchoolInfoProps> = ({ studentCount, email, phone }) => {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Building className="h-5 w-5" />
          School Information
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="grid grid-cols-[20px_1fr] gap-2">
            <Users className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="font-medium">{studentCount || 0} students</p>
              <p className="text-sm text-muted-foreground">Current Student Count</p>
            </div>
          </div>

          <div className="grid grid-cols-[20px_1fr] gap-2">
            <Mail className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="font-medium">{email || 'Not specified'}</p>
              <p className="text-sm text-muted-foreground">Email Address</p>
            </div>
          </div>
          
          <div className="grid grid-cols-[20px_1fr] gap-2">
            <Phone className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="font-medium">{phone || 'Not specified'}</p>
              <p className="text-sm text-muted-foreground">Phone Number</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
