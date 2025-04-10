
import { Database } from "lucide-react";
import MagicTokenLookupCard from "@/components/db-admin/MagicTokenLookupCard";
import CustomQueryCard from "@/components/db-admin/CustomQueryCard";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const DbAdmin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  // Check auth on load
  useEffect(() => {
    const role = sessionStorage.getItem("admin_role");
    const username = sessionStorage.getItem("admin_username");
    
    if (!role || !username) {
      navigate("/auth");
      return;
    }
    
    if (role !== "super_admin") {
      toast({
        title: "Доступ запрещен",
        description: "У вас нет прав для доступа к этой странице",
        variant: "destructive"
      });
      navigate("/token-admin");
      return;
    }
  }, [navigate, toast]);

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6 flex items-center gap-2">
        <Database className="h-8 w-8" /> Database Admin Panel
      </h1>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Magic Token Lookup */}
        <MagicTokenLookupCard />
        
        {/* Custom SQL Query */}
        <CustomQueryCard defaultQuery="SELECT * FROM admin_roles" />
      </div>
    </div>
  );
};

export default DbAdmin;
