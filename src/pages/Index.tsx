import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ToolSidebar from '@/components/designer/ToolSidebar';
import ToolPanel from '@/components/designer/ToolPanel';
import TopToolbar from '@/components/designer/TopToolbar';
import DesignCanvas from '@/components/designer/DesignCanvas';
import ViewTabs from '@/components/designer/ViewTabs';
import ZoomControls from '@/components/designer/ZoomControls';
import SaveProductDialog from '@/components/designer/SaveProductDialog';
import { useAuth } from '@/contexts/AuthContext';

export default function Index() {
  const [saveOpen, setSaveOpen] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleSaveClick = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    setSaveOpen(true);
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <TopToolbar />

      <div className="flex flex-1 overflow-hidden">
        <div className="flex">
          <div className="flex flex-col items-center w-10 border-r border-border pt-4">
            <button className="p-2 rounded-lg hover:bg-accent text-muted-foreground" onClick={() => navigate('/')}>
              <ArrowLeft className="w-4 h-4" />
            </button>
          </div>
          <ToolSidebar />
        </div>

        <ToolPanel />

        <div className="flex-1 flex flex-col overflow-hidden">
          <DesignCanvas />

          <div className="py-3 bg-canvas border-t border-border">
            <ViewTabs />
          </div>

          <div className="flex items-center justify-between px-4 py-2 border-t border-border bg-background">
            <ZoomControls />
            <button
              className="px-8 py-2 text-sm font-medium border border-border rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              onClick={handleSaveClick}
            >
              Save product
            </button>
          </div>
        </div>
      </div>

      <SaveProductDialog open={saveOpen} onOpenChange={setSaveOpen} />
    </div>
  );
}
