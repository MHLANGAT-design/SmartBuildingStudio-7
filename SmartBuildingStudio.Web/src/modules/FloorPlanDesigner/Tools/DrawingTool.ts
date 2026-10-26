import { BaseTool } from "@/modules/FloorPlanDesigner/Tools/Base/BaseTool";
import { ToolPointerEvent } from "@/modules/FloorPlanDesigner/Tools/Base/ITool";
import { store } from "@/Application/ConfigureStore";

export class DrawingTool extends BaseTool {
  public static readonly ID = "drawing";
  private fileInputHiddenRef?: HTMLInputElement;

  public getId(): string { return DrawingTool.ID; }
  public getName(): string { return "Drawing Blueprint Loader"; }

  protected override onActivate(): void {
    this.setCursor("default");
    this.setStatus("Initializing Blueprint Background Loader Channel...");
    this.triggerBlueprintLifecycle();
  }

  protected override onDeactivate(): void {
    if (this.fileInputHiddenRef) {
      this.fileInputHiddenRef.remove();
    }
  }

  private triggerBlueprintLifecycle(): void {
    const globalDoc = (window as any).__floorPlanActiveDocumentInstance;
    
    // Check if a background blueprint is already active on this floor layer instance
    if (globalDoc?.backgroundImageInstance || globalDoc?.blueprintUrl) {
      this.setStatus(`Blueprint "${globalDoc.name || 'CAD Template'}" active. Ready for wall tracing segment markers.`);
      return;
    }

    this.setStatus("Empty blueprint detected. Prompting system file allocation upload streams...");

    // Mount an invisible input field directly to capture system file streams safely
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".dwg,.dxf,.png,.jpg,.jpeg,.svg";
    input.style.display = "none";
    document.body.appendChild(input);
    this.fileInputHiddenRef = input;

    input.onchange = (event: Event) => {
      const target = event.target as HTMLInputElement;
      const selectedFile = target.files?.[0];
      if (!selectedFile) {
        this.cancel();
        return;
      }

      console.log(`[CAD Source Normalizer]: Transmitting package binary block: ${selectedFile.name}`);

      const fileExtension = selectedFile.name.split('.').pop()?.toLowerCase();
      
      // If uploading standard engineering layouts (PNG/JPG blueprints)
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageElement = new Image();
        imageElement.src = e.target?.result as string;
        imageElement.onload = () => {
          if ((window as any).__floorPlanActiveDocumentInstance) {
            // 🚀 COMMIT BLUEPRINT DIRECTLY TO ACTIVE FLOORS DOCUMENT INSTANCE SOURCE OF TRUTH:
            (window as any).__floorPlanActiveDocumentInstance.backgroundImageInstance = imageElement;
            (window as any).__floorPlanActiveDocumentInstance.documentFileName = selectedFile.name;
            (window as any).__floorPlanActiveDocumentInstance.fileSize = selectedFile.size;
            
            // Set default coordinates offset parameters mapping loops
            (window as any).__floorPlanActiveDocumentInstance.drawingOrigin = { x: 0, y: 0 };
          }

          // Trigger state loop tracking updates
          store.dispatch({ type: "floorPlan/syncDocumentState" });

          // Re-trigger viewport canvas paint sweeps
          window.dispatchEvent(new CustomEvent("sbs:canvas-update"));
          window.dispatchEvent(new CustomEvent("canvas-invalidate"));
          
          this.setStatus(`Blueprint "${selectedFile.name}" successfully attached. Switch to Wall tool to begin tracing vectors.`);
          
          // Auto-return cursor focus safely back to standard selection layout rules
          window.dispatchEvent(new CustomEvent("sbs:tool-change", { detail: { id: "select" } }));
        };
      };
      
      reader.readAsDataURL(selectedFile);
    };

    input.click();
  }

  public override onPointerDown(event: ToolPointerEvent): void {}
  public override onPointerMove(event: ToolPointerEvent): void {}
  public override cancel(): void {
    window.dispatchEvent(new CustomEvent("sbs:tool-change", { detail: { id: "select" } }));
  }
}

export default DrawingTool;
