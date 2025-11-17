import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Search, CheckCircle, XCircle, Leaf, Calendar, MapPin, User } from "lucide-react";
import { Link } from "react-router-dom";

const Verify = () => {
  const [batchId, setBatchId] = useState("");
  const [loading, setLoading] = useState(false);
  const [batchData, setBatchData] = useState<any>(null);

  const handleVerify = async () => {
    if (!batchId.trim()) {
      toast.error("Please enter a batch ID");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("batches")
        .select(`
          *,
          farmer:profiles!batches_farmer_id_fkey(full_name, phone)
        `)
        .eq("batch_number", batchId)
        .single();

      if (error) throw error;
      
      if (!data) {
        toast.error("Batch not found");
        setBatchData(null);
      } else {
        setBatchData(data);
        toast.success("Batch verified successfully!");
      }
    } catch (error: any) {
      toast.error("Batch not found or verification failed");
      setBatchData(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-primary text-primary-foreground py-6">
        <div className="container mx-auto px-4">
          <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity w-fit">
            <Leaf className="h-6 w-6" />
            <span className="text-2xl font-bold">AyurChain</span>
          </Link>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-4">Verify Herb Authenticity</h1>
            <p className="text-lg text-muted-foreground">
              Enter the batch ID or scan the QR code to verify product authenticity
            </p>
          </div>

          <Card className="shadow-lg mb-8">
            <CardHeader>
              <CardTitle>Enter Batch ID</CardTitle>
              <CardDescription>
                The batch ID can be found on the product packaging or QR code
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input
                  placeholder="e.g., BATCH-2024-001"
                  value={batchId}
                  onChange={(e) => setBatchId(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleVerify()}
                />
                <Button onClick={handleVerify} disabled={loading}>
                  <Search className="h-4 w-4 mr-2" />
                  {loading ? "Verifying..." : "Verify"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {batchData && (
            <Card className="shadow-lg border-success/30">
              <CardHeader className="border-b bg-success/5">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-success" />
                      Batch Verified
                    </CardTitle>
                    <CardDescription>This product is authentic and traceable</CardDescription>
                  </div>
                  <Badge variant="outline" className="bg-success/10 text-success border-success">
                    {batchData.status.replace(/_/g, " ").toUpperCase()}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                {/* Basic Info */}
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Leaf className="h-5 w-5 text-primary mt-1" />
                    <div>
                      <p className="font-semibold text-sm text-muted-foreground">Herb Name</p>
                      <p className="text-lg font-medium">{batchData.herb_name}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Calendar className="h-5 w-5 text-primary mt-1" />
                    <div>
                      <p className="font-semibold text-sm text-muted-foreground">Harvest Date</p>
                      <p className="text-lg font-medium">
                        {new Date(batchData.harvest_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <User className="h-5 w-5 text-primary mt-1" />
                    <div>
                      <p className="font-semibold text-sm text-muted-foreground">Farmer</p>
                      <p className="text-lg font-medium">{batchData.farmer?.full_name || "N/A"}</p>
                    </div>
                  </div>
                </div>

                {/* Batch Details */}
                <div className="border-t pt-6">
                  <h3 className="font-semibold mb-4">Batch Details</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Batch Number</p>
                      <p className="font-medium">{batchData.batch_number}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Quantity</p>
                      <p className="font-medium">{batchData.quantity_kg} kg</p>
                    </div>
                    {batchData.moisture_level && (
                      <div>
                        <p className="text-sm text-muted-foreground">Moisture Level</p>
                        <p className="font-medium">{batchData.moisture_level}%</p>
                      </div>
                    )}
                    {batchData.price_per_kg && (
                      <div>
                        <p className="text-sm text-muted-foreground">Price per kg</p>
                        <p className="font-medium">₹{batchData.price_per_kg}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Farming Conditions */}
                {batchData.farming_conditions && (
                  <div className="border-t pt-6">
                    <h3 className="font-semibold mb-2">Farming Conditions</h3>
                    <p className="text-muted-foreground">{batchData.farming_conditions}</p>
                  </div>
                )}

                {/* Blockchain */}
                {batchData.blockchain_tx_hash && (
                  <div className="border-t pt-6">
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-success" />
                      Blockchain Verified
                    </h3>
                    <p className="text-sm text-muted-foreground font-mono break-all">
                      {batchData.blockchain_tx_hash}
                    </p>
                  </div>
                )}

                {/* Images */}
                {batchData.images && batchData.images.length > 0 && (
                  <div className="border-t pt-6">
                    <h3 className="font-semibold mb-4">Product Images</h3>
                    <div className="grid grid-cols-2 gap-4">
                      {batchData.images.map((img: string, idx: number) => (
                        <img
                          key={idx}
                          src={img}
                          alt={`Batch ${idx + 1}`}
                          className="rounded-lg border object-cover aspect-square"
                        />
                      ))}
                    </div>
                  </div>
                )}

                <div className="border-t pt-6">
                  <div className="bg-success/10 border border-success/30 rounded-lg p-4 flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-success mt-0.5" />
                    <div>
                      <p className="font-semibold text-success">Authenticity Verified</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        This product has been verified through our blockchain-powered supply chain system
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Verify;