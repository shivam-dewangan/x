import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Leaf, LogOut, Users, Package, CheckCircle, XCircle, Clock } from "lucide-react";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [pendingFarmers, setPendingFarmers] = useState<any[]>([]);
  const [pendingBatches, setPendingBatches] = useState<any[]>([]);
  const [allPurchases, setAllPurchases] = useState<any[]>([]);

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

      // Fetch pending farmers
      const { data: farmersData } = await supabase
        .from("farmer_details")
        .select(`
          *,
          user:profiles!farmer_details_user_id_fkey(full_name, phone)
        `)
        .eq("approval_status", "pending")
        .order("created_at", { ascending: false });

      setPendingFarmers(farmersData || []);

      // Fetch pending batches
      const { data: batchesData } = await supabase
        .from("batches")
        .select(`
          *,
          farmer:profiles!batches_farmer_id_fkey(full_name)
        `)
        .eq("status", "pending_approval")
        .order("created_at", { ascending: false });

      setPendingBatches(batchesData || []);

      // Fetch all purchases
      const { data: purchasesData } = await supabase
        .from("purchases")
        .select(`
          *,
          batch:batches(herb_name, batch_number),
          company:profiles!purchases_company_id_fkey(full_name),
          farmer:profiles!purchases_farmer_id_fkey(full_name)
        `)
        .order("created_at", { ascending: false });

      setAllPurchases(purchasesData || []);
    } catch (error: any) {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleApproveFarmer = async (farmerId: string) => {
    try {
      const { error } = await supabase
        .from("farmer_details")
        .update({
          approval_status: "approved",
          approved_at: new Date().toISOString(),
        })
        .eq("id", farmerId);

      if (error) throw error;

      toast.success("Farmer approved successfully!");
      fetchData();
    } catch (error: any) {
      toast.error("Failed to approve farmer");
    }
  };

  const handleRejectFarmer = async (farmerId: string) => {
    try {
      const { error } = await supabase
        .from("farmer_details")
        .update({
          approval_status: "rejected",
        })
        .eq("id", farmerId);

      if (error) throw error;

      toast.success("Farmer rejected");
      fetchData();
    } catch (error: any) {
      toast.error("Failed to reject farmer");
    }
  };

  const handleApproveBatch = async (batchId: string) => {
    try {
      // Generate QR code data (batch ID)
      const { data: batch } = await supabase
        .from("batches")
        .select("batch_number")
        .eq("id", batchId)
        .single();

      const { error } = await supabase
        .from("batches")
        .update({
          status: "ready_for_sale",
          qr_code_data: batch?.batch_number,
        })
        .eq("id", batchId);

      if (error) throw error;

      toast.success("Batch approved for sale!");
      fetchData();
    } catch (error: any) {
      toast.error("Failed to approve batch");
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
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
            <span className="text-2xl font-bold">AyurChain Admin</span>
          </div>
          <Button variant="outline" onClick={handleLogout} className="bg-background/10 border-primary-foreground/20 text-primary-foreground hover:bg-background/20">
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage farmer registrations, batch approvals, and purchases</p>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 bg-warning/10 rounded-lg flex items-center justify-center">
                  <Users className="h-6 w-6 text-warning" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{pendingFarmers.length}</div>
                  <p className="text-sm text-muted-foreground">Pending Farmers</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 bg-accent/10 rounded-lg flex items-center justify-center">
                  <Package className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{pendingBatches.length}</div>
                  <p className="text-sm text-muted-foreground">Pending Batches</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 bg-success/10 rounded-lg flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-success" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{allPurchases.length}</div>
                  <p className="text-sm text-muted-foreground">Total Purchases</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="farmers" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="farmers">Farmers</TabsTrigger>
            <TabsTrigger value="batches">Batches</TabsTrigger>
            <TabsTrigger value="purchases">Purchases</TabsTrigger>
          </TabsList>

          <TabsContent value="farmers" className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">Pending Farmer Approvals</h2>
            </div>
            
            {pendingFarmers.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-lg font-medium mb-2">No pending approvals</p>
                  <p className="text-muted-foreground">All farmer registrations are up to date</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {pendingFarmers.map((farmer) => (
                  <Card key={farmer.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle>{farmer.user?.full_name}</CardTitle>
                          <CardDescription>{farmer.farm_name}</CardDescription>
                        </div>
                        <Badge variant="outline" className="gap-1">
                          <Clock className="h-3 w-3" />
                          Pending
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-muted-foreground">Farm Location</p>
                            <p className="font-medium">{farmer.farm_location}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Phone</p>
                            <p className="font-medium">{farmer.user?.phone || "N/A"}</p>
                          </div>
                          {farmer.certifications && farmer.certifications.length > 0 && (
                            <div className="md:col-span-2">
                              <p className="text-sm text-muted-foreground">Certifications</p>
                              <div className="flex gap-2 flex-wrap mt-1">
                                {farmer.certifications.map((cert: string, idx: number) => (
                                  <Badge key={idx} variant="secondary">{cert}</Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2 pt-4">
                          <Button onClick={() => handleApproveFarmer(farmer.id)} className="flex-1">
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Approve
                          </Button>
                          <Button variant="destructive" onClick={() => handleRejectFarmer(farmer.id)} className="flex-1">
                            <XCircle className="h-4 w-4 mr-2" />
                            Reject
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="batches" className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">Pending Batch Approvals</h2>
            </div>
            
            {pendingBatches.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-lg font-medium mb-2">No pending batches</p>
                  <p className="text-muted-foreground">All batches have been reviewed</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {pendingBatches.map((batch) => (
                  <Card key={batch.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle>{batch.herb_name}</CardTitle>
                          <CardDescription>By {batch.farmer?.full_name}</CardDescription>
                        </div>
                        <Badge variant="outline" className="gap-1">
                          <Clock className="h-3 w-3" />
                          Pending
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Batch Number:</span>
                            <span className="font-medium">{batch.batch_number}</span>
                          </div>
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
                          {batch.moisture_level && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Moisture:</span>
                              <span className="font-medium">{batch.moisture_level}%</span>
                            </div>
                          )}
                        </div>
                        {batch.farming_conditions && (
                          <div>
                            <p className="text-sm text-muted-foreground mb-1">Farming Conditions:</p>
                            <p className="text-sm">{batch.farming_conditions}</p>
                          </div>
                        )}
                        <Button onClick={() => handleApproveBatch(batch.id)} className="w-full">
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Approve for Sale
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="purchases" className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">All Purchases</h2>
            </div>
            
            {allPurchases.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-lg font-medium mb-2">No purchases yet</p>
                  <p className="text-muted-foreground">Purchases will appear here when companies buy herbs</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {allPurchases.map((purchase) => (
                  <Card key={purchase.id}>
                    <CardContent className="pt-6">
                      <div className="grid md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Batch</p>
                          <p className="font-medium">{purchase.batch?.herb_name}</p>
                          <p className="text-xs text-muted-foreground">{purchase.batch?.batch_number}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Company</p>
                          <p className="font-medium">{purchase.company?.full_name}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Farmer</p>
                          <p className="font-medium">{purchase.farmer?.full_name}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Amount</p>
                          <p className="font-medium">₹{purchase.total_amount}</p>
                          <p className="text-xs text-muted-foreground">
                            Farmer: ₹{purchase.farmer_amount} | Platform: ₹{purchase.platform_amount}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;