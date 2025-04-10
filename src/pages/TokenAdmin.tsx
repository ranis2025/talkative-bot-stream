
import { useNavigate } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import AdminLoginForm from "@/components/token-admin/AdminLoginForm";
import TokenAdminHeader from "@/components/token-admin/TokenAdminHeader";
import TokenAdminContent from "@/components/token-admin/TokenAdminContent";
import { useAdminAuth } from "@/hooks/useAdminAuth";

const TokenAdmin = () => {
  const navigate = useNavigate();
  const { 
    isAuthenticated, 
    adminRole, 
    adminId, 
    authError, 
    handleAdminLogin, 
    handleAdminLogout 
  } = useAdminAuth();
  
  const {
    refreshAllData,
    content: adminContent
  } = TokenAdminContent({ adminRole, adminId });

  const handleBackToChat = () => {
    navigate('/chat');
  };

  const handleSuperAdminRedirect = () => {
    navigate("/auth");
  };

  if (!isAuthenticated) {
    return (
      <AdminLoginForm 
        onLogin={handleAdminLogin} 
        onBackToChat={handleBackToChat} 
        authError={authError}
        onSuperAdminRedirect={handleSuperAdminRedirect}
      />
    );
  }

  return (
    <TooltipProvider>
      <div className="container mx-auto py-8">
        <TokenAdminHeader 
          onRefresh={refreshAllData}
          onLogout={handleAdminLogout}
          onBackToChat={handleBackToChat}
        />
        {adminContent}
      </div>
    </TooltipProvider>
  );
};

export default TokenAdmin;
