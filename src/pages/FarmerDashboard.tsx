import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Leaf, Plus, LogOut, Package, CheckCircle, Clock, AlertCircle } from "lucide-react";

const FarmerDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [farmerDetails, setFarmerDetails] = useState<any>(null);
  const [batches, setBatches] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }
      setUser(user);

      // Fetch farmer details
      const { data: farmerData } = await supabase
        .from("farmer_details")
        .select("*")
        .eq("user_id", user.id)
        .single();

      setFarmerDetails(farmerData);

      // Fetch batches
      const { data: batchesData } = await supabase
        .from("batches")
        .select("*")
        .eq("farmer_id", user.id)
        .order("created_at", { ascending: false });

      setBatches(batchesData || []);
    } catch (error: any) {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: any = {
      pending_approval: { label: "Pending", variant: "outline", icon: Clock },
      approved: { label: "Approved", variant: "outline", icon: CheckCircle },
      ready_for_sale: { label: "Ready for Sale", variant: "default", icon: Package },
      sold: { label: "Sold", variant: "secondary", icon: CheckCircle },
    };

    const config = statusConfig[status] || statusConfig.pending_approval;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-primary text-primary-foreground py-4 shadow-md">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Leaf className="h-6 w-6" />
            <span className="text-2xl font-bold">AyurChain</span>
          </div>
          <Button variant="outline" onClick={handleLogout} className="bg-background/10 border-primary-foreground/20 text-primary-foreground hover:bg-background/20">
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Farmer Dashboard</h1>
          <p className="text-muted-foreground">Manage your herb batches and track your earnings</p>
        </div>

        {/* Status Card */}
        {!farmerDetails ? (
          <Card className="mb-8 border-warning bg-warning/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-warning" />
                Complete Your Profile
              </CardTitle>
              <CardDescription>
                You need to complete your farmer profile and get approved before creating batches
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => navigate("/farmer/profile")}>
                Complete Profile
              </Button>
            </CardContent>
          </Card>
        ) : farmerDetails.approval_status === "pending" ? (
          <Card className="mb-8 border-warning bg-warning/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-warning" />
                Approval Pending
              </CardTitle>
              <CardDescription>
                Your farmer registration is under review. You'll be able to create batches once approved.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : farmerDetails.approval_status === "rejected" ? (
          <Card className="mb-8 border-destructive bg-destructive/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-destructive" />
                Registration Rejected
              </CardTitle>
              <CardDescription>
                Your farmer registration was not approved. Please update your details and resubmit.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" onClick={() => navigate("/farmer/profile")}>
                Update Profile
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="mb-8 border-success bg-success/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-success" />
                Approved Farmer
              </CardTitle>
              <CardDescription>
                You're approved to create and manage herb batches
              </CardDescription>
            </CardHeader>
          </Card>
        )}

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{batches.length}</div>
              <p className="text-sm text-muted-foreground">Total Batches</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">
                {batches.filter(b => b.status === "pending_approval").length}
              </div>
              <p className="text-sm text-muted-foreground">Pending Approval</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">
                {batches.filter(b => b.status === "ready_for_sale").length}
              </div>
              <p className="text-sm text-muted-foreground">Ready for Sale</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">
                {batches.filter(b => b.status === "sold").length}
              </div>
              <p className="text-sm text-muted-foreground">Sold</p>
            </CardContent>
          </Card>
        </div>

        {/* Batches List */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">My Batches</h2>
          {farmerDetails?.approval_status === "approved" && (
            <Button onClick={() => navigate("/farmer/create-batch")}>
              <Plus className="h-4 w-4 mr-2" />
              Create Batch
            </Button>
          )}
        </div>

        {batches.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg font-medium mb-2">No batches yet</p>
              <p className="text-muted-foreground mb-4">
                {farmerDetails?.approval_status === "approved"
                  ? "Create your first herb batch to get started"
                  : "Complete your profile to start creating batches"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {batches.map((batch) => (
              <Card key={batch.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start mb-2">
                    <CardTitle className="text-lg">{batch.herb_name}</CardTitle>
                    {getStatusBadge(batch.status)}
                  </div>
                  <CardDescription>Batch: {batch.batch_number}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Quantity:</span>
                      <span className="font-medium">{batch.quantity_kg} kg</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Harvest Date:</span>
                      <span className="font-medium">
                        {new Date(batch.harvest_date).toLocaleDateString()}
                      </span>
                    </div>
                    {batch.price_per_kg && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Price/kg:</span>
                        <span className="font-medium">₹{batch.price_per_kg}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FarmerDashboard;