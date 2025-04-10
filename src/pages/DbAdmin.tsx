
import { Database } from "lucide-react";
import MagicTokenLookupCard from "@/components/db-admin/MagicTokenLookupCard";
import CustomQueryCard from "@/components/db-admin/CustomQueryCard";

const DbAdmin = () => {
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
