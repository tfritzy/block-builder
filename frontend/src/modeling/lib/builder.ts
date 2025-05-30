import * as THREE from "three";
import { BlockModificationMode, DbConnection } from "../../module_bindings";

export class Builder {
  private domElement: HTMLElement;
  private dbConn: DbConnection;
  private world: string;
  private currentTool: BlockModificationMode = { tag: "Build" };
  private startPosition: THREE.Vector3 | null = null;
  private isMouseDown: boolean = false;
  private lastPreviewStart: THREE.Vector3 | null = null;
  private lastPreviewEnd: THREE.Vector3 | null = null;

  private boundMouseDown: (event: MouseEvent) => void;
  private boundContextMenu: (event: MouseEvent) => void;

  constructor(dbConn: DbConnection, domElement: HTMLElement, world: string) {
    this.dbConn = dbConn;
    this.domElement = domElement;
    this.world = world;

    this.boundMouseDown = this.onMouseDown.bind(this);
    this.boundContextMenu = this.onContextMenu.bind(this);

    this.domElement.addEventListener("mousedown", this.boundMouseDown);
    this.domElement.addEventListener("contextmenu", this.boundContextMenu);
  }

  private onMouseDown(event: MouseEvent): void {
    if (event.button === 0) {
      this.isMouseDown = true;
    }
  }

  private onContextMenu(event: MouseEvent): void {
    event.preventDefault();
  }

  public setTool(tool: BlockModificationMode): void {
    this.currentTool = tool;
  }

  private modifyBlock(
    tool: BlockModificationMode,
    startPos: THREE.Vector3,
    endPos: THREE.Vector3,
    isPreview: boolean
  ) {
    if (!this.dbConn.isActive) return;

    this.dbConn.reducers.modifyBlock(
      this.world,
      tool,
      { tag: "Block" },
      startPos.x,
      startPos.z,
      startPos.y,
      endPos.x,
      endPos.z,
      endPos.y,
      isPreview
    );
  }

  public onMouseHover(position: THREE.Vector3) {
    if (!this.dbConn.isActive) return;

    if (this.isMouseDown) {
      if (!this.startPosition) {
        this.startPosition = position.clone();
      }

      const currentStart = this.startPosition;
      const currentEnd = position;
      if (
        this.lastPreviewStart &&
        this.lastPreviewEnd &&
        this.lastPreviewStart.equals(currentStart) &&
        this.lastPreviewEnd.equals(currentEnd)
      ) {
        return;
      }

      this.modifyBlock(this.currentTool, currentStart, currentEnd, true);

      this.lastPreviewStart = currentStart.clone();
      this.lastPreviewEnd = currentEnd.clone();
    }
  }

  public onMouseClick(position: THREE.Vector3) {
    if (!this.dbConn.isActive) return;

    const endPos = position;
    const startPos = this.startPosition || position;

    this.modifyBlock(this.currentTool, startPos, endPos, false);

    this.isMouseDown = false;
    this.startPosition = null;
    this.lastPreviewStart = null;
    this.lastPreviewEnd = null;
  }

  dispose() {
    this.domElement.removeEventListener("mousedown", this.boundMouseDown);
    this.domElement.removeEventListener("contextmenu", this.boundContextMenu);
  }
}
