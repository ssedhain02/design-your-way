import { ArrowLeft } from 'lucide-react';
import ToolSidebar from '@/components/designer/ToolSidebar';
import ToolPanel from '@/components/designer/ToolPanel';
import TopToolbar from '@/components/designer/TopToolbar';
import DesignCanvas from '@/components/designer/DesignCanvas';
import ViewTabs from '@/components/designer/ViewTabs';
import ZoomControls from '@/components/designer/ZoomControls';
import BottomBar from '@/components/designer/BottomBar';

export default function Index() {
  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Top toolbar */}
      <TopToolbar />

      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar - back arrow + tools */}
        <div className="flex">
          {/* Back button column */}
          <div className="flex flex-col items-center w-10 border-r border-border pt-4">
            <button className="p-2 rounded-lg hover:bg-accent text-muted-foreground">
              <ArrowLeft className="w-4 h-4" />
            </button>
          </div>
          {/* Tool icons */}
          <ToolSidebar />
        </div>

        {/* Tool panel (contextual) */}
        <ToolPanel />

        {/* Main canvas area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <DesignCanvas />

          {/* View tabs */}
          <div className="py-3 bg-canvas border-t border-border">
            <ViewTabs />
          </div>

          {/* Bottom bar with zoom + save */}
          <div className="flex items-center justify-between px-4 py-2 border-t border-border bg-background">
            <ZoomControls />
            <button className="px-8 py-2 text-sm font-medium border border-border rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
              Save product
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
