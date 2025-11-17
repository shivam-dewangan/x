import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Leaf, LogOut, ShoppingCart, Package, Receipt } from "lucide-react";

const CompanyDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [availableBatches, setAvailableBatches] = useState<any[]>([]);
  const [myPurchases, setMyPurchases] = useState<any[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<any>(null);
  const [purchaseQuantity, setPurchaseQuantity] = useState("");
  const [purchaseDialogOpen, setPurchaseDialogOpen] = useState(false);

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

      // Fetch available batches
      const { data: batchesData } = await supabase
        .from("batches")
        .select(`
          *,
          farmer:profiles!batches_farmer_id_fkey(full_name, phone)
        `)
        .eq("status", "ready_for_sale")
        .order("created_at", { ascending: false });

      setAvailableBatches(batchesData || []);

      // Fetch my purchases
      const { data: purchasesData } = await supabase
        .from("purchases")
        .select(`
          *,
          batch:batches(herb_name, batch_number, harvest_date),
          farmer:profiles!purchases_farmer_id_fkey(full_name)
        `)
        .eq("company_id", user.id)
        .order("created_at", { ascending: false });

      setMyPurchases(purchasesData || []);
    } catch (error: any) {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async () => {
    if (!selectedBatch || !purchaseQuantity) {
      toast.error("Please enter purchase quantity");
      return;
    }

    const quantity = parseFloat(purchaseQuantity);
    if (quantity <= 0 || quantity > selectedBatch.quantity_kg) {
      toast.error("Invalid quantity");
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const totalAmount = quantity * (selectedBatch.price_per_kg || 0);
      const farmerAmount = totalAmount * 0.8;
      const platformAmount = totalAmount * 0.2;

      const { error } = await supabase.from("purchases").insert({
        batch_id: selectedBatch.id,
        company_id: user.id,
        farmer_id: selectedBatch.farmer_id,
        quantity_kg: quantity,
        total_amount: totalAmount,
        farmer_amount: farmerAmount,
        platform_amount: platformAmount,
        payment_status: "completed",
      });

      if (error) throw error;

      // Update batch status
      await supabase
        .from("batches")
        .update({ status: "sold" })
        .eq("id", selectedBatch.id);

      toast.success("Purchase successful!");
      setPurchaseDialogOpen(false);
      setPurchaseQuantity("");
      setSelectedBatch(null);
      fetchData();
    } catch (error: any) {
      toast.error(error.message || "Failed to complete purchase");
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
            <span className="text-2xl font-bold">AyurChain Marketplace</span>
          </div>
          <Button variant="outline" onClick={handleLogout} className="bg-background/10 border-primary-foreground/20 text-primary-foreground hover:bg-background/20">
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Company Dashboard</h1>
          <p className="text-muted-foreground">Browse and purchase verified Ayurvedic herbs</p>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 bg-success/10 rounded-lg flex items-center justify-center">
                  <ShoppingCart className="h-6 w-6 text-success" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{availableBatches.length}</div>
                  <p className="text-sm text-muted-foreground">Available Batches</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 bg-accent/10 rounded-lg flex items-center justify-center">
                  <Receipt className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{myPurchases.length}</div>
                  <p className="text-sm text-muted-foreground">My Purchases</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Available Batches */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-6">Available Herbs</h2>
          
          {availableBatches.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg font-medium mb-2">No batches available</p>
                <p className="text-muted-foreground">Check back later for new herb batches</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {availableBatches.map((batch) => (
                <Card key={batch.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start mb-2">
                      <CardTitle className="text-lg">{batch.herb_name}</CardTitle>
                      <Badge variant="default">For Sale</Badge>
                    </div>
                    <CardDescription>From {batch.farmer?.full_name}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Batch:</span>
                          <span className="font-medium">{batch.batch_number}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Available:</span>
                          <span className="font-medium">{batch.quantity_kg} kg</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Price/kg:</span>
                          <span className="font-medium text-primary">₹{batch.price_per_kg || "N/A"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Harvest:</span>
                          <span className="font-medium">
                            {new Date(batch.harvest_date).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      
                      <Dialog open={purchaseDialogOpen && selectedBatch?.id === batch.id} onOpenChange={(open) => {
                        setPurchaseDialogOpen(open);
                        if (!open) setSelectedBatch(null);
                      }}>
                        <DialogTrigger asChild>
                          <Button className="w-full" onClick={() => setSelectedBatch(batch)}>
                            <ShoppingCart className="h-4 w-4 mr-2" />
                            Purchase
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Purchase {batch.herb_name}</DialogTitle>
                            <DialogDescription>
                              Enter the quantity you want to purchase (max {batch.quantity_kg} kg)
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 pt-4">
                            <div className="space-y-2">
                              <Label htmlFor="quantity">Quantity (kg)</Label>
                              <Input
                                id="quantity"
                                type="number"
                                placeholder="Enter quantity"
                                value={purchaseQuantity}
                                onChange={(e) => setPurchaseQuantity(e.target.value)}
                                max={batch.quantity_kg}
                                min="0.1"
                                step="0.1"
                              />
                            </div>
                            {purchaseQuantity && batch.price_per_kg && (
                              <div className="bg-muted p-4 rounded-lg space-y-2">
                                <div className="flex justify-between text-sm">
                                  <span>Total Amount:</span>
                                  <span className="font-bold">₹{(parseFloat(purchaseQuantity) * batch.price_per_kg).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-sm text-muted-foreground">
                                  <span>Farmer receives (80%):</span>
                                  <span>₹{(parseFloat(purchaseQuantity) * batch.price_per_kg * 0.8).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-sm text-muted-foreground">
                                  <span>Platform fee (20%):</span>
                                  <span>₹{(parseFloat(purchaseQuantity) * batch.price_per_kg * 0.2).toFixed(2)}</span>
                                </div>
                              </div>
                            )}
                            <Button onClick={handlePurchase} className="w-full">
                              Confirm Purchase
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* My Purchases */}
        <div>
          <h2 className="text-2xl font-bold mb-6">My Purchases</h2>
          
          {myPurchases.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Receipt className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg font-medium mb-2">No purchases yet</p>
                <p className="text-muted-foreground">Your purchase history will appear here</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {myPurchases.map((purchase) => (
                <Card key={purchase.id}>
                  <CardContent className="pt-6">
                    <div className="grid md:grid-cols-5 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Herb</p>
                        <p className="font-medium">{purchase.batch?.herb_name}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Batch</p>
                        <p className="font-medium">{purchase.batch?.batch_number}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Quantity</p>
                        <p className="font-medium">{purchase.quantity_kg} kg</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Amount</p>
                        <p className="font-medium">₹{purchase.total_amount}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Date</p>
                        <p className="font-medium">{new Date(purchase.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CompanyDashboard;